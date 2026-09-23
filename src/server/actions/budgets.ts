"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { budgetSchema, budgetUpdateSchema } from "@/lib/validations";
import {
  failure,
  success,
  toActionError,
  zodFieldErrors,
  type ActionResult,
} from "@/server/action-result";
import { money } from "@/server/money";
import { requireUserId } from "@/server/session";

/** "2026-03" -> 2026-03-01T00:00:00.000Z */
function monthToDate(month: string): Date {
  const [year, monthIndex] = month.split("-").map(Number);
  return new Date(Date.UTC(year, monthIndex - 1, 1));
}

function revalidateBudgets() {
  revalidatePath("/budgets");
  revalidatePath("/dashboard");
  revalidatePath("/analytics");
}

export async function createBudgetAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = budgetSchema.safeParse(input);

  if (!parsed.success) {
    return failure("Please check the highlighted fields.", zodFieldErrors(parsed.error));
  }

  try {
    const userId = await requireUserId();
    const { categoryId, amount, month, note } = parsed.data;

    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId, kind: "EXPENSE" },
      select: { id: true },
    });

    if (!category) {
      return failure("Choose one of your own expense categories.", {
        categoryId: ["Choose a valid expense category"],
      });
    }

    const monthStart = monthToDate(month);

    const existing = await prisma.budget.findFirst({
      where: { userId, categoryId, month: monthStart },
      select: { id: true },
    });

    if (existing) {
      return failure("A budget already exists for that category and month.", {
        categoryId: ["This category already has a budget this month"],
      });
    }

    const budget = await prisma.budget.create({
      data: {
        userId,
        categoryId,
        amount: money(amount),
        month: monthStart,
        note: note || null,
      },
      select: { id: true },
    });

    revalidateBudgets();
    return success({ id: budget.id });
  } catch (error) {
    return toActionError(error, "We could not create that budget.");
  }
}

export async function updateBudgetAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = budgetUpdateSchema.safeParse(input);

  if (!parsed.success) {
    return failure("Please check the highlighted fields.", zodFieldErrors(parsed.error));
  }

  try {
    const userId = await requireUserId();
    const { id, categoryId, amount, month, note } = parsed.data;

    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId, kind: "EXPENSE" },
      select: { id: true },
    });

    if (!category) {
      return failure("Choose one of your own expense categories.", {
        categoryId: ["Choose a valid expense category"],
      });
    }

    const result = await prisma.budget.updateMany({
      where: { id, userId },
      data: {
        categoryId,
        amount: money(amount),
        month: monthToDate(month),
        note: note || null,
      },
    });

    if (result.count === 0) {
      return failure("We could not find that budget.");
    }

    revalidateBudgets();
    return success({ id });
  } catch (error) {
    return toActionError(error, "We could not update that budget.");
  }
}

export async function deleteBudgetAction(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const userId = await requireUserId();

    const result = await prisma.budget.deleteMany({ where: { id, userId } });

    if (result.count === 0) {
      return failure("We could not find that budget.");
    }

    revalidateBudgets();
    return success({ id });
  } catch (error) {
    return toActionError(error, "We could not delete that budget.");
  }
}
