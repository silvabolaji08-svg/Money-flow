"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { accountSchema, accountUpdateSchema } from "@/lib/validations";
import {
  failure,
  success,
  toActionError,
  zodFieldErrors,
  type ActionResult,
} from "@/server/action-result";
import { money } from "@/server/money";
import { requireUserId } from "@/server/session";
import type { Currency } from "@/generated/prisma/enums";

function revalidateAccounts() {
  revalidatePath("/dashboard");
  revalidatePath("/accounts");
  revalidatePath("/transactions");
  revalidatePath("/analytics");
}

export async function createAccountAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = accountSchema.safeParse(input);

  if (!parsed.success) {
    return failure("Please check the highlighted fields.", zodFieldErrors(parsed.error));
  }

  try {
    const userId = await requireUserId();
    const { name, type, currency, openingBalance, description } = parsed.data;

    const account = await prisma.account.create({
      data: {
        userId,
        name,
        type,
        currency: currency as Currency,
        openingBalance: money(openingBalance),
        description: description || null,
      },
      select: { id: true },
    });

    revalidateAccounts();
    return success({ id: account.id });
  } catch (error) {
    return toActionError(error, "We could not create that account.");
  }
}

export async function updateAccountAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = accountUpdateSchema.safeParse(input);

  if (!parsed.success) {
    return failure("Please check the highlighted fields.", zodFieldErrors(parsed.error));
  }

  try {
    const userId = await requireUserId();
    const { id, name, type, currency, openingBalance, description } = parsed.data;

    // `updateMany` with the userId in the filter makes cross-user writes impossible.
    const result = await prisma.account.updateMany({
      where: { id, userId },
      data: {
        name,
        type,
        currency: currency as Currency,
        openingBalance: money(openingBalance),
        description: description || null,
      },
    });

    if (result.count === 0) {
      return failure("We could not find that account.");
    }

    revalidateAccounts();
    revalidatePath(`/accounts/${id}`);
    return success({ id });
  } catch (error) {
    return toActionError(error, "We could not update that account.");
  }
}

export async function setAccountArchivedAction(
  id: string,
  archived: boolean,
): Promise<ActionResult<{ id: string }>> {
  try {
    const userId = await requireUserId();

    const result = await prisma.account.updateMany({
      where: { id, userId },
      data: { archived },
    });

    if (result.count === 0) {
      return failure("We could not find that account.");
    }

    revalidateAccounts();
    revalidatePath(`/accounts/${id}`);
    return success({ id });
  } catch (error) {
    return toActionError(error, "We could not update that account.");
  }
}

/**
 * Deleting an account removes its transactions too (FK cascade). The count is
 * surfaced to the UI so the confirmation dialog can state the consequence.
 */
export async function deleteAccountAction(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const userId = await requireUserId();

    const result = await prisma.account.deleteMany({ where: { id, userId } });

    if (result.count === 0) {
      return failure("We could not find that account.");
    }

    revalidateAccounts();
    return success({ id });
  } catch (error) {
    return toActionError(error, "We could not delete that account.");
  }
}
