"use server";

import { AuthError } from "next-auth";

import { signIn, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loginSchema, registerSchema } from "@/lib/validations";
import { failure, success, toActionError, zodFieldErrors, type ActionResult } from "@/server/action-result";
import { hashPassword } from "@/server/password";
import { createDefaultCategories } from "@/server/queries/categories";

/**
 * Creates the account, seeds the default category set, and signs the user in.
 * The password is hashed before it ever reaches the database, and the hash is
 * never returned to the caller.
 */
export async function registerAction(input: unknown): Promise<ActionResult<{ email: string }>> {
  const parsed = registerSchema.safeParse(input);

  if (!parsed.success) {
    return failure("Please check the highlighted fields.", zodFieldErrors(parsed.error));
  }

  const { name, email, password } = parsed.data;

  try {
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      return failure("An account with that email already exists.", {
        email: ["An account with that email already exists."],
      });
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: { name, email, passwordHash },
      select: { id: true, email: true },
    });

    await createDefaultCategories(user.id);

    return success({ email: user.email });
  } catch (error) {
    return toActionError(error, "We could not create your account. Please try again.");
  }
}

/** Signs in with credentials. Returns a generic message on failure by design. */
export async function loginAction(input: unknown): Promise<ActionResult<undefined>> {
  const parsed = loginSchema.safeParse(input);

  if (!parsed.success) {
    return failure("Please check the highlighted fields.", zodFieldErrors(parsed.error));
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });

    return success();
  } catch (error) {
    if (error instanceof AuthError) {
      // Never reveal whether the email exists.
      return failure("That email and password combination does not match an account.");
    }

    return toActionError(error, "We could not sign you in. Please try again.");
  }
}

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}
