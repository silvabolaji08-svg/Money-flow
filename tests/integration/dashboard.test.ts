import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import {
  cleanupTestUsers,
  createTestUser,
  hasDatabase,
  money,
  testDb,
  type TestUser,
} from "./helpers";

vi.mock("@/server/session", async () => {
  const { UnauthenticatedError } = await import("@/server/errors");
  return {
    UnauthenticatedError,
    requireUserId: vi.fn(async () => ""),
    requireUser: vi.fn(async () => {
      throw new Error("requireUser is not used in these tests");
    }),
    getSessionUser: vi.fn(async () => null),
  };
});

const { getDashboardData } = await import("@/server/queries/dashboard");
const { getAnalytics } = await import("@/server/queries/analytics");
const { resolvePeriod } = await import("@/lib/dates");

/**
 * A fixed reference date keeps the month arithmetic predictable. Transactions
 * are written relative to it rather than to "now".
 */
const REFERENCE = new Date(Date.UTC(2026, 5, 15, 12)); // 15 June 2026

function dayInMonth(monthsAgo: number, day: number): Date {
  return new Date(Date.UTC(REFERENCE.getUTCFullYear(), REFERENCE.getUTCMonth() - monthsAgo, day));
}

describe.skipIf(!hasDatabase)("dashboard calculations", () => {
  let user: TestUser;

  beforeAll(async () => {
    user = await createTestUser("Dashboard User");

    const rows = [
      // This month: 800,000 income, 300,000 expenses
      { monthsAgo: 0, day: 2, type: "INCOME" as const, amount: "800000.00" },
      { monthsAgo: 0, day: 4, type: "EXPENSE" as const, amount: "180000.00" },
      { monthsAgo: 0, day: 8, type: "EXPENSE" as const, amount: "120000.00" },
      // Last month: 600,000 income, 400,000 expenses
      { monthsAgo: 1, day: 3, type: "INCOME" as const, amount: "600000.00" },
      { monthsAgo: 1, day: 6, type: "EXPENSE" as const, amount: "250000.00" },
      { monthsAgo: 1, day: 20, type: "EXPENSE" as const, amount: "150000.00" },
      // Two months ago
      { monthsAgo: 2, day: 10, type: "INCOME" as const, amount: "500000.00" },
      { monthsAgo: 2, day: 14, type: "EXPENSE" as const, amount: "220000.00" },
    ];

    for (const row of rows) {
      await testDb.transaction.create({
        data: {
          userId: user.user.id,
          accountId: user.account.id,
          categoryId:
            row.type === "INCOME" ? user.incomeCategory.id : user.expenseCategory.id,
          type: row.type,
          amount: money(row.amount),
          description: `${row.type} ${row.monthsAgo} months ago`,
          date: dayInMonth(row.monthsAgo, row.day),
        },
      });
    }
  });

  afterAll(async () => {
    await cleanupTestUsers();
  });

  it("totals this month's income and expenses from real transactions", async () => {
    const data = await getDashboardData(user.user.id, REFERENCE);

    expect(data.stats.monthlyIncome).toBe("800000.00");
    expect(data.stats.monthlyExpenses).toBe("300000.00");
    expect(data.stats.netCashFlow).toBe("500000.00");
  });

  it("computes the savings rate as the share of income kept", async () => {
    const data = await getDashboardData(user.user.id, REFERENCE);
    // (800,000 − 300,000) / 800,000
    expect(data.stats.savingsRate).toBe(62.5);
  });

  it("derives the total balance from the opening balance plus activity", async () => {
    const data = await getDashboardData(user.user.id, REFERENCE);
    // 100,000 opening + 1,900,000 income − 920,000 expenses
    expect(data.stats.totalBalance).toBe("1080000.00");
  });

  it("compares against the previous month", async () => {
    const data = await getDashboardData(user.user.id, REFERENCE);

    // Income 600,000 -> 800,000 is +33.33%
    expect(data.stats.incomeChange).toBeCloseTo(33.33, 1);
    // Expenses 400,000 -> 300,000 is -25%
    expect(data.stats.expenseChange).toBe(-25);
    // Net 200,000 -> 500,000 is +150%
    expect(data.stats.netChange).toBe(150);
  });

  it("builds a continuous six month series, zero-filling quiet months", async () => {
    const data = await getDashboardData(user.user.id, REFERENCE);

    expect(data.series).toHaveLength(6);

    const current = data.series[data.series.length - 1];
    expect(current.income).toBe(800000);
    expect(current.expenses).toBe(300000);
    expect(current.net).toBe(500000);

    // The three oldest months have no transactions at all.
    expect(data.series[0]).toMatchObject({ income: 0, expenses: 0, net: 0 });
  });

  it("splits this month's spending by category", async () => {
    const data = await getDashboardData(user.user.id, REFERENCE);

    expect(data.spendingByCategory).toHaveLength(1);
    expect(data.spendingByCategory[0]).toMatchObject({
      name: "Food",
      amount: 300000,
      share: 100,
    });
  });

  it("returns the most recent transactions, newest first", async () => {
    const data = await getDashboardData(user.user.id, REFERENCE);

    expect(data.recentTransactions.length).toBeGreaterThan(0);
    const dates = data.recentTransactions.map((row) => new Date(row.date).getTime());
    expect([...dates].sort((a, b) => b - a)).toEqual(dates);
  });

  it("reports an empty dashboard for a user with no data", async () => {
    const empty = await createTestUser("Empty User");
    const data = await getDashboardData(empty.user.id, REFERENCE);

    expect(data.stats.monthlyIncome).toBe("0.00");
    expect(data.stats.monthlyExpenses).toBe("0.00");
    expect(data.stats.savingsRate).toBe(0);
    // Nothing earned in either month is a real "no change", not a missing comparison.
    expect(data.stats.incomeChange).toBe(0);
    expect(data.hasAnyTransactions).toBe(false);
    // The opening balance of the account created for them.
    expect(data.stats.totalBalance).toBe("100000.00");
  });

  it("never mixes one user's figures into another's dashboard", async () => {
    const other = await createTestUser("Isolated User");

    await testDb.transaction.create({
      data: {
        userId: other.user.id,
        accountId: other.account.id,
        categoryId: other.incomeCategory.id,
        type: "INCOME",
        amount: money("9999999.00"),
        description: "Someone else's money",
        date: dayInMonth(0, 5),
      },
    });

    const data = await getDashboardData(user.user.id, REFERENCE);
    expect(data.stats.monthlyIncome).toBe("800000.00");
    expect(data.stats.totalBalance).toBe("1080000.00");
  });
});

