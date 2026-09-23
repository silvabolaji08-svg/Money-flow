"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * A tiny store over one `localStorage` key.
 *
 * Reads go through `useSyncExternalStore` so the value is correct on the first
 * client render and stays in sync across tabs. Every access is guarded: in a
 * private window, or with site data blocked, storage can throw, and the caller
 * simply falls back to the supplied default.
 */
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);

  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function useLocalStorageFlag(key: string, fallback = false) {
  const getSnapshot = useCallback(() => read(key), [key]);

  const raw = useSyncExternalStore(subscribe, getSnapshot, () => null);
  const value = raw === null ? fallback : raw === "true";

  const setValue = useCallback(
    (next: boolean) => {
      try {
        window.localStorage.setItem(key, String(next));
      } catch {
        // Storage unavailable — the preference just will not persist.
      }
      notify();
    },
    [key],
  );

  return [value, setValue] as const;
}
