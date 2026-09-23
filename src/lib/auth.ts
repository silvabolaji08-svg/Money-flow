import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";
import { fakeVerify, verifyPassword } from "@/server/password";

/**
 * Auth.js (NextAuth v5) with a credentials provider and JWT sessions.
 *
 * The session token carries only the user id plus cheap display fields.
 * Anything security-sensitive is re-read from the database on each request,
 * so revoking or editing a user takes effect without waiting for token expiry.
 */
/**
 * Auth.js reports an undecryptable session cookie as an error. It is not one:
 * rotating AUTH_SECRET, or a cookie left over from another deployment, makes
 * every token in the wild unreadable, and the only correct response is to
 * treat the visitor as signed out. Logging it at error level fills production
 * logs with noise and, in development, raises Next's error overlay over a
 * perfectly recoverable state — so it is downgraded to a warning here and
 * handled in `src/server/session.ts`.
 *
 * Matched on `type` rather than `name`: Auth.js assigns `type` as a string
 * literal, while the class name is mangled by the production minifier — so a
 * `name` check passes in development and silently fails once built.
 */
const EXPECTED_SESSION_ERRORS = new Set(["JWTSessionError", "SessionTokenError"]);

function isExpectedSessionError(error: unknown): boolean {
  const type = (error as { type?: unknown })?.type;
  return typeof type === "string" && EXPECTED_SESSION_ERRORS.has(type);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  logger: {
    error(error) {
      if (isExpectedSessionError(error)) {
        console.warn("[auth] ignoring an unreadable session cookie; signing the visitor out.");
        return;
      }

      console.error("[auth]", error);
    },
    warn(code) {
      console.warn("[auth]", code);
    },
    debug() {
      // Intentionally silent.
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            passwordHash: true,
          },
        });

        // Constant-ish work whether or not the account exists.
        if (!user) {
          await fakeVerify(password);
          return null;
        }

        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user?.id) {
        token.id = user.id;
      }

      // Refresh display fields after a profile update.
      if (trigger === "update" && token.id) {
        const fresh = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { name: true, email: true, image: true },
        });

        if (fresh) {
          token.name = fresh.name;
          token.email = fresh.email;
          token.picture = fresh.image;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token.id && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
