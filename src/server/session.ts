import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { CurrencyCode } from "@/lib/currency";
import { UnauthenticatedError } from "@/server/errors";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  currency: CurrencyCode;
  theme: string;
  budgetAlerts: boolean;
  savingsAlerts: boolean;
  createdAt: Date;
};

/**
 * Auth.js errors that mean "this cookie cannot be read": a rotated or wrong
 * AUTH_SECRET, a corrupted cookie, or a token that no longer decrypts.
 *
 * Deliberately a short list. A missing secret is a deployment fault and must
 * stay loud, and Next signals its own control flow — redirects, notFound, and
 * the bail-out that marks a route dynamic — by throwing, so anything that is
 * not one of these has to be re-thrown untouched.
 *
 * Matched on `type`, not `name`: the class name is mangled by the production
 * minifier, so a `name` check works in development and fails once built.
 */
const UNREADABLE_COOKIE_ERRORS = new Set(["JWTSessionError", "SessionTokenError"]);

/** The cookie names Auth.js uses for the session token. */
const SESSION_COOKIES = ["authjs.session-token", "__Secure-authjs.session-token"];

/**
 * Whether the browser sent a session cookie at all.
 *
 * Auth.js swallows a token it cannot decrypt and simply returns no session, so
 * "no user" alone cannot tell a signed-out visitor from one holding a cookie
 * that has stopped working. Without this distinction the two halves of the app
 * disagree: the proxy sees a cookie and sends the visitor to the dashboard,
 * the dashboard finds no user and sends them back.
 */
async function hasSessionCookie(): Promise<boolean> {
  const jar = await cookies();
  return SESSION_COOKIES.some((name) => Boolean(jar.get(name)?.value));
}

function isUnreadableCookie(error: unknown): boolean {
  const type = (error as { type?: unknown })?.type;
  return typeof type === "string" && UNREADABLE_COOKIE_ERRORS.has(type);
}

/**
 * `none`    — no session cookie at all.
 * `invalid` — a cookie is present but unusable: it cannot be decrypted
 *             (AUTH_SECRET was rotated), it has expired, or it points at a
 *             user who no longer exists.
 * `valid`   — a real, current user.
 */
export type SessionState =
  | { status: "none" }
  | { status: "invalid" }
  | { status: "valid"; user: SessionUser };

/**
 * Resolves the session cookie into a user.
 *
 * Wrapped in `cache` so a page that needs the user in several places still
 * performs a single query per request.
 *
 * `auth()` throws when a cookie cannot be decoded, which happens routinely:
 * rotating AUTH_SECRET invalidates every cookie that is already in the wild.
 * That is a signed-out visitor, not a server fault, so it is caught here and
 * reported as `invalid` rather than being allowed to take the page down.
 */
const readSession = cache(async (): Promise<SessionState> => {
  let userId: string | undefined;

  try {
    const session = await auth();
    userId = session?.user?.id;
  } catch (error) {
    if (!isUnreadableCookie(error)) throw error;

    console.warn(
      "[moneyflow] discarding an unreadable session cookie:",
      error instanceof Error ? error.message : error,
    );
    return { status: "invalid" };
  }

  if (!userId) {
    return (await hasSessionCookie()) ? { status: "invalid" } : { status: "none" };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      currency: true,
      theme: true,
      budgetAlerts: true,
      savingsAlerts: true,
      createdAt: true,
    },
  });

  // The token decoded, but the account behind it is gone.
  if (!user) return { status: "invalid" };

  return {
    status: "valid",
    user: { ...user, currency: user.currency as CurrencyCode },
  };
});

/** The signed-in user, or null when there is no usable session. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await readSession();
  return session.status === "valid" ? session.user : null;
}

/**
 * For pages and layouts: bounce to the login screen when unauthenticated.
 *
 * A stale cookie is sent to `/login?expired=1`, which tells the proxy to stop
 * treating that cookie as a session and to clear it. Without that signal the
 * two would disagree — the proxy seeing a cookie and sending the visitor to
 * the dashboard, the dashboard finding no user and sending them back.
 */
export async function requireUser(): Promise<SessionUser> {
  const session = await readSession();

  if (session.status === "valid") return session.user;
  if (session.status === "invalid") redirect("/login?expired=1");

  redirect("/login");
}

/** For server actions: throws instead of redirecting. */
export async function requireUserId(): Promise<string> {
  const session = await readSession();

  if (session.status !== "valid") throw new UnauthenticatedError();
  return session.user.id;
}

export { UnauthenticatedError };
