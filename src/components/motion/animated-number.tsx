"use client";

import { useCallback, useEffect, useRef } from "react";

import {
  formatCurrency,
  formatPercent,
  toNumber,
  type CurrencyCode,
  type MoneyInput,
} from "@/lib/currency";
import { DURATION, easeInOut, easeOut } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useFirstVisit } from "@/hooks/use-first-visit";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

type Formatter = (value: number) => string;

type AnimatedNumberProps = {
  value: number;
  format: Formatter;
  className?: string;
  /** Skip the animation entirely. */
  animate?: boolean;
  /**
   * Count up only the first time this key is seen in the page session. Use it
   * for headline figures so returning to a screen does not replay the count.
   * Values that later change still animate to their new figure.
   */
  once?: string;
  durationMs?: number;
};

/**
 * A figure that animates to its value.
 *
 * On first paint it counts up from zero. When the value later changes — a
 * budget is edited, a date range is switched — it travels from the previous
 * figure to the new one, which shows the *direction* of the change, not just
 * the result.
 *
 * Frames are written straight to the DOM node. A headline figure should not
 * cost a React render per frame, and nothing else on the page depends on the
 * intermediate values. The element always carries the true final figure in its
 * `aria-label`, so assistive technology reads the number, never the animation.
 */
function AnimatedNumber({
  value,
  format,
  className,
  animate = true,
  once,
  durationMs = DURATION.counter,
}: AnimatedNumberProps) {
  const nodeRef = useRef<HTMLSpanElement | null>(null);
  const previous = useRef<number | null>(null);
  const reducedMotion = useReducedMotion();

  // The hook is always called; its result is only consulted when `once` is set.
  const firstVisit = useFirstVisit(once ?? "animated-number");
  const allowFirstCount = once === undefined || firstVisit;

  useEffect(() => {
    const node = nodeRef.current;
    const from = previous.current;
    previous.current = value;

    if (!node) return;

    // Nothing to travel from, or motion is unwelcome: show the figure.
    // A repeat visit skips the opening count-up but still animates a value
    // that genuinely changed while the screen was mounted.
    if (!animate || reducedMotion || from === value || (from === null && !allowFirstCount)) {
      node.textContent = format(value);
      return;
    }

    const start = from ?? 0;
    // A first count-up decelerates; a change between two real values eases
    // symmetrically, which reads as a value moving rather than arriving.
    const ease = from === null ? easeOut : easeInOut;
    const startedAt = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / durationMs, 1);
      node.textContent = format(start + (value - start) * ease(progress));

      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        node.textContent = format(value);
      }
    };

    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      node.textContent = format(value);
    };
  }, [value, format, animate, durationMs, reducedMotion, allowFirstCount]);

  const final = format(value);

  return (
    <span className={cn("tnum", className)} aria-label={final}>
      <span ref={nodeRef} aria-hidden="true">
        {final}
      </span>
    </span>
  );
}

type AnimatedAmountProps = {
  value: MoneyInput;
  currency: CurrencyCode;
  className?: string;
  animate?: boolean;
  once?: string;
  signed?: boolean;
  compactDecimals?: boolean;
  durationMs?: number;
};

/** A monetary figure that animates to its value. */
export function AnimatedAmount({
  value,
  currency,
  className,
  animate = true,
  once,
  signed = false,
  compactDecimals = false,
  durationMs,
}: AnimatedAmountProps) {
  const amount = toNumber(value);

  // Memoised so the animation effect only restarts when the formatting
  // genuinely changes, not on every parent render.
  const format = useCallback(
    (current: number) => formatCurrency(current, currency, { signed, compactDecimals }),
    [currency, signed, compactDecimals],
  );

  return (
    <AnimatedNumber
      value={amount}
      format={format}
      className={className}
      animate={animate}
      once={once}
      durationMs={durationMs}
    />
  );
}

type AnimatedPercentProps = {
  value: number;
  className?: string;
  animate?: boolean;
  once?: string;
  fractionDigits?: number;
  durationMs?: number;
};

/** A percentage that animates to its value. */
export function AnimatedPercent({
  value,
  className,
  animate = true,
  once,
  fractionDigits = 1,
  durationMs,
}: AnimatedPercentProps) {
  const format = useCallback(
    (current: number) => formatPercent(current, fractionDigits),
    [fractionDigits],
  );

  return (
    <AnimatedNumber
      value={value}
      format={format}
      className={className}
      animate={animate}
      once={once}
      durationMs={durationMs}
    />
  );
}

type AnimatedCountProps = {
  value: number;
  className?: string;
  animate?: boolean;
  once?: string;
  durationMs?: number;
};

/** A whole-number count, such as "42 transactions". */
export function AnimatedCount({
  value,
  className,
  animate = true,
  once,
  durationMs = DURATION.ui * 2,
}: AnimatedCountProps) {
  const format = useCallback((current: number) => String(Math.round(current)), []);

  return (
    <AnimatedNumber
      value={value}
      format={format}
      className={className}
      animate={animate}
      once={once}
      durationMs={durationMs}
    />
  );
}
