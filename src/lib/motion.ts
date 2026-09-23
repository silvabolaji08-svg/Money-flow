/**
 * The motion scale, mirrored from `globals.css` for the animations that have
 * to run in JavaScript (counting numbers, progress fills, row removal).
 *
 * Keeping one set of numbers means a CSS hover and a JS-driven counter feel
 * like they belong to the same product.
 */
export const DURATION = {
  /** Hover, press, focus, toggles. */
  micro: 140,
  /** Dropdowns, popovers, list rows, progress fills. */
  ui: 220,
  /** Page and panel transitions, modals. */
  content: 360,
  /** Headline figures counting up. Long enough to read, short enough to skip. */
  counter: 700,
} as const;

/** Matches `--mf-ease-out`: decelerating, for things arriving on screen. */
export const easeOut = (t: number): number => 1 - Math.pow(1 - t, 3);

/**
 * Matches `--mf-ease-in-out`: used when a value moves between two real states,
 * such as a budget figure changing after an edit.
 */
export const easeInOut = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/** How long a row spends animating out before it is removed from the DOM. */
export const ROW_EXIT_MS = 180;
