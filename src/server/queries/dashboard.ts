import "server-only";
import { prisma } from "@/lib/prisma";
import {
  currentMonthRange,
  previousMonthRange,
  utcAddMonths,
  utcStartOfMonth,
} from "@/lib/dates";
import { percentChange, savingsRate, toMoneyString } from "@/server/money";
import type { DashboardData } from "@/types";

import { getTotalBalance } from "./accounts";
import { categoryBreakdown, monthlySeries, totalsForRange } from "./aggregates";
import { listBudgets } from "./budgets";
import { listSavingsGoals } from "./goals";
import { listRecentTransactions } from "./transactions";

/**
 * Everything the dashboard renders, in one pass. All figures are derived from
 * the user's transactions — nothing is stored pre-computed or hardcoded.
 */
export async function getDashboardData(
  userId: string,
  now: Date = new Date(),
): Promise<DashboardData> {
  const thisMonth = currentMonthRange(now);
  const lastMonth = previousMonthRange(now);
  const trailing = { from: utcStartOfMonth(utcAddMonths(now, -5)), to: thisMonth.to };

  const [
    totalBalance,
    current,
    previous,
    series,
    spendingByCategory,
    recentTransactions,
    budgets,
    goals,
    accountCount,
    transactionCount,
  ] = await Promise.all([
    getTotalBalance(userId),
    totalsForRange(userId, thisMonth),
    totalsForRange(userId, lastMonth),
    monthlySeries(userId, trailing),
    categoryBreakdown(userId, thisMonth, "EXPENSE"),
    listRecentTransactions(userId, 6),
    listBudgets(userId, utcStartOfMonth(now)),
    listSavingsGoals(userId),
    prisma.account.count({ where: { userId, archived: false } }),
    prisma.transaction.count({ where: { userId } }),
  ]);

  const currentRate = savingsRate(current.income, current.expenses);
  const previousRate = savingsRate(previous.income, previous.expenses);

  // Balance at the end of last month = today's balance minus this month's net.
  const balanceLastMonth = totalBalance.minus(current.net);

  return {
    stats: {
      totalBalance: toMoneyString(totalBalance),
      monthlyIncome: toMoneyString(current.income),
      monthlyExpenses: toMoneyString(current.expenses),
      netCashFlow: toMoneyString(current.net),
      savingsRate: currentRate,
      balanceChange: percentChange(totalBalance, balanceLastMonth),
      incomeChange: percentChange(current.income, previous.income),
      expenseChange: percentChange(current.expenses, previous.expenses),
      netChange: percentChange(current.net, previous.net),
      savingsRateChange:
        previous.income.isZero() && current.income.isZero()
          ? null
          : Number((currentRate - previousRate).toFixed(1)),
    },
    series,
    spendingByCategory,
    recentTransactions,
    budgets,
    goals: goals.slice(0, 4),
    accountCount,
    hasAnyTransactions: transactionCount > 0,
  };
}

/** True when the user has no accounts yet — drives the onboarding empty state. */
export async function isNewUser(userId: string) {
  const count = await prisma.account.count({ where: { userId } });
  return count === 0;
}
