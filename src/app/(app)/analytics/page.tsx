import type { Metadata } from "next";
import { Suspense } from "react";
import { ChartPie, Receipt } from "lucide-react";

import { InsightList } from "@/components/analytics/insight-list";
import { PeriodPicker } from "@/components/analytics/period-picker";
import { CashFlowChart } from "@/components/charts/cashflow-chart";
import { CategoryDonut } from "@/components/charts/category-donut";
import { IncomeExpenseChart } from "@/components/charts/income-expense-chart";
import { AnimatedAmount, AnimatedPercent } from "@/components/motion/animated-number";
import { TransitionPanel } from "@/components/motion/reveal";
import { DeltaBadge } from "@/components/shared/delta-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Amount } from "@/components/shared/money";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { TransactionRow } from "@/components/transactions/transaction-row";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { isPeriodPreset, resolvePeriod, type PeriodPreset } from "@/lib/dates";
import { getAnalytics } from "@/server/queries/analytics";
import { requireUser } from "@/server/session";

export const metadata: Metadata = {
  title: "Analytics",
  description: "Understand your income, spending and savings behaviour over time.",
};

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string" || !value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? null : parsed;
}

export default async function AnalyticsPage(props: PageProps<"/analytics">) {
  const user = await requireUser();
  const searchParams = await props.searchParams;

  const rawPeriod = typeof searchParams.period === "string" ? searchParams.period : "this-month";
  const preset: PeriodPreset = isPeriodPreset(rawPeriod) ? rawPeriod : "this-month";

  const from = parseDate(searchParams.from);
  const to = parseDate(searchParams.to);

  const range = resolvePeriod(preset, new Date(), { from, to });
  const data = await getAnalytics(user.id, preset, range);
  const currency = user.currency;

  const hasActivity = data.totals.transactionCount > 0;

  // Everything below the header is re-computed for the selected window, so it
  // fades back in as one block when the range changes.
  const rangeKey = `${preset}:${data.range.from}:${data.range.to}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Where your money comes from, where it goes, and how that is changing."
        actions={
          <Suspense fallback={<Skeleton className="h-10 w-44" />}>
            <PeriodPicker
              preset={preset}
              from={from ? from.toISOString().slice(0, 10) : ""}
              to={to ? to.toISOString().slice(0, 10) : ""}
            />
          </Suspense>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total income" caption={data.range.label}>
          <AnimatedAmount
            value={data.totals.income}
            currency={currency}
            className="text-2xl font-semibold text-positive"
          />
          <DeltaBadge value={data.changes.income} className="mt-2" />
        </MetricCard>

        <MetricCard label="Total expenses" caption={data.range.label}>
          <AnimatedAmount
            value={data.totals.expenses}
            currency={currency}
            className="text-2xl font-semibold text-foreground"
          />
          <DeltaBadge value={data.changes.expenses} polarity="inverse" className="mt-2" />
        </MetricCard>

        <MetricCard label="Net savings" caption="Income minus expenses">
          <AnimatedAmount
            value={data.totals.net}
            currency={currency}
            signed
            className={cn(
              "text-2xl font-semibold",
              Number(data.totals.net) > 0 && "text-positive",
              Number(data.totals.net) < 0 && "text-negative",
            )}
          />
          <DeltaBadge value={data.changes.net} className="mt-2" />
        </MetricCard>

        <MetricCard label="Savings rate" caption="Share of income kept">
          <AnimatedPercent
            value={data.totals.savingsRate}
            className="text-2xl font-semibold text-foreground"
          />
          <p className="mt-2 text-xs text-muted-foreground tnum">
            {data.totals.transactionCount} transactions · avg expense{" "}
            {formatCurrency(data.totals.averageExpense, currency, { compactDecimals: true })}
          </p>
        </MetricCard>
      </section>

      {!hasActivity ? (
        <EmptyState
          icon={ChartPie}
          title="No activity in this period"
          description="Choose a different date range, or record some transactions to see your trends here."
        />
      ) : null}

      <TransitionPanel transitionKey={rangeKey} className="space-y-6">
        <SectionCard title="Income and expense trend" description={data.range.label}>
          <IncomeExpenseChart data={data.series} currency={currency} height={320} />
        </SectionCard>

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard title="Spending by category" description="Where the money went">
          {data.spendingByCategory.length === 0 ? (
            <EmptyState
              icon={ChartPie}
              title="No expenses recorded"
              description="Expenses in this period will be broken down here."
              compact
              className="border-0 bg-transparent"
            />
          ) : (
            <>
              <CategoryDonut data={data.spendingByCategory} currency={currency} height={240} />
              <CategoryList slices={data.spendingByCategory} currency={currency} />
            </>
          )}
        </SectionCard>

        <SectionCard title="Income by source" description="Where the money came from">
          {data.incomeByCategory.length === 0 ? (
            <EmptyState
              icon={ChartPie}
              title="No income recorded"
              description="Income in this period will be broken down here."
              compact
              className="border-0 bg-transparent"
            />
          ) : (
            <>
              <CategoryDonut
                data={data.incomeByCategory}
                currency={currency}
                height={240}
                centerLabel="Total earned"
              />
              <CategoryList slices={data.incomeByCategory} currency={currency} />
            </>
          )}
        </SectionCard>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <SectionCard title="Cash flow" description="Net per month" className="lg:col-span-2">
          <CashFlowChart data={data.series} currency={currency} height={260} />
        </SectionCard>

        <SectionCard title="Account balances" description="Active accounts">
          {data.accountBalances.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No accounts"
              description="Add an account to see its balance here."
              compact
              className="border-0 bg-transparent"
            />
          ) : (
            <ul className="space-y-3">
              {data.accountBalances.map((account) => (
                <li key={account.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate text-muted-foreground">{account.name}</span>
                  <Amount
                    value={account.balance}
                    currency={currency}
                    className="shrink-0 font-medium text-foreground"
                    compactDecimals
                  />
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

        <SectionCard title="Insights" description="Observations from your own numbers">
          <InsightList insights={data.insights} />
        </SectionCard>

        {data.topExpenses.length > 0 ? (
          <SectionCard
            title="Largest expenses"
            description={data.range.label}
            bodyClassName="p-3 sm:p-3"
          >
            <ul className="divide-y divide-border/70">
              {data.topExpenses.map((transaction) => (
                <li key={transaction.id}>
                  <TransactionRow transaction={transaction} currency={currency} />
                </li>
              ))}
            </ul>
          </SectionCard>
        ) : null}
      </TransitionPanel>
    </div>
  );
}

function MetricCard({
  label,
  caption,
  children,
}: {
  label: string;
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <article className="surface surface-hover p-5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="mt-2 flex flex-col items-start">{children}</div>
      <p className="mt-3 text-[0.7rem] text-muted-foreground">{caption}</p>
    </article>
  );
}

function CategoryList({
  slices,
  currency,
}: {
  slices: { id: string; name: string; color: string; amount: number; share: number }[];
  currency: Parameters<typeof formatCurrency>[1];
}) {
  return (
    <ul className="mt-4 space-y-2.5 border-t border-border pt-4">
      {slices.slice(0, 6).map((slice) => (
        <li key={slice.id} className="flex items-center gap-3 text-sm">
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: slice.color }}
            aria-hidden="true"
          />
          <span className="min-w-0 flex-1 truncate text-muted-foreground">{slice.name}</span>
          <span className="shrink-0 tnum text-foreground">
            {formatCurrency(slice.amount, currency, { compactDecimals: true })}
          </span>
          <span className="w-11 shrink-0 text-right tnum text-muted-foreground">
            {slice.share}%
          </span>
        </li>
      ))}
    </ul>
  );
}
