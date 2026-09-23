import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic routing only.
 *
 * This checks for the *presence* of a session cookie so signed-out visitors are
 * redirected before a page renders, and signed-in ones skip the marketing and
 * auth screens. It is deliberately not the security boundary: every page, query
 * and server action independently verifies the session and scopes data to the
 * owning user. See `src/server/session.ts`.
 */
const SESSION_COOKIES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
];

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/transactions",
  "/accounts",
  "/budgets",
  "/goals",
  "/analytics",
  "/settings",
];

const AUTH_ROUTES = ["/login", "/register"];

export function proxy(request: NextRequest) {
  const { pathname, search, searchParams } = request.nextUrl;

  const hasSession = SESSION_COOKIES.some(
    (name) => request.cookies.get(name)?.value,
  );

  /**
   * Only the server can tell whether a cookie actually decodes, so when it
   * finds one that does not it redirects here with `expired`. Presence alone
   * must stop counting as a session at that point, otherwise this sends the
   * visitor to the dashboard, the dashboard sends them back, and they bounce
   * between the two forever.
   */
  const sessionExpired = searchParams.has("expired");

  if (sessionExpired) {
    const response = NextResponse.next();
    for (const name of SESSION_COOKIES) {
      response.cookies.delete(name);
    }
    return response;
  }

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (isProtected && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (hasSession && AUTH_ROUTES.includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Everything except Next internals, the auth API and static assets.
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
