"use client";

import { useEffect, useRef } from "react";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

type ProgressBarProps = {
  /** 0–100. Values above 100 are clamped; overspend is stated in words. */
  value: number;
  /** Any CSS colour, including a custom property such as `var(--brand)`. */
  color?: string;
  className?: string;
  /** Accessible name, e.g. "Food budget used". */
  label: string;
};

/**
 * A progress bar that fills to its value.
 *
 * The fill is a full-width block moved with `translateX`, the same technique
 * the Radix progress primitive uses. Translating is cheap for the compositor
 * and, unlike scaling, it does not distort the rounded cap — the track's own
 * overflow clips the part that hangs off to the left.
 *
 * The transform is written straight to the node. The bar renders empty, then
 * moves to its value on the next frame, so the CSS transition has two states
 * to travel between. Later changes transition from wherever the bar currently
 * is, which is what makes an edited budget or a topped-up goal visibly move
 * rather than jump.
 */
export function ProgressBar({
  value,
  color = "var(--brand)",
  className,
  label,
}: ProgressBarProps) {
  const target = Math.max(0, Math.min(value, 100));
  const reducedMotion = useReducedMotion();
  const fillRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = fillRef.current;
    if (!node) return;

    if (reducedMotion) {
      node.style.transform = `translateX(-${100 - target}%)`;
      return;
    }

    const frame = requestAnimationFrame(() => {
      node.style.transform = `translateX(-${100 - target}%)`;
    });

    return () => cancelAnimationFrame(frame);
  }, [target, reducedMotion]);

  return (
    <div
      className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}
      role="progressbar"
      aria-valuenow={Math.round(target)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        ref={fillRef}
        className="h-full w-full rounded-full will-change-transform"
        style={{
          backgroundColor: color,
          // Starts empty; the effect moves it to the real value.
          transform: "translateX(-100%)",
          transition: "transform var(--mf-duration-content) var(--mf-ease-out)",
        }}
      />
    </div>
  );
}
