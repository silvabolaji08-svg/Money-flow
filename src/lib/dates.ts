/**
 * Date handling for a ledger.
 *
 * A transaction belongs to a *calendar date*, not to an instant: money spent
 * on the 1st belongs to that month no matter which timezone the browser is in.
 * So dates are stored at UTC midnight, every period boundary is computed in
 * UTC, and display formatting reads the UTC components back. Mixing local and
 * UTC boundaries is what silently moves a transaction into the wrong month.
 */

export type DateRange = { from: Date; to: Date };

export const PERIOD_PRESETS = [
  { value: "this-month", label: "This month" },
  { value: "last-month", label: "Last month" },
  { value: "last-3-months", label: "Last 3 months" },
  { value: "last-6-months", label: "Last 6 months" },
  { value: "this-year", label: "This year" },
  { value: "custom", label: "Custom range" },
] as const;

export type PeriodPreset = (typeof PERIOD_PRESETS)[number]["value"];

export function isPeriodPreset(value: string): value is PeriodPreset {
  return PERIOD_PRESETS.some((preset) => preset.value === value);
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/* -------------------------------------------------------------------------
   UTC building blocks
------------------------------------------------------------------------- */

export function utcStartOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export function utcEndOfMonth(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 23, 59, 59, 999),
  );
}

export function utcAddMonths(date: Date, count: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + count, 1));
}

export function utcStartOfDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export function utcEndOfDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999),
  );
}

/**
 * Turns a `yyyy-MM-dd` value from a date input into UTC midnight on that day.
 * Anything else parseable is snapped to the start of its UTC day.
 */
export function parseDateOnly(value: string | Date): Date {
  if (value instanceof Date) return utcStartOfDay(value);

  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (match) {
    return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  }

  return utcStartOfDay(new Date(value));
}

/* -------------------------------------------------------------------------
   Periods
------------------------------------------------------------------------- */

/**
 * Resolves a named period into an inclusive [from, to] range.
 * `now` is injectable so the calculation is deterministic in tests.
 */
export function resolvePeriod(
  preset: PeriodPreset,
  now: Date = new Date(),
  custom?: { from?: Date | null; to?: Date | null },
): DateRange {
  switch (preset) {
    case "last-month": {
      const previous = utcAddMonths(now, -1);
      return { from: utcStartOfMonth(previous), to: utcEndOfMonth(previous) };
    }
    case "last-3-months":
      return { from: utcStartOfMonth(utcAddMonths(now, -2)), to: utcEndOfMonth(now) };
    case "last-6-months":
      return { from: utcStartOfMonth(utcAddMonths(now, -5)), to: utcEndOfMonth(now) };
    case "this-year":
      return {
        from: new Date(Date.UTC(now.getUTCFullYear(), 0, 1)),
        to: new Date(Date.UTC(now.getUTCFullYear(), 11, 31, 23, 59, 59, 999)),
      };
    case "custom":
      return {
        from: custom?.from ? utcStartOfDay(custom.from) : utcStartOfMonth(now),
        to: custom?.to ? utcEndOfDay(custom.to) : utcEndOfDay(now),
      };
    case "this-month":
    default:
      return { from: utcStartOfMonth(now), to: utcEndOfMonth(now) };
  }
}

/** The equally long window immediately before `range`, for period-over-period deltas. */
export function previousPeriod(range: DateRange): DateRange {
  const span = range.to.getTime() - range.from.getTime();
  return {
    from: new Date(range.from.getTime() - span - 1),
    to: new Date(range.from.getTime() - 1),
  };
}

export function currentMonthRange(now: Date = new Date()): DateRange {
  return { from: utcStartOfMonth(now), to: utcEndOfMonth(now) };
}

export function previousMonthRange(now: Date = new Date()): DateRange {
  const previous = utcAddMonths(now, -1);
  return { from: utcStartOfMonth(previous), to: utcEndOfMonth(previous) };
}

/** Budgets are keyed to the first instant of their month, in UTC. */
export function normaliseBudgetMonth(value: Date | string): Date {
  const date = typeof value === "string" ? new Date(value) : value;
  return utcStartOfMonth(date);
}

/** "2026-06" — the key both the chart axis and the SQL aggregate agree on. */
export function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(date: Date): string {
  return `${MONTH_NAMES[date.getUTCMonth()].slice(0, 3)} ${date.getUTCFullYear()}`;
}

/** Ordered list of UTC month starts covering a range, oldest first. */
export function monthsBetween(range: DateRange): Date[] {
  const months: Date[] = [];
  let cursor = utcStartOfMonth(range.from);
  const last = utcStartOfMonth(range.to);

  while (cursor <= last) {
    months.push(cursor);
    cursor = utcAddMonths(cursor, 1);
  }

  return months;
}

/* -------------------------------------------------------------------------
   Display
------------------------------------------------------------------------- */

function asDate(value: Date | string): Date {
  return typeof value === "string" ? new Date(value) : value;
}

/** "17 Mar 2026", read from the UTC components so the day never slips. */
export function formatTransactionDate(value: Date | string): string {
  const date = asDate(value);
  return `${date.getUTCDate()} ${MONTH_NAMES[date.getUTCMonth()].slice(0, 3)} ${date.getUTCFullYear()}`;
}

export function formatDayMonth(value: Date | string): string {
  const date = asDate(value);
  return `${date.getUTCDate()} ${MONTH_NAMES[date.getUTCMonth()].slice(0, 3)}`;
}

export function formatMonthYear(value: Date | string): string {
  const date = asDate(value);
  return `${MONTH_NAMES[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/** The value a `<input type="date">` expects. */
export function toDateInputValue(value: Date | string): string {
  const date = asDate(value);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(
    date.getUTCDate(),
  ).padStart(2, "0")}`;
}

/** Greeting follows the reader's own clock, so this one is deliberately local. */
export function greetingFor(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
