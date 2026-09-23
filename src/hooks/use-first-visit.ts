"use client";

import { useEffect, useState } from "react";

/**
 * Routes whose entrance animation has already played in this page session.
 *
 * Deliberately in memory rather than in `sessionStorage`: a full page load is
 * genuinely a first arrival and should animate, while moving between screens
 * inside the app should not replay the welcome every time. It also sidesteps
 * a hydration mismatch, because the set is empty on both sides of the first
 * render.
 */
const seen = new Set<string>();

/**
 * True the first time a screen mounts in this page session, false afterwards.
 *
 * Entrance animations are a welcome, not a toll. Replaying them every time
 * someone returns to the dashboard makes a fast app feel slow.
 */
export function useFirstVisit(key: string): boolean {
  const [isFirstVisit] = useState(() => {
    // On the server every request is a first visit; the module-level set must
    // never leak state between requests.
    if (typeof window === "undefined") return true;
    return !seen.has(key);
  });

  useEffect(() => {
    seen.add(key);
  }, [key]);

  return isFirstVisit;
}
