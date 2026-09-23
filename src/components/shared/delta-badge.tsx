import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

import { formatSignedPercent } from "@/lib/currency";
import { cn } from "@/lib/utils";

type DeltaBadgeProps = {
  /** Percentage change. `null` means there is no prior period to compare with. */
  value: number | null;
  /**
   * For expenses, a rise is bad. Set to "inverse" so the colour reflects the
   * financial meaning rather than the arithmetic sign.
   */
  polarity?: "normal" | "inverse" | "neutral";
  label?: string;
  className?: string;
  /** Show percentage points instead of percent, for rates. */
  unit?: "percent" | "points";
};

export function DeltaBadge({
  value,
  polarity = "normal",
  label,
  className,
  unit = "percent",
}: DeltaBadgeProps) {
  if (value === null || Number.isNaN(value)) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 text-xs text-muted-foreground",
          className,
        )}
      >
        <Minus className="size-3" aria-hidden="true" />
        No prior data
      </span>
    );
  }

  const rising = value > 0;
  const flat = value === 0;

  const good =
    polarity === "neutral"
      ? null
      : polarity === "inverse"
        ? !rising
        : rising;

  const Icon = flat ? Minus : rising ? ArrowUpRight : ArrowDownRight;

  const display =
    unit === "points"
      ? `${value > 0 ? "+" : ""}${value.toFixed(1).replace(/\.0$/, "")} pts`
      : formatSignedPercent(value);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium tnum",
        flat || good === null
          ? "bg-muted text-muted-foreground"
          : good
            ? "bg-positive-muted text-positive"
            : "bg-negative-muted text-negative",
        className,
      )}
    >
      <Icon className="size-3" aria-hidden="true" />
      {display}
      {label ? <span className="font-normal opacity-80">{label}</span> : null}
    </span>
  );
}
