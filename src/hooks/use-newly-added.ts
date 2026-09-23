"use client";

import { useState } from "react";

type Snapshot = {
  key: string;
  known: Set<string>;
  added: Set<string>;
};

/**
 * Identifies which ids have appeared since the previous render.
 *
 * Used to animate genuinely new rows without animating the whole list. The
 * first render reports nothing: when a list first appears every row is "new",
 * and flashing all of them is noise rather than feedback.
 *
 * The comparison happens during render using the documented "adjust state
 * while rendering" pattern, so a newly added row carries its animation class
 * on the very first paint — deferring it to an effect would make the row
 * appear and then restart from transparent.
 */
export function useNewlyAdded(ids: string[]): ReadonlySet<string> {
  const key = ids.join("|");

  const [snapshot, setSnapshot] = useState<Snapshot>(() => ({
    key,
    known: new Set(ids),
    added: new Set(),
  }));

  if (snapshot.key !== key) {
    const added = new Set<string>();
    for (const id of ids) {
      if (!snapshot.known.has(id)) added.add(id);
    }

    setSnapshot({ key, known: new Set(ids), added });
    // React re-renders immediately with the new snapshot; this pass is thrown
    // away, so it reports nothing rather than a stale set.
    return new Set<string>();
  }

  return snapshot.added;
}
