import { describe, expect, it } from "vitest";

import {
  currentMonthRange,
  formatTransactionDate,
  monthKey,
  monthLabel,
  monthsBetween,
  normaliseBudgetMonth,
  parseDateOnly,
  previousMonthRange,
  previousPeriod,
  resolvePeriod,
  toDateInputValue,
} from "@/lib/dates";

/**
 * A fixed "now" keeps these assertions stable regardless of when they run.
 * Everything is UTC: a transaction belongs to a calendar date, not an instant,
 * so the month it lands in must not depend on the reader's timezone.
 */
const NOW = new Date(Date.UTC(2026, 2, 17, 14, 30)); // 17 March 2026

describe("parseDateOnly", () => {
  it("turns a date input value into UTC midnight", () => {
    const parsed = parseDateOnly("2026-03-17");

    expect(parsed.toISOString()).toBe("2026-03-17T00:00:00.000Z");
    expect(parsed.getUTCHours()).toBe(0);
  });

  it("keeps the first of the month on the first of the month", () => {
    // The case that silently moves a transaction into the previous month when
    // local midnight is used instead of UTC.
    expect(parseDateOnly("2026-06-01").toISOString()).toBe("2026-06-01T00:00:00.000Z");
    expect(monthKey(parseDateOnly("2026-06-01"))).toBe("2026-06");
  });

  it("snaps any other parseable value to the start of its UTC day", () => {
    expect(parseDateOnly(new Date(Date.UTC(2026, 2, 17, 23, 59))).toISOString()).toBe(
      "2026-03-17T00:00:00.000Z",
    );
  });
});

describe("resolvePeriod", () => {
  it("covers the whole of the current month", () => {
    const range = resolvePeriod("this-month", NOW);

    expect(range.from.toISOString()).toBe("2026-03-01T00:00:00.000Z");
    expect(range.to.getUTCDate()).toBe(31);
    expect(range.to.getUTCHours()).toBe(23);
  });

  it("covers the whole of the previous month", () => {
    const range = resolvePeriod("last-month", NOW);

    expect(range.from.getUTCMonth()).toBe(1);
    expect(range.to.getUTCMonth()).toBe(1);
    expect(range.to.getUTCDate()).toBe(28); // 2026 is not a leap year
  });

  it("spans three and six month windows inclusive of the current month", () => {
    expect(monthsBetween(resolvePeriod("last-3-months", NOW))).toHaveLength(3);
    expect(monthsBetween(resolvePeriod("last-6-months", NOW))).toHaveLength(6);
  });

  it("covers the calendar year", () => {
    const range = resolvePeriod("this-year", NOW);

    expect(range.from.getUTCMonth()).toBe(0);
    expect(range.to.getUTCMonth()).toBe(11);
    expect(monthsBetween(range)).toHaveLength(12);
  });

  it("uses the supplied dates for a custom range, including the whole final day", () => {
    const range = resolvePeriod("custom", NOW, {
      from: new Date(Date.UTC(2026, 0, 10)),
      to: new Date(Date.UTC(2026, 1, 20)),
    });

    expect(range.from.toISOString()).toBe("2026-01-10T00:00:00.000Z");
    expect(range.to.toISOString()).toBe("2026-02-20T23:59:59.999Z");
  });

  it("falls back to the current month when a custom range is incomplete", () => {
    const range = resolvePeriod("custom", NOW, { from: null, to: null });
    expect(range.from.getUTCMonth()).toBe(2);
  });

  it("handles a year boundary when stepping back a month", () => {
    const january = new Date(Date.UTC(2026, 0, 15));
    const range = resolvePeriod("last-month", january);

    expect(range.from.getUTCFullYear()).toBe(2025);
    expect(range.from.getUTCMonth()).toBe(11);
  });
});

describe("previousPeriod", () => {
  it("returns an equally long window ending just before the range starts", () => {
    const range = resolvePeriod("this-month", NOW);
    const previous = previousPeriod(range);

    expect(previous.to.getTime()).toBeLessThan(range.from.getTime());

    const rangeSpan = range.to.getTime() - range.from.getTime();
    const previousSpan = previous.to.getTime() - previous.from.getTime();
    expect(Math.abs(rangeSpan - previousSpan)).toBeLessThanOrEqual(1);
  });
});

describe("month helpers", () => {
  it("normalises a budget month to the first UTC day", () => {
    const normalised = normaliseBudgetMonth(new Date(Date.UTC(2026, 2, 23, 18, 45)));

    expect(normalised.toISOString()).toBe("2026-03-01T00:00:00.000Z");
  });

  it("gives the current and previous month ranges", () => {
    expect(currentMonthRange(NOW).from.getUTCMonth()).toBe(2);
    expect(previousMonthRange(NOW).from.getUTCMonth()).toBe(1);
  });

  it("produces the key the SQL aggregate also produces", () => {
    expect(monthKey(new Date(Date.UTC(2026, 5, 1)))).toBe("2026-06");
    expect(monthKey(new Date(Date.UTC(2026, 11, 1)))).toBe("2026-12");
  });

  it("labels a month for a chart axis", () => {
    expect(monthLabel(new Date(Date.UTC(2026, 5, 1)))).toBe("Jun 2026");
  });

  it("lists every month in a range, oldest first, crossing a year boundary", () => {
    const months = monthsBetween({
      from: new Date(Date.UTC(2025, 10, 5)),
      to: new Date(Date.UTC(2026, 1, 20)),
    });

    expect(months.map(monthKey)).toEqual(["2025-11", "2025-12", "2026-01", "2026-02"]);
  });
});

describe("display formatting", () => {
  it("reads the UTC day back, so the date never slips backwards", () => {
    const stored = parseDateOnly("2026-03-01");

    expect(formatTransactionDate(stored)).toBe("1 Mar 2026");
    expect(toDateInputValue(stored)).toBe("2026-03-01");
  });

  it("round-trips a date through the form and back", () => {
    const input = "2026-12-31";
    expect(toDateInputValue(parseDateOnly(input))).toBe(input);
  });

  it("formats an ISO string coming back from the server", () => {
    expect(formatTransactionDate("2026-07-04T00:00:00.000Z")).toBe("4 Jul 2026");
  });
});
