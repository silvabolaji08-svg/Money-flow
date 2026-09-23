"use client";

import { useMediaQuery } from "@/hooks/use-media-query";

/**
 * True when the visitor has asked their system to reduce motion.
 *
 * CSS handles this on its own through the `prefers-reduced-motion` block in
 * `globals.css`. This hook is for the animations that run in JavaScript, which
 * need to skip straight to their final value rather than animate over an
 * almost-zero duration.
 */
export function useReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}
