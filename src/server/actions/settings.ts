"use server";

import { revalidatePath } from "next/cache";

import { signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  changePasswordSchema,
  deleteAccountSchema,
  preferencesSchema,
  profileSchema,
} from "@/lib/validations";
import {
  failure,
  success,
  toActionError,
  zodFieldErrors,
  type ActionResult,
} from "@/server/action-result";
import { hashPassword, verifyPassword } from "@/server/password";
import { requireUserId } from "@/server/session";
import type { Currency } from "@/generated/prisma/enums";

function revalidateAll() {
  revalidatePath("/", "layout");
}

export async function updateProfileAction(input: unknown): Promise<ActionResult<undefined>> {
  const parsed = profileSchema.safeParse(input);

  if (!parsed.success) {
    return failure("Please check the highlighted fields.", zodFieldErrors(parsed.error));
  }

  try {
    const userId = await requireUserId();
    const { name, email } = parsed.data;

    const taken = await prisma.user.findFirst({
      where: { email, NOT: { id: userId } },
      select: { id: true },
    });

    if (taken) {
      return failure("That email is already in use.", { email: ["That email is already in use"] });
    }

    await prisma.user.update({ where: { id: userId }, data: { name, email } });

    revalidateAll();
    return success();
  } catch (error) {
    return toActionError(error, "We could not save your profile.");
  }
}

export async function updatePreferencesAction(input: unknown): Promise<ActionResult<undefined>> {
  const parsed = preferencesSchema.safeParse(input);

  if (!parsed.success) {
    return failure("Please check the highlighted fields.", zodFieldErrors(parsed.error));
  }

  try {
    const userId = await requireUserId();
    const { currency, budgetAlerts, savingsAlerts } = parsed.data;

    await prisma.user.update({
      where: { id: userId },
      data: { currency: currency as Currency, budgetAlerts, savingsAlerts },
    });

    revalidateAll();
    return success();
  } catch (error) {
    return toActionError(error, "We could not save your preferences.");
  }
}

/** Persists the chosen theme so it survives a new device or browser. */
export async function updateThemeAction(theme: string): Promise<ActionResult<undefined>> {
  if (!["light", "dark", "system"].includes(theme)) {
    return failure("Unknown theme.");
  }

  try {
    const userId = await requireUserId();
    await prisma.user.update({ where: { id: userId }, data: { theme } });
    return success();
  } catch (error) {
    return toActionError(error, "We could not save your theme.");
  }
}

export async function changePasswordAction(input: unknown): Promise<ActionResult<undefined>> {
  const parsed = changePasswordSchema.safeParse(input);

  if (!parsed.success) {
    return failure("Please check the highlighted fields.", zodFieldErrors(parsed.error));
  }

  try {
    const userId = await requireUserId();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!user) {
      return failure("We could not find your account.");
    }

    const valid = await verifyPassword(parsed.data.currentPassword, user.passwordHash);

    if (!valid) {
      return failure("Your current password is incorrect.", {
        currentPassword: ["Your current password is incorrect"],
      });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await hashPassword(parsed.data.newPassword) },
    });

    return success();
  } catch (error) {
    return toActionError(error, "We could not change your password.");
  }
}

/**
 * Permanently removes the user. Every owned row is deleted by the foreign key
 * cascades declared in the schema, so no orphaned financial data is left.
 * Re-authentication is required before the delete runs.
 */
export async function deleteUserAccountAction(input: unknown): Promise<ActionResult<undefined>> {
  const parsed = deleteAccountSchema.safeParse(input);

  if (!parsed.success) {
    return failure("Please check the highlighted fields.", zodFieldErrors(parsed.error));
  }

  try {
    const userId = await requireUserId();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!user) {
      return failure("We could not find your account.");
    }

    const valid = await verifyPassword(parsed.data.password, user.passwordHash);

    if (!valid) {
      return failure("That password is incorrect.", { password: ["That password is incorrect"] });
    }

    await prisma.user.delete({ where: { id: userId } });
  } catch (error) {
    return toActionError(error, "We could not delete your account.");
  }

  await signOut({ redirectTo: "/" });
  return success();
}