describe.skipIf(!hasDatabase)("analytics", () => {
  let user: TestUser;

  beforeAll(async () => {
    user = await createTestUser("Analytics User");

    const rows = [
      { monthsAgo: 0, day: 3, type: "INCOME" as const, amount: "900000.00" },
      { monthsAgo: 0, day: 7, type: "EXPENSE" as const, amount: "240000.00" },
      { monthsAgo: 0, day: 11, type: "EXPENSE" as const, amount: "60000.00" },
    ];

    for (const row of rows) {
      await testDb.transaction.create({
        data: {
          userId: user.user.id,
          accountId: user.account.id,
          categoryId:
            row.type === "INCOME" ? user.incomeCategory.id : user.expenseCategory.id,
          type: row.type,
          amount: money(row.amount),
          description: "Analytics row",
          date: dayInMonth(row.monthsAgo, row.day),
        },
      });
    }
  });

  afterAll(async () => {
    await cleanupTestUsers();
  });

  it("totals a period and reports the transaction count", async () => {
    const range = resolvePeriod("this-month", REFERENCE);
    const data = await getAnalytics(user.user.id, "this-month", range, REFERENCE);

    expect(data.totals.income).toBe("900000.00");
    expect(data.totals.expenses).toBe("300000.00");
    expect(data.totals.net).toBe("600000.00");
    expect(data.totals.transactionCount).toBe(3);
    expect(data.totals.averageExpense).toBe("150000.00");
  });

  it("labels the selected range", async () => {
    const range = resolvePeriod("last-3-months", REFERENCE);
    const data = await getAnalytics(user.user.id, "last-3-months", range, REFERENCE);

    expect(data.range.label).toBe("Last 3 months");
    expect(data.series).toHaveLength(3);
  });

  it("honours a custom date range", async () => {
    const range = resolvePeriod("custom", REFERENCE, {
      from: dayInMonth(0, 1),
      to: dayInMonth(0, 8),
    });

    const data = await getAnalytics(user.user.id, "custom", range, REFERENCE);

    // The 11th falls outside the window, so only two transactions count.
    expect(data.totals.transactionCount).toBe(2);
    expect(data.totals.expenses).toBe("240000.00");
  });

  it("lists the largest expenses first", async () => {
    const range = resolvePeriod("this-month", REFERENCE);
    const data = await getAnalytics(user.user.id, "this-month", range, REFERENCE);

    expect(data.topExpenses[0].amount).toBe("240000.00");
  });

  it("generates insights only from real figures", async () => {
    const range = resolvePeriod("this-month", REFERENCE);
    const data = await getAnalytics(user.user.id, "this-month", range, REFERENCE);

    for (const insight of data.insights) {
      expect(insight.title.length).toBeGreaterThan(0);
      expect(insight.detail.length).toBeGreaterThan(0);
    }

    const largest = data.insights.find((insight) => insight.id === "largest-category");
    expect(largest?.title).toContain("Food");
  });
});
