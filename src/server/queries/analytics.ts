import "server-only";
import { prisma } from "@/lib/prisma";
import {
  PERIOD_PRESETS,
  previousPeriod,
  utcStartOfMonth,
  type DateRange,
  type PeriodPreset,
} from "@/lib/dates";
import { buildInsights } from "@/server/insights";
import { dec, percentChange, savingsRate, toMoneyString } from "@/server/money";
import type { AnalyticsData } from "@/types";

import {
  averageExpense,
  categoryBreakdown,
  categorySpendMap,
  monthlySeries,
  totalsForRange,
} from "./aggregates";
import { listAccounts } from "./accounts";
import { listBudgets } from "./budgets";
import { listSavingsGoals } from "./goals";
import { serialiseTransaction } from "./transactions";

export async function getAnalytics(
  userId: string,
  preset: PeriodPreset,
  range: DateRange,
  now: Date = new Date(),
): Promise<AnalyticsData> {
  const comparison = previousPeriod(range);

  const [
    current,
    previous,
    series,
    spendingByCategory,
    incomeByCategory,
    previousSpendByCategory,
    accounts,
    budgets,
    goals,
    topExpenseRows,
    avgExpense,
  ] = await Promise.all([
    totalsForRange(userId, range),
    totalsForRange(userId, comparison),
    monthlySeries(userId, range),
    categoryBreakdown(userId, range, "EXPENSE"),
    categoryBreakdown(userId, range, "INCOME"),
    categorySpendMap(userId, comparison),
    listAccounts(userId),
    listBudgets(userId, utcStartOfMonth(now)),
    listSavingsGoals(userId),
    prisma.transaction.findMany({
      where: { userId, type: "EXPENSE", date: { gte: range.from, lte: range.to } },
      orderBy: { amount: "desc" },
      take: 5,
      include: {
        account: { select: { id: true, name: true, type: true } },
        category: { select: { id: true, name: true, icon: true, color: true, kind: true } },
      },
    }),
    averageExpense(userId, range),
  ]);

  const label =
    PERIOD_PRESETS.find((option) => option.value === preset)?.label ?? "This month";

  return {
    range: { from: range.from.toISOString(), to: range.to.toISOString(), label },
    totals: {
      income: toMoneyString(current.income),
      expenses: toMoneyString(current.expenses),
      net: toMoneyString(current.net),
      savingsRate: savingsRate(current.income, current.expenses),
      transactionCount: current.count,
      averageExpense: avgExpense,
    },
    changes: {
      income: percentChange(current.income, previous.income),
      expenses: percentChange(current.expenses, previous.expenses),
      net: percentChange(current.net, previous.net),
    },
    series,
    spendingByCategory,
    incomeByCategory,
    accountBalances: accounts
      .filter((account) => !account.archived)
      .map((account) => ({
        id: account.id,
        name: account.name,
        balance: dec(account.balance).toNumber(),
        type: account.type,
      })),
    topExpenses: topExpenseRows.map(serialiseTransaction),
    insights: buildInsights({
      current,
      previous,
      spendingByCategory,
      previousSpendByCategory,
      budgets: budgets.map((budget) => ({
        categoryName: budget.category.name,
        percentUsed: budget.percentUsed,
        status: budget.status,
      })),
      goals: goals.map((goal) => ({
        name: goal.name,
        percentComplete: goal.percentComplete,
        completed: goal.completed,
      })),
      periodLabel: label,
    }),
  };
}
