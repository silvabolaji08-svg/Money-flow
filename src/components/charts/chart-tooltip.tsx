"use client";

import { formatCurrency, type CurrencyCode } from "@/lib/currency";

export type TooltipEntry = {
  name?: string;
  dataKey?: string | number;
  value?: number | string;
  color?: string;
  payload?: Record<string, unknown>;
};

type ChartTooltipProps = {
  active?: boolean;
  label?: string | number;
  payload?: TooltipEntry[];
  currency: CurrencyCode;
  /** Override the series labels, keyed by dataKey. */
  labels?: Record<string, string>;
  /** Append a footer line, e.g. the net figure. */
  footer?: (payload: TooltipEntry[]) => string | null;
};

/**
 * One tooltip shape for every chart: same surface, same type scale, currency
 * formatted with the user's own currency.
 */
export function ChartTooltip({
  active,
  label,
  payload,
  currency,
  labels,
  footer,
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  const footerText = footer?.(payload) ?? null;

  return (
    <div className="min-w-[10rem] rounded-xl border border-border bg-popover p-3 shadow-[var(--shadow-lifted)]">
      {label !== undefined ? (
        <p className="mb-2 text-xs font-medium text-muted-foreground">{label}</p>
      ) : null}

      <div className="space-y-1.5">
        {payload.map((entry, index) => {
          const key = String(entry.dataKey ?? entry.name ?? index);

          return (
            <div key={key} className="flex items-center justify-between gap-4 text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: entry.color }}
                  aria-hidden="true"
                />
                {labels?.[key] ?? entry.name ?? key}
              </span>
              <span className="font-medium tnum text-foreground">
                {formatCurrency(Number(entry.value ?? 0), currency)}
              </span>
            </div>
          );
        })}
      </div>

      {footerText ? (
        <p className="mt-2 border-t border-border pt-2 text-xs text-muted-foreground">
          {footerText}
        </p>
      ) : null}
    </div>
  );
}
