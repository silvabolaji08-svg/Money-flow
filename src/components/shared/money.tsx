import { formatCurrency, toNumber, type CurrencyCode, type MoneyInput } from "@/lib/currency";
import { cn } from "@/lib/utils";

type AmountProps = {
  value: MoneyInput;
  currency: CurrencyCode;
  className?: string;
  /** Render a leading + or −. */
  signed?: boolean;
  /** Colour the figure green/red by sign. */
  colorBySign?: boolean;
  compactDecimals?: boolean;
};

/**
 * The single place money is rendered. Uses tabular figures so amounts align
 * in lists and tables, and keeps sign colouring consistent across the app.
 */
export function Amount({
  value,
  currency,
  className,
  signed = false,
  colorBySign = false,
  compactDecimals = false,
}: AmountProps) {
  const numeric = toNumber(value);

  return (
    <span
      className={cn(
        "tnum",
        colorBySign && numeric > 0 && "text-positive",
        colorBySign && numeric < 0 && "text-negative",
        className,
      )}
    >
      {formatCurrency(value, currency, { signed, compactDecimals })}
    </span>
  );
}

type TransactionAmountProps = {
  value: MoneyInput;
  type: "INCOME" | "EXPENSE";
  currency: CurrencyCode;
  className?: string;
};

/** Income reads as +, expense as −, with the matching semantic colour. */
export function TransactionAmount({
  value,
  type,
  currency,
  className,
}: TransactionAmountProps) {
  const isIncome = type === "INCOME";

  return (
    <span
      className={cn(
        "tnum font-medium",
        isIncome ? "text-positive" : "text-foreground",
        className,
      )}
    >
      {isIncome ? "+" : "−"}
      {formatCurrency(value, currency)}
    </span>
  );
}
