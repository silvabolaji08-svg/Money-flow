"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import {
  goalContributionSchema,
  savingsGoalSchema,
  savingsGoalUpdateSchema,
} from "@/lib/validations";
import {
  failure,
  success,
  toActionError,
  zodFieldErrors,
  type ActionResult,
} from "@/server/action-result";
import { dec, money } from "@/server/money";
import { requireUserId } from "@/server/session";

function revalidateGoals() {
  revalidatePath("/goals");
  revalidatePath("/dashboard");
  revalidatePath("/analytics");
}

export async function createGoalAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = savingsGoalSchema.safeParse(input);

  if (!parsed.success) {
    return failure("Please check the highlighted fields.", zodFieldErrors(parsed.error));
  }

  try {
    const userId = await requireUserId();
    const { name, targetAmount, currentAmount, targetDate, description, color } = parsed.data;

    const starting = money(currentAmount || "0");
    const target = money(targetAmount);

    const goal = await prisma.savingsGoal.create({
      data: {
        userId,
        name,
        targetAmount: target,
        currentAmount: starting,
        targetDate: targetDate ? new Date(targetDate) : null,
        description: description || null,
        color: color || null,
        completedAt: starting.greaterThanOrEqualTo(target) ? new Date() : null,
        contributions: starting.isZero()
          ? undefined
          : { create: [{ amount: starting, note: "Starting balance" }] },
      },
      select: { id: true },
    });

    revalidateGoals();
    return success({ id: goal.id });
  } catch (error) {
    return toActionError(error, "We could not create that goal.");
  }
}

export async function updateGoalAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = savingsGoalUpdateSchema.safeParse(input);

  if (!parsed.success) {
    return failure("Please check the highlighted fields.", zodFieldErrors(parsed.error));
  }

  try {
    const userId = await requireUserId();
    const { id, name, targetAmount, targetDate, description, color } = parsed.data;

    const existing = await prisma.savingsGoal.findFirst({
      where: { id, userId },
      select: { currentAmount: true },
    });

    if (!existing) {
      return failure("We could not find that goal.");
    }

    const target = money(targetAmount);

    await prisma.savingsGoal.update({
      where: { id },
      data: {
        name,
        targetAmount: target,
        targetDate: targetDate ? new Date(targetDate) : null,
        description: description || null,
        color: color || null,
        completedAt: dec(existing.currentAmount).greaterThanOrEqualTo(target) ? new Date() : null,
      },
    });

    revalidateGoals();
    return success({ id });
  } catch (error) {
    return toActionError(error, "We could not update that goal.");
  }
}

/**
 * Adds to or withdraws from a goal. The balance and its contribution history
 * are written in one transaction so they can never disagree, and a withdrawal
 * can never take the balance below zero.
 */
export async function contributeToGoalAction(
  input: unknown,
): Promise<ActionResult<{ id: string; currentAmount: string }>> {
  const parsed = goalContributionSchema.safeParse(input);

  if (!parsed.success) {
    return failure("Please check the highlighted fields.", zodFieldErrors(parsed.error));
  }

  try {
    const userId = await requireUserId();
    const { goalId, amount, direction, note } = parsed.data;

    const goal = await prisma.savingsGoal.findFirst({
      where: { id: goalId, userId },
      select: { id: true, currentAmount: true, targetAmount: true },
    });

    if (!goal) {
      return failure("We could not find that goal.");
    }

    const delta = direction === "withdraw" ? money(amount).negated() : money(amount);
    const nextAmount = dec(goal.currentAmount).plus(delta);

    if (nextAmount.isNegative()) {
      return failure("You cannot withdraw more than the goal currently holds.", {
        amount: ["More than the goal holds"],
      });
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.goalContribution.create({
        data: { goalId: goal.id, amount: delta, note: note || null },
      });

      return tx.savingsGoal.update({
        where: { id: goal.id },
        data: {
          currentAmount: nextAmount,
          completedAt: nextAmount.greaterThanOrEqualTo(dec(goal.targetAmount))
            ? new Date()
            : null,
        },
        select: { id: true, currentAmount: true },
      });
    });

    revalidateGoals();
    return success({
      id: updated.id,
      currentAmount: dec(updated.currentAmount).toFixed(2),
    });
  } catch (error) {
    return toActionError(error, "We could not update that goal.");
  }
}

export async function deleteGoalAction(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const userId = await requireUserId();

    const result = await prisma.savingsGoal.deleteMany({ where: { id, userId } });

    if (result.count === 0) {
      return failure("We could not find that goal.");
    }

    revalidateGoals();
    return success({ id });
  } catch (error) {
    return toActionError(error, "We could not delete that goal.");
  }
}
