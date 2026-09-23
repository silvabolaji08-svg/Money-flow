import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, PiggyBank, Receipt, Target, Wallet } from "lucide-react";

import { CashFlowChart } from "@/components/charts/cashflow-chart";
import { CategoryDonut } from "@/components/charts/category-donut";
import { IncomeExpenseChart } from "@/components/charts/income-expense-chart";
import { BalanceHero } from "@/components/dashboard/balance-hero";
import { Reveal } from "@/components/motion/reveal";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { BudgetProgress } from "@/components/budgets/budget-progress";
import { GoalProgress } from "@/components/goals/goal-progress";
import { EmptyState } from "@/components/shared/empty-state";
import { SectionCard } from "@/components/shared/section-card";
import { TransactionRow } from "@/components/transactions/transaction-row";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/currency";
import { getDashboardData } from "@/server/queries/dashboard";
import { requireUser } from "@/server/session";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireUser();
  const data = await getDashboardData(user.id);
  const currency = user.currency;

  return (
    <div className="space-y-6">
      <Reveal id="dashboard-hero">
        <BalanceHero name={user.name} stats={data.stats} currency={currency} />
      </Reveal>

      <Reveal id="dashboard-actions">
        <QuickActions />
      </Reveal>

      {!data.hasAnyTransactions ? (
        <EmptyState
          icon={Receipt}
          title="No transactions yet"
          description="Start tracking your money by adding your first transaction. Your balance, charts and insights will fill in from there."
          action={
            <Button asChild>
              <Link href="/transactions">
                Go to transactions
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          }
        />
      ) : null}

      <Reveal id="dashboard-charts" stagger className="grid gap-5 xl:grid-cols-3">
        <SectionCard
          title="Income vs expenses"
          description="Last 6 months"
          className="xl:col-span-2"
          href="/analytics"
          linkLabel="Open analytics"
        >
          <IncomeExpenseChart data={data.series} currency={currency} />

          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border pt-4 text-xs">
            <Legend color="var(--positive)" label="Income" />
            <Legend color="var(--chart-2)" label="Expenses" />
          </div>
        </SectionCard>

        <SectionCard title="Spending by category" description="This month">
          {data.spendingByCategory.length === 0 ? (
            <EmptyState
              icon={PiggyBank}
              title="Nothing spent yet"
              description="Once you record an expense this month, the split will appear here."
              compact
              className="border-0 bg-transparent"
            />
          ) : (
            <>
              <CategoryDonut data={data.spendingByCategory} currency={currency} />

              <ul className="mt-4 space-y-2.5 border-t border-border pt-4">
                {data.spendingByCategory.slice(0, 4).map((slice) => (
                  <li key={slice.id} className="flex items-center gap-3 text-sm">
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: slice.color }}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1 truncate text-muted-foreground">
                      {slice.name}
                    </span>
                    <span className="shrink-0 tnum text-foreground">
                      {formatCurrency(slice.amount, currency, { compactDecimals: true })}
                    </span>
                    <span className="w-10 shrink-0 text-right tnum text-muted-foreground">
                      {slice.share}%
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </SectionCard>
      </Reveal>

      <Reveal id="dashboard-recent" stagger className="grid gap-5 xl:grid-cols-3">
        <SectionCard
          title="Recent transactions"
          description="Your latest activity"
          href="/transactions"
          className="xl:col-span-2"
          bodyClassName="p-3 sm:p-3"
        >
          {data.recentTransactions.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No transactions yet"
              description="Add your first transaction to see it here."
              compact
              className="border-0 bg-transparent"
            />
          ) : (
            <ul className="divide-y divide-border/70">
              {data.recentTransactions.map((transaction) => (
                <li key={transaction.id}>
                  <TransactionRow transaction={transaction} currency={currency} />
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Cash flow" description="Net per month">
          <CashFlowChart data={data.series} currency={currency} />
        </SectionCard>
      </Reveal>

      <Reveal id="dashboard-progress" stagger className="grid gap-5 lg:grid-cols-2">
        <SectionCard
          title="Budget overview"
          description="This month"
          href="/budgets"
          linkLabel="Manage budgets"
        >
          {data.budgets.length === 0 ? (
            <EmptyState
              icon={PiggyBank}
              title="No budgets set"
              description="Set a monthly limit for a category to keep spending in check."
              compact
              className="border-0 bg-transparent"
            />
          ) : (
            <ul className="space-y-5">
              {data.budgets.slice(0, 4).map((budget) => (
                <li key={budget.id}>
                  <BudgetProgress budget={budget} currency={currency} />
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title="Savings goals"
          description="Progress towards your targets"
          href="/goals"
          linkLabel="Manage goals"
        >
          {data.goals.length === 0 ? (
            <EmptyState
              icon={Target}
              title="No savings goals"
              description="Give the money you set aside a name and a target."
              compact
              className="border-0 bg-transparent"
            />
          ) : (
            <ul className="space-y-5">
              {data.goals.map((goal) => (
                <li key={goal.id}>
                  <GoalProgress goal={goal} currency={currency} compact />
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </Reveal>

      {data.accountCount === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Add your first account"
          description="Accounts are where your money lives — cash, a bank account, or a digital wallet. Every transaction belongs to one."
          action={
            <Button asChild>
              <Link href="/accounts">
                Go to accounts
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          }
        />
      ) : null}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-muted-foreground">
      <span
        className="size-2 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}
