"use client";

import type { ReactNode } from "react";

import { useFirstVisit } from "@/hooks/use-first-visit";
import { cn } from "@/lib/utils";

type RevealProps = {
  children: ReactNode;
  /**
   * Identifies the screen. The entrance plays the first time this id mounts
   * in the page session and is skipped on later visits.
   */
  id: string;
  /** Stagger direct children instead of moving the whole block at once. */
  stagger?: boolean;
  className?: string;
};

/**
 * Plays a screen's entrance animation once per page session.
 *
 * A thin client wrapper: the content inside stays a Server Component, so this
 * costs one element and no extra data on the wire.
 */
export function Reveal({ children, id, stagger = false, className }: RevealProps) {
  const first = useFirstVisit(id);

  return (
    <div className={cn(first && (stagger ? "stagger" : "animate-rise"), className)}>
      {children}
    </div>
  );
}

type TransitionPanelProps = {
  children: ReactNode;
  /** Changing this fades the panel back in — a filter, tab or date range. */
  transitionKey: string;
  className?: string;
};

/**
 * Cross-fades its content whenever `transitionKey` changes.
 *
 * Used where the same region is re-populated with different data: switching a
 * settings tab, changing an analytics date range, re-filtering a list. The
 * change reads as the content being replaced rather than the page flickering.
 */
export function TransitionPanel({
  children,
  transitionKey,
  className,
}: TransitionPanelProps) {
  return (
    <div key={transitionKey} className={cn("animate-fade", className)}>
      {children}
    </div>
  );
}
