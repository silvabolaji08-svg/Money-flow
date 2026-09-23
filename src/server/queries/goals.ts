import "server-only";
import { differenceInCalendarDays } from "date-fns";

import { prisma } from "@/lib/prisma";
import { dec, percentOf, toMoneyString } from "@/server/money";
import type { SavingsGoalDTO } from "@/types";

export async function listSavingsGoals(userId: string): Promise<SavingsGoalDTO[]> {
  const goals = await prisma.savingsGoal.findMany({
    where: { userId },
    orderBy: [{ completedAt: "asc" }, { createdAt: "desc" }],
    include: {
      contributions: {
        orderBy: { occurredAt: "desc" },
        take: 5,
      },
    },
  });

  const today = new Date();

  return goals.map((goal) => {
    const target = dec(goal.targetAmount);
    const current = dec(goal.currentAmount);
    const remaining = target.minus(current);
    const percentComplete = Math.min(percentOf(current, target), 100);

    return {
      id: goal.id,
      name: goal.name,
      targetAmount: toMoneyString(target),
      currentAmount: toMoneyString(current),
      remaining: toMoneyString(remaining.isNegative() ? dec(0) : remaining),
      percentComplete,
      targetDate: goal.targetDate ? goal.targetDate.toISOString() : null,
      description: goal.description,
      color: goal.color,
      completed: current.greaterThanOrEqualTo(target),
      daysRemaining: goal.targetDate
        ? differenceInCalendarDays(goal.targetDate, today)
        : null,
      contributions: goal.contributions.map((contribution) => ({
        id: contribution.id,
        amount: toMoneyString(contribution.amount),
        note: contribution.note,
        occurredAt: contribution.occurredAt.toISOString(),
      })),
    } satisfies SavingsGoalDTO;
  });
}

export function summariseGoals(goals: SavingsGoalDTO[]) {
  const totalSaved = goals.reduce((total, goal) => total.plus(dec(goal.currentAmount)), dec(0));
  const totalTarget = goals.reduce((total, goal) => total.plus(dec(goal.targetAmount)), dec(0));

  return {
    totalSaved: toMoneyString(totalSaved),
    totalTarget: toMoneyString(totalTarget),
    percentComplete: Math.min(percentOf(totalSaved, totalTarget), 100),
    completedCount: goals.filter((goal) => goal.completed).length,
    activeCount: goals.filter((goal) => !goal.completed).length,
  };
}

export async function getSavingsGoal(userId: string, id: string) {
  return prisma.savingsGoal.findFirst({ where: { id, userId } });
}
