import { afterAll, describe, expect, it, vi } from "vitest";

import { cleanupTestUsers, hasDatabase, testDb, uniqueEmail } from "./helpers";

// next-auth reaches for Next request APIs that do not exist in a plain Node
// test run. Registration does not depend on them, and sign-in security is
// covered directly through the password helpers below.
vi.mock("next-auth", () => ({
  AuthError: class AuthError extends Error {},
  default: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  signIn: vi.fn(async () => undefined),
  signOut: vi.fn(async () => undefined),
  auth: vi.fn(async () => null),
  handlers: {},
}));

const { registerAction } = await import("@/server/actions/auth");
const { hashPassword, verifyPassword, fakeVerify } = await import("@/server/password");

describe.skipIf(!hasDatabase)("registration", () => {
  afterAll(async () => {
    await cleanupTestUsers();
  });

  it("creates a user, hashes the password and seeds default categories", async () => {
    const email = uniqueEmail("register");

    const result = await registerAction({
      name: "New Person",
      email,
      password: "GoodPassword1",
    });

    expect(result.ok).toBe(true);

    const user = await testDb.user.findUnique({ where: { email } });
    expect(user).not.toBeNull();

    // The plaintext password must never be stored.
    expect(user!.passwordHash).not.toBe("GoodPassword1");
    expect(user!.passwordHash.startsWith("$2")).toBe(true);
    expect(await verifyPassword("GoodPassword1", user!.passwordHash)).toBe(true);

    const categories = await testDb.category.findMany({ where: { userId: user!.id } });
    expect(categories.length).toBe(15);
    expect(categories.filter((category) => category.kind === "INCOME")).toHaveLength(5);
    expect(categories.filter((category) => category.kind === "EXPENSE")).toHaveLength(10);
    expect(categories.every((category) => category.isDefault)).toBe(true);
  });

  it("never returns the password hash to the caller", async () => {
    const result = await registerAction({
      name: "Hash Check",
      email: uniqueEmail("hash"),
      password: "GoodPassword1",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(JSON.stringify(result.data)).not.toContain("$2");
      expect(Object.keys(result.data)).toEqual(["email"]);
    }
  });

  it("refuses a duplicate email and says which field is wrong", async () => {
    const email = uniqueEmail("duplicate");

    const first = await registerAction({ name: "First", email, password: "GoodPassword1" });
    expect(first.ok).toBe(true);

    const second = await registerAction({ name: "Second", email, password: "GoodPassword1" });
    expect(second.ok).toBe(false);
    if (!second.ok) {
      expect(second.fieldErrors?.email).toBeDefined();
    }

    expect(await testDb.user.count({ where: { email } })).toBe(1);
  });

  it("treats emails case-insensitively", async () => {
    const email = uniqueEmail("case");

    await registerAction({ name: "Lower", email, password: "GoodPassword1" });
    const duplicate = await registerAction({
      name: "Upper",
      email: email.toUpperCase(),
      password: "GoodPassword1",
    });

    expect(duplicate.ok).toBe(false);
  });

  it("rejects invalid input before touching the database", async () => {
    const email = uniqueEmail("invalid");

    const result = await registerAction({ name: "A", email, password: "weak" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors?.name).toBeDefined();
      expect(result.fieldErrors?.password).toBeDefined();
    }

    expect(await testDb.user.count({ where: { email } })).toBe(0);
  });
});

describe("password hashing", () => {
  it("produces a different hash for the same password each time", async () => {
    const [first, second] = await Promise.all([
      hashPassword("SamePassword1"),
      hashPassword("SamePassword1"),
    ]);

    expect(first).not.toBe(second);
    expect(await verifyPassword("SamePassword1", first)).toBe(true);
    expect(await verifyPassword("SamePassword1", second)).toBe(true);
  });

  it("rejects the wrong password", async () => {
    const hash = await hashPassword("CorrectPassword1");
    expect(await verifyPassword("WrongPassword1", hash)).toBe(false);
    expect(await verifyPassword("", hash)).toBe(false);
  });

  it("burns comparable time when no account exists, to resist enumeration", async () => {
    const hash = await hashPassword("CorrectPassword1");

    const realStart = performance.now();
    await verifyPassword("AttemptedPassword1", hash);
    const realDuration = performance.now() - realStart;

    const fakeStart = performance.now();
    await fakeVerify("AttemptedPassword1");
    const fakeDuration = performance.now() - fakeStart;

    // Same order of magnitude is what matters here, not an exact match.
    expect(fakeDuration).toBeGreaterThan(realDuration / 5);
  });
});
