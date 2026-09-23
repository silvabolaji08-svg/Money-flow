import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll } from "vitest";

import { PrismaClient, Prisma } from "@/generated/prisma/client";

/**
 * A dedicated client for the integration tests. Tests create their own users
 * with unique emails and delete them afterwards, so they can run against the
 * same development database without disturbing the seeded demo account.
 */
export const testDb = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
    max: 2,
    idleTimeoutMillis: 500,
    allowExitOnIdle: true,
  }),
});

export const hasDatabase = Boolean(process.env.DATABASE_URL);

let counter = 0;

export function uniqueEmail(prefix = "test"): string {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}@moneyflow.test`;
}

export const money = (value: number | string) => new Prisma.Decimal(value);

export type TestUser = Awaited<ReturnType<typeof createTestUser>>;

/** Creates a user with one account and one category of each kind. */
export async function createTestUser(namePrefix = "Test User") {
  const user = await testDb.user.create({
    data: {
      name: namePrefix,
      email: uniqueEmail(),
      // Not a real credential — these users never sign in.
      passwordHash: "$2b$12$abcdefghijklmnopqrstuv",
      currency: "NGN",
    },
  });

  const account = await testDb.account.create({
    data: {
      userId: user.id,
      name: "Main Account",
      type: "BANK",
      currency: "NGN",
      openingBalance: money("100000.00"),
    },
  });

  const incomeCategory = await testDb.category.create({
    data: { userId: user.id, name: "Salary", kind: "INCOME", icon: "Wallet", color: "#0f9d76" },
  });

  const expenseCategory = await testDb.category.create({
    data: { userId: user.id, name: "Food", kind: "EXPENSE", icon: "UtensilsCrossed", color: "#f97316" },
  });

  return { user, account, incomeCategory, expenseCategory };
}

export async function deleteTestUser(userId: string) {
  await testDb.user.deleteMany({ where: { id: userId } });
}

/** Removes every user this suite created, identified by the test email domain. */
export async function cleanupTestUsers() {
  await testDb.user.deleteMany({ where: { email: { endsWith: "@moneyflow.test" } } });
}

export function firstOfThisMonth(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

/** A UTC calendar date inside the current month, matching how the app stores dates. */
export function dateThisMonth(day = 10): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), day));
}

// One disconnect per test file, after every suite in it has finished. Doing
// this inside an individual suite would close the pool for later suites.
afterAll(async () => {
  const { prisma } = await import("@/lib/prisma");
  await Promise.all([testDb.$disconnect(), prisma.$disconnect()]);
});
