"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { categorySchema, categoryUpdateSchema } from "@/lib/validations";
import {
  failure,
  success,
  toActionError,
  zodFieldErrors,
  type ActionResult,
} from "@/server/action-result";
import { requireUserId } from "@/server/session";

function revalidateCategories() {
  revalidatePath("/settings");
  revalidatePath("/transactions");
  revalidatePath("/budgets");
  revalidatePath("/analytics");
  revalidatePath("/dashboard");
}

export async function createCategoryAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = categorySchema.safeParse(input);

  if (!parsed.success) {
    return failure("Please check the highlighted fields.", zodFieldErrors(parsed.error));
  }

  try {
    const userId = await requireUserId();

    const category = await prisma.category.create({
      data: { ...parsed.data, userId, isDefault: false },
      select: { id: true },
    });

    revalidateCategories();
    return success({ id: category.id });
  } catch (error) {
    return toActionError(error, "We could not create that category.");
  }
}

export async function updateCategoryAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = categoryUpdateSchema.safeParse(input);

  if (!parsed.success) {
    return failure("Please check the highlighted fields.", zodFieldErrors(parsed.error));
  }

  try {
    const userId = await requireUserId();
    const { id, ...data } = parsed.data;

    const result = await prisma.category.updateMany({ where: { id, userId }, data });

    if (result.count === 0) {
      return failure("We could not find that category.");
    }

    revalidateCategories();
    return success({ id });
  } catch (error) {
    return toActionError(error, "We could not update that category.");
  }
}

/**
 * Only user-created categories can be deleted, and only when nothing points at
 * them — deleting a category that still has transactions would silently
 * corrupt historical reporting.
 */
export async function deleteCategoryAction(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const userId = await requireUserId();

    const category = await prisma.category.findFirst({
      where: { id, userId },
      select: {
        id: true,
        isDefault: true,
        _count: { select: { transactions: true, budgets: true } },
      },
    });

    if (!category) {
      return failure("We could not find that category.");
    }

    if (category.isDefault) {
      return failure("Built-in categories cannot be deleted. You can rename them instead.");
    }

    if (category._count.transactions > 0) {
      return failure(
        `This category is used by ${category._count.transactions} transaction${
          category._count.transactions === 1 ? "" : "s"
        }. Reassign them first.`,
      );
    }

    await prisma.category.delete({ where: { id: category.id } });

    revalidateCategories();
    return success({ id });
  } catch (error) {
    return toActionError(error, "We could not delete that category.");
  }
}
