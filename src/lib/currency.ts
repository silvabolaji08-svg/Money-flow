/**
 * Currency presentation helpers.
 *
 * Pure and dependency-free so they can run on the server and in the browser.
 * Monetary values cross the network as decimal *strings* (never floats), and
 * are only converted to `number` at the last moment, for display.
 */

export const CURRENCIES = {
  NGN: { code: "NGN", symbol: "₦", label: "Nigerian Naira", locale: "en-NG" },
  USD: { code: "USD", symbol: "$", label: "US Dollar", locale: "en-US" },
  EUR: { code: "EUR", symbol: "€", label: "Euro", locale: "en-IE" },
  GBP: { code: "GBP", symbol: "£", label: "British Pound", locale: "en-GB" },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

export const CURRENCY_CODES = Object.keys(CURRENCIES) as CurrencyCode[];

export function isCurrencyCode(value: string): value is CurrencyCode {
  return value in CURRENCIES;
}

export function currencySymbol(currency: CurrencyCode): string {
  return CURRENCIES[currency].symbol;
}

/** Accepts the decimal strings returned by the server, or plain numbers. */
export type MoneyInput = string | number | null | undefined;

export function toNumber(value: MoneyInput): number {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

type FormatOptions = {
  /** Drop the ".00" tail. Useful in dense tables and axis labels. */
  compactDecimals?: boolean;
  /** Always render a leading + or -. */
  signed?: boolean;
};

export function formatCurrency(
  value: MoneyInput,
  currency: CurrencyCode = "NGN",
  options: FormatOptions = {},
): string {
  const amount = toNumber(value);
  const meta = CURRENCIES[currency] ?? CURRENCIES.NGN;
  const fractionDigits =
    options.compactDecimals && Number.isInteger(amount) ? 0 : 2;

  const formatted = new Intl.NumberFormat(meta.locale, {
    style: "currency",
    currency: meta.code,
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(Math.abs(amount));

  if (options.signed) {
    if (amount > 0) return `+${formatted}`;
    if (amount < 0) return `-${formatted}`;
    return formatted;
  }

  return amount < 0 ? `-${formatted}` : formatted;
}

/** Short form for chart axes and tight cards: ₦2.4M, ₦850K. */
export function formatCompactCurrency(
  value: MoneyInput,
  currency: CurrencyCode = "NGN",
): string {
  const amount = toNumber(value);
  const meta = CURRENCIES[currency] ?? CURRENCIES.NGN;
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";

  if (abs < 1000) {
    return `${sign}${meta.symbol}${abs.toFixed(0)}`;
  }

  const formatted = new Intl.NumberFormat(meta.locale, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(abs);

  return `${sign}${meta.symbol}${formatted}`;
}

export function formatPercent(value: number, fractionDigits = 1): string {
  if (!Number.isFinite(value)) return "0%";
  return `${value.toFixed(fractionDigits).replace(/\.0$/, "")}%`;
}

export function formatSignedPercent(value: number, fractionDigits = 1): string {
  if (!Number.isFinite(value) || value === 0) return "0%";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(fractionDigits).replace(/\.0$/, "")}%`;
}

/**
 * Parses user keyboard input ("1,250.50", "₦1 250") into a plain decimal
 * string suitable for Zod + Prisma. Returns null when nothing usable is left.
 */
export function parseAmountInput(raw: string): string | null {
  const cleaned = raw.replace(/[^\d.-]/g, "");
  if (!cleaned || cleaned === "-" || cleaned === ".") return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value)) return null;
  return cleaned;
}
