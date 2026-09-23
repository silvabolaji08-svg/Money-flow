"use server";

import { revalidatePath } from "next/cache";

import { parseDateOnly } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { transactionSchema, transactionUpdateSchema } from "@/lib/validations";
import {
  failure,
  success,
  toActionError,
  zodFieldErrors,
  type ActionFailure,
  type ActionResult,
} from "@/server/action-result";
import { money } from "@/server/money";
import { requireUserId } from "@/server/session";

function revalidateEverything() {
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/accounts");
  revalidatePath("/budgets");
  revalidatePath("/analytics");
}

/**
 * Confirms the referenced account and category both belong to the signed-in
 * user, so a crafted request cannot attach a transaction to someone else's
 * account or category.
 */
async function assertOwnsReferences(
  userId: string,
  accountId: string,
  categoryId: string,
): Promise<ActionFailure | null> {
  const [account, category] = await Promise.all([
    prisma.account.findFirst({ where: { id: accountId, userId }, select: { id: true } }),
    prisma.category.findFirst({
      where: { id: categoryId, userId },
      select: { id: true, kind: true },
    }),
  ]);

  if (!account) {
    return failure("Choose one of your own accounts.", { accountId: ["Choose a valid account"] });
  }

  if (!category) {
    return failure("Choose one of your own categories.", {
      categoryId: ["Choose a valid category"],
    });
  }

  return null;
}

export async function createTransactionAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = transactionSchema.safeParse(input);

  if (!parsed.success) {
    return failure("Please check the highlighted fields.", zodFieldErrors(parsed.error));
  }

  try {
    const userId = await requireUserId();
    const { amount, type, accountId, categoryId, date, description, notes } = parsed.data;

    const ownershipError = await assertOwnsReferences(userId, accountId, categoryId);
    if (ownershipError) return ownershipError;

    const transaction = await prisma.transaction.create({
      data: {
        userId,
        accountId,
        categoryId,
        type,
        amount: money(amount),
        date: parseDateOnly(date),
        description,
        notes: notes || null,
      },
      select: { id: true },
    });

    revalidateEverything();
    revalidatePath(`/accounts/${accountId}`);
    return success({ id: transaction.id });
  } catch (error) {
    return toActionError(error, "We could not save that transaction.");
  }
}

export async function updateTransactionAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = transactionUpdateSchema.safeParse(input);

  if (!parsed.success) {
    return failure("Please check the highlighted fields.", zodFieldErrors(parsed.error));
  }

  try {
    const userId = await requireUserId();
    const { id, amount, type, accountId, categoryId, date, description, notes } = parsed.data;

    const ownershipError = await assertOwnsReferences(userId, accountId, categoryId);
    if (ownershipError) return ownershipError;

    const result = await prisma.transaction.updateMany({
      where: { id, userId },
      data: {
        accountId,
        categoryId,
        type,
        amount: money(amount),
        date: parseDateOnly(date),
        description,
        notes: notes || null,
      },
    });

    if (result.count === 0) {
      return failure("We could not find that transaction.");
    }

    revalidateEverything();
    revalidatePath(`/accounts/${accountId}`);
    return success({ id });
  } catch (error) {
    return toActionError(error, "We could not update that transaction.");
  }
}

export async function deleteTransactionAction(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const userId = await requireUserId();

    const result = await prisma.transaction.deleteMany({ where: { id, userId } });

    if (result.count === 0) {
      return failure("We could not find that transaction.");
    }

    revalidateEverything();
    return success({ id });
  } catch (error) {
    return toActionError(error, "We could not delete that transaction.");
  }
}
