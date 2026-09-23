import { AnimatedAmount, AnimatedPercent } from "@/components/motion/animated-number";
import { ProgressBar } from "@/components/motion/progress-bar";
import { CategoryIcon } from "@/components/shared/category-icon";
import { Amount } from "@/components/shared/money";
import type { CurrencyCode } from "@/lib/currency";
import { cn } from "@/lib/utils";
import type { BudgetDTO } from "@/types";

const STATUS_STYLES = {
  "on-track": { fill: "var(--brand)", text: "text-muted-foreground" },
  warning: { fill: "var(--warning)", text: "text-warning" },
  exceeded: { fill: "var(--negative)", text: "text-negative" },
} as const;

type BudgetProgressProps = {
  budget: BudgetDTO;
  currency: CurrencyCode;
  className?: string;
  action?: React.ReactNode;
};

/**
 * A budget as a single readable line: what it is, how much of it is gone, and
 * what is left.
 *
 * The bar fills from empty on first paint and travels to its new value when
 * the budget or its spending changes. It is capped at 100%: overspend is
 * communicated by the colour and by the remaining figure turning negative,
 * never by a bar that runs past its own track.
 */
export function BudgetProgress({ budget, currency, className, action }: BudgetProgressProps) {
  const styles = STATUS_STYLES[budget.status];
  const overspent = budget.status === "exceeded";

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-3">
        <CategoryIcon icon={budget.category.icon} color={budget.category.color} size="sm" />

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <p className="truncate text-sm font-medium text-foreground">
              {budget.category.name}
            </p>
            <p className="shrink-0 text-sm tnum text-muted-foreground">
              <AnimatedAmount
                value={budget.spent}
                currency={currency}
                className="text-foreground"
              />
              <span className="mx-1 text-border" aria-hidden="true">
                /
              </span>
              <Amount value={budget.amount} currency={currency} />
            </p>
          </div>
        </div>

        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      <ProgressBar
        value={budget.percentUsed}
        color={styles.fill}
        label={`${budget.category.name} budget used`}
      />

      <div className="flex items-center justify-between gap-3 text-xs">
        <span className={cn("font-medium", styles.text)}>
          <AnimatedPercent value={budget.percentUsed} /> used
        </span>
        <span className="tnum text-muted-foreground">
          {overspent ? "Over by " : "Remaining "}
          <Amount
            value={overspent ? budget.remaining.replace("-", "") : budget.remaining}
            currency={currency}
            className={overspent ? "text-negative" : "text-foreground"}
          />
        </span>
      </div>
    </div>
  );
}
