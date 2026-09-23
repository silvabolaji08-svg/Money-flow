import { CalendarDays, Check } from "lucide-react";

import { AnimatedAmount, AnimatedPercent } from "@/components/motion/animated-number";
import { ProgressBar } from "@/components/motion/progress-bar";
import { Amount } from "@/components/shared/money";
import type { CurrencyCode } from "@/lib/currency";
import { formatTransactionDate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { SavingsGoalDTO } from "@/types";

type GoalProgressProps = {
  goal: SavingsGoalDTO;
  currency: CurrencyCode;
  className?: string;
  action?: React.ReactNode;
  compact?: boolean;
};

/**
 * A savings goal: how much is set aside, how much is left, and how close the
 * target is.
 *
 * The bar, the amount and the percentage all move together when money is
 * added, so a contribution reads as one change rather than three.
 */
export function GoalProgress({
  goal,
  currency,
  className,
  action,
  compact = false,
}: GoalProgressProps) {
  const accent = goal.color ?? "var(--savings)";
  const overdue = goal.daysRemaining !== null && goal.daysRemaining < 0 && !goal.completed;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 truncate text-sm font-medium text-foreground">
            {goal.completed ? (
              <span
                className="inline-flex size-4 items-center justify-center rounded-full bg-positive text-positive-foreground animate-pop-in"
                aria-hidden="true"
              >
                <Check className="size-2.5" strokeWidth={3} />
              </span>
            ) : null}
            {goal.name}
          </p>

          {!compact && goal.description ? (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{goal.description}</p>
          ) : null}
        </div>

        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm tnum">
          <AnimatedAmount
            value={goal.currentAmount}
            currency={currency}
            className="font-semibold text-foreground"
          />
          <span className="mx-1 text-border" aria-hidden="true">
            /
          </span>
          <Amount value={goal.targetAmount} currency={currency} className="text-muted-foreground" />
        </p>
        {/* Inline colour because the accent is per-goal, chosen by the user. */}
        <span className="shrink-0 text-sm font-medium" style={{ color: accent }}>
          <AnimatedPercent value={goal.percentComplete} />
        </span>
      </div>

      <ProgressBar
        value={goal.percentComplete}
        color={accent}
        label={`${goal.name} progress`}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="tnum">
          {goal.completed ? (
            <span className="font-medium text-positive">Fully funded</span>
          ) : (
            <>
              <Amount value={goal.remaining} currency={currency} className="text-foreground" /> to go
            </>
          )}
        </span>

        {goal.targetDate ? (
          <span className={cn("inline-flex items-center gap-1.5", overdue && "text-warning")}>
            <CalendarDays className="size-3.5" aria-hidden="true" />
            <time dateTime={goal.targetDate}>{formatTransactionDate(goal.targetDate)}</time>
            {goal.daysRemaining !== null && !goal.completed ? (
              <span className="tnum">
                ({overdue ? `${Math.abs(goal.daysRemaining)}d late` : `${goal.daysRemaining}d left`})
              </span>
            ) : null}
          </span>
        ) : null}
      </div>
    </div>
  );
}
