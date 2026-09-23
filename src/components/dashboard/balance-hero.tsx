import { format } from "date-fns";

import {
  AnimatedAmount,
  AnimatedPercent,
} from "@/components/motion/animated-number";
import { DeltaBadge } from "@/components/shared/delta-badge";
import type { CurrencyCode } from "@/lib/currency";
import { greetingFor } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { DashboardStats } from "@/types";

type BalanceHeroProps = {
  name: string;
  stats: DashboardStats;
  currency: CurrencyCode;
};

/**
 * The single most important thing on the screen: how much money there is,
 * how it moved, and the four figures that explain why.
 */
export function BalanceHero({ name, stats, currency }: BalanceHeroProps) {
  const firstName = name.split(" ")[0];
  const today = new Date();

  return (
    <section className="relative overflow-hidden rounded-3xl border border-border bg-card">
      <div className="hero-sheen absolute inset-0" aria-hidden="true" />
      <div
        className="grid-lines absolute inset-0 opacity-[0.35] [mask-image:radial-gradient(120%_100%_at_0%_0%,black,transparent_70%)]"
        aria-hidden="true"
      />

      <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-12">
        <div>
          <p className="text-sm text-muted-foreground">
            {greetingFor(today)}, <span className="text-foreground">{firstName}</span>
            <span className="mx-2 text-border" aria-hidden="true">
              ·
            </span>
            <time dateTime={today.toISOString()}>{format(today, "EEEE d MMMM")}</time>
          </p>

          <p className="mt-6 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Total balance
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
            <AnimatedAmount
              value={stats.totalBalance}
              currency={currency}
              once="dashboard-headline"
              className="text-[2.35rem] font-semibold leading-none tracking-[-0.035em] text-foreground sm:text-[3.15rem]"
            />
            <DeltaBadge value={stats.balanceChange} label="this month" />
          </div>

          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
            Across all of your active accounts, updated the moment a transaction is recorded.
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:gap-x-10 lg:border-l lg:border-border lg:pl-10">
          <HeroStat label="Income this month">
            <AnimatedAmount
              value={stats.monthlyIncome}
              currency={currency}
              once="dashboard-headline"
              className="text-lg font-semibold text-positive sm:text-xl"
            />
            <DeltaBadge value={stats.incomeChange} className="mt-1.5" />
          </HeroStat>

          <HeroStat label="Expenses this month">
            <AnimatedAmount
              value={stats.monthlyExpenses}
              currency={currency}
              once="dashboard-headline"
              className="text-lg font-semibold text-foreground sm:text-xl"
            />
            <DeltaBadge value={stats.expenseChange} polarity="inverse" className="mt-1.5" />
          </HeroStat>

          <HeroStat label="Net cash flow">
            <AnimatedAmount
              value={stats.netCashFlow}
              currency={currency}
              signed
              once="dashboard-headline"
              className={cn(
                "text-lg font-semibold sm:text-xl",
                Number(stats.netCashFlow) > 0 && "text-positive",
                Number(stats.netCashFlow) < 0 && "text-negative",
              )}
            />
            <DeltaBadge value={stats.netChange} className="mt-1.5" />
          </HeroStat>

          <HeroStat label="Savings rate">
            <AnimatedPercent
              value={stats.savingsRate}
              once="dashboard-headline"
              className={cn(
                "text-lg font-semibold sm:text-xl",
                stats.savingsRate >= 20
                  ? "text-positive"
                  : stats.savingsRate >= 0
                    ? "text-foreground"
                    : "text-negative",
              )}
            />
            <DeltaBadge value={stats.savingsRateChange} unit="points" className="mt-1.5" />
          </HeroStat>
        </dl>
      </div>
    </section>
  );
}

function HeroStat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1.5 flex flex-col items-start">{children}</dd>
    </div>
  );
}
