import { Prisma } from "@/generated/prisma/client";

/**
 * Server-side money arithmetic.
 *
 * Every monetary value in MoneyFlow is a Postgres DECIMAL(18,2) and is
 * manipulated as a Decimal. Floating-point arithmetic is never used for
 * balances, budget usage or goal progress — only for ratios that are already
 * being rendered as a percentage.
 */

export const Decimal = Prisma.Decimal;
export type Decimal = Prisma.Decimal;

export type DecimalInput = Prisma.Decimal | string | number | null | undefined;

export const ZERO = new Prisma.Decimal(0);

export function dec(value: DecimalInput): Prisma.Decimal {
  if (value === null || value === undefined || value === "") return new Prisma.Decimal(0);
  if (typeof value === "string" || typeof value === "number") return new Prisma.Decimal(value);
  return new Prisma.Decimal(value.toString());
}

export function sum(values: DecimalInput[]): Prisma.Decimal {
  return values.reduce<Prisma.Decimal>((total, value) => total.plus(dec(value)), new Prisma.Decimal(0));
}

/** Rounds to 2 decimal places, half-up — the rule used for stored money. */
export function money(value: DecimalInput): Prisma.Decimal {
  return dec(value).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
}

/** Serialises a Decimal for a Client Component boundary. Always "0.00" safe. */
export function toMoneyString(value: DecimalInput): string {
  return money(value).toFixed(2);
}

/**
 * Percentage change between two periods, as a float for display only.
 * Returns null when there is no previous value to compare against, so the UI
 * can say "no prior data" instead of inventing a misleading "+100%".
 */
export function percentChange(current: DecimalInput, previous: DecimalInput): number | null {
  const prev = dec(previous);
  const curr = dec(current);

  if (prev.isZero()) {
    return curr.isZero() ? 0 : null;
  }

  return curr.minus(prev).dividedBy(prev.abs()).times(100).toDecimalPlaces(2).toNumber();
}

/** Share of `part` within `total`, clamped to [0, ∞), as a display float. */
export function percentOf(part: DecimalInput, total: DecimalInput): number {
  const whole = dec(total);
  if (whole.isZero()) return 0;
  return dec(part).dividedBy(whole).times(100).toDecimalPlaces(2).toNumber();
}

/**
 * Savings rate = (income − expenses) / income.
 * Undefined when there is no income; we surface 0 rather than NaN.
 */
export function savingsRate(income: DecimalInput, expenses: DecimalInput): number {
  const earned = dec(income);
  if (earned.lessThanOrEqualTo(0)) return 0;
  return earned.minus(dec(expenses)).dividedBy(earned).times(100).toDecimalPlaces(2).toNumber();
}
