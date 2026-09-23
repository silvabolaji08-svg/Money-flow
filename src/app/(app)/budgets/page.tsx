import type { Metadata } from "next";
import { Suspense } from "react";
import { PiggyBank } from "lucide-react";

import { AddBudgetButton } from "@/components/budgets/add-budget-button";
import { BudgetCard } from "@/components/budgets/budget-card";
import { MonthSwitcher } from "@/components/budgets/month-switcher";
import { AnimatedAmount, AnimatedPercent } from "@/components/motion/animated-number";
import { TransitionPanel } from "@/components/motion/reveal";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMonthYear, monthKey, utcStartOfMonth } from "@/lib/dates";
import { cn } from "@/lib/utils";
import {
  listBudgetableCategories,
  listBudgets,
  summariseBudgets,
} from "@/server/queries/budgets";
import { requireUser } from "@/server/session";

export const metadata: Metadata = {
  title: "Budgets",
  description: "Set monthly spending limits and track how much of each is left.",
};

/** Falls back to the current month when the query string is missing or bad. */
function resolveMonth(value: unknown): Date {
  if (typeof value === "string" && /^\d{4}-\d{2}$/.test(value)) {
    const [year, month] = value.split("-").map(Number);
    const parsed = new Date(Date.UTC(year, month - 1, 1));
    if (!Number.isNaN(parsed.valueOf())) return parsed;
  }
  return utcStartOfMonth(new Date());
}

export default async function BudgetsPage(props: PageProps<"/budgets">) {
  const user = await requireUser();
  const searchParams = await props.searchParams;

  const month = resolveMonth(searchParams.month);
  const currentMonthKey = monthKey(month);

  const [budgets, categories] = await Promise.all([
    listBudgets(user.id, month),
    listBudgetableCategories(user.id, month),
  ]);

  const summary = summariseBudgets(budgets);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Budgets"
        description="Give each spending category a monthly ceiling, and see how much room is left."
        actions={
          <>
            <Suspense fallback={<Skeleton className="h-10 w-48" />}>
              <MonthSwitcher month={currentMonthKey} />
            </Suspense>
            <AddBudgetButton />
          </>
        }
      />

      {budgets.length === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title={`No budgets for ${formatMonthYear(month)}`}
          description="Pick a category and set a monthly limit. Spending is tracked against it automatically from your transactions."
          action={<AddBudgetButton label="Create your first budget" />}
        />
      ) : (
        <>
          <section className="surface grid gap-5 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-4">
            <SummaryStat label="Budgeted">
              <AnimatedAmount
                value={summary.totalBudgeted}
                currency={user.currency}
                className="text-xl font-semibold text-foreground"
              />
            </SummaryStat>

            <SummaryStat label="Spent">
              <AnimatedAmount
                value={summary.totalSpent}
                currency={user.currency}
                className="text-xl font-semibold text-foreground"
              />
            </SummaryStat>

            <SummaryStat label="Remaining">
              <AnimatedAmount
                value={summary.totalRemaining}
                currency={user.currency}
                className={cn(
                  "text-xl font-semibold",
                  Number(summary.totalRemaining) < 0 ? "text-negative" : "text-positive",
                )}
              />
            </SummaryStat>

            <SummaryStat label="Used">
              <AnimatedPercent
                value={summary.percentUsed}
                className={cn(
                  "text-xl font-semibold",
                  summary.percentUsed > 100
                    ? "text-negative"
                    : summary.percentUsed >= 80
                      ? "text-warning"
                      : "text-foreground",
                )}
              />
            </SummaryStat>
          </section>

          {summary.exceededCount > 0 || summary.warningCount > 0 ? (
            <p className="text-sm text-muted-foreground">
              {summary.exceededCount > 0
                ? `${summary.exceededCount} budget${
                    summary.exceededCount === 1 ? " is" : "s are"
                  } over the limit`
                : `${summary.warningCount} budget${
                    summary.warningCount === 1 ? " is" : "s are"
                  } close to the limit`}{" "}
              this month.
            </p>
          ) : null}

          <TransitionPanel
            transitionKey={currentMonthKey}
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
          >
            {budgets.map((budget) => (
              <BudgetCard
                key={budget.id}
                budget={budget}
                currency={user.currency}
                categories={categories}
                month={currentMonthKey}
              />
            ))}
          </TransitionPanel>
        </>
      )}
    </div>
  );
}

function SummaryStat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
