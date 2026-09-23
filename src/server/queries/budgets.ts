import "server-only";

import { utcEndOfMonth, utcStartOfMonth } from "@/lib/dates";

import { prisma } from "@/lib/prisma";
import { dec, percentOf, toMoneyString } from "@/server/money";
import type { BudgetDTO } from "@/types";

const WARNING_THRESHOLD = 80;

function statusFor(percentUsed: number): BudgetDTO["status"] {
  if (percentUsed > 100) return "exceeded";
  if (percentUsed >= WARNING_THRESHOLD) return "warning";
  return "on-track";
}

/**
 * Budgets for a month, with spend calculated live from transactions in that
 * month for the budgeted category. Editing or deleting a transaction is
 * reflected immediately — nothing is denormalised.
 */
export async function listBudgets(userId: string, month: Date): Promise<BudgetDTO[]> {
  const monthStart = utcStartOfMonth(month);
  const windowStart = monthStart;
  const windowEnd = utcEndOfMonth(month);

  const budgets = await prisma.budget.findMany({
    where: { userId, month: monthStart },
    include: {
      category: { select: { id: true, name: true, icon: true, color: true } },
    },
    orderBy: { amount: "desc" },
  });

  if (budgets.length === 0) return [];

  const spendByCategory = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: {
      userId,
      type: "EXPENSE",
      categoryId: { in: budgets.map((budget) => budget.categoryId) },
      date: { gte: windowStart, lte: windowEnd },
    },
    _sum: { amount: true },
  });

  const spendMap = new Map(
    spendByCategory.map((row) => [row.categoryId, dec(row._sum.amount)]),
  );

  return budgets.map((budget) => {
    const spent = spendMap.get(budget.categoryId) ?? dec(0);
    const amount = dec(budget.amount);
    const remaining = amount.minus(spent);
    const percentUsed = percentOf(spent, amount);

    return {
      id: budget.id,
      amount: toMoneyString(amount),
      spent: toMoneyString(spent),
      remaining: toMoneyString(remaining),
      percentUsed,
      month: monthStart.toISOString(),
      note: budget.note,
      status: statusFor(percentUsed),
      category: budget.category,
    } satisfies BudgetDTO;
  });
}

export type BudgetSummary = {
  totalBudgeted: string;
  totalSpent: string;
  totalRemaining: string;
  percentUsed: number;
  exceededCount: number;
  warningCount: number;
};

export function summariseBudgets(budgets: BudgetDTO[]): BudgetSummary {
  const totalBudgeted = budgets.reduce((total, budget) => total.plus(dec(budget.amount)), dec(0));
  const totalSpent = budgets.reduce((total, budget) => total.plus(dec(budget.spent)), dec(0));

  return {
    totalBudgeted: toMoneyString(totalBudgeted),
    totalSpent: toMoneyString(totalSpent),
    totalRemaining: toMoneyString(totalBudgeted.minus(totalSpent)),
    percentUsed: percentOf(totalSpent, totalBudgeted),
    exceededCount: budgets.filter((budget) => budget.status === "exceeded").length,
    warningCount: budgets.filter((budget) => budget.status === "warning").length,
  };
}

/** Categories that do not yet have a budget for the given month. */
export async function listBudgetableCategories(userId: string, month: Date) {
  const monthStart = utcStartOfMonth(month);

  const [categories, existing] = await Promise.all([
    prisma.category.findMany({
      where: { userId, kind: "EXPENSE" },
      select: { id: true, name: true, icon: true, color: true },
      orderBy: { name: "asc" },
    }),
    prisma.budget.findMany({
      where: { userId, month: monthStart },
      select: { categoryId: true },
    }),
  ]);

  const taken = new Set(existing.map((budget) => budget.categoryId));
  return categories.map((category) => ({ ...category, taken: taken.has(category.id) }));
}
