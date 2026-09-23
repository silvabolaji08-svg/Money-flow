"use client";

import { useSyncExternalStore } from "react";

// The store never changes, so the subscribe callback is a no-op.
const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * True once React has hydrated on the client.
 *
 * Components that read browser-only state (theme, `localStorage`, media
 * queries) use this to render the same markup on both sides of hydration.
 * `useSyncExternalStore` is the supported way to do this — setting state from
 * an effect causes a second render pass on every mount.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}
