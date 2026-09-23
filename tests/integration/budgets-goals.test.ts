import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import {
  cleanupTestUsers,
  createTestUser,
  dateThisMonth,
  firstOfThisMonth,
  hasDatabase,
  money,
  testDb,
  type TestUser,
} from "./helpers";

let currentUserId = "";

vi.mock("@/server/session", async () => {
  const { UnauthenticatedError } = await import("@/server/errors");

  return {
    UnauthenticatedError,
    requireUserId: vi.fn(async () => {
      if (!currentUserId) throw new UnauthenticatedError();
      return currentUserId;
    }),
    requireUser: vi.fn(async () => {
      throw new Error("requireUser is not used in these tests");
    }),
    getSessionUser: vi.fn(async () => null),
  };
});

const { createBudgetAction, deleteBudgetAction } = await import("@/server/actions/budgets");
const { listBudgets, summariseBudgets } = await import("@/server/queries/budgets");
const {
  createGoalAction,
  contributeToGoalAction,
  deleteGoalAction,
} = await import("@/server/actions/goals");
const { listSavingsGoals, summariseGoals } = await import("@/server/queries/goals");

describe.skipIf(!hasDatabase)("budget calculations", () => {
  let user: TestUser;

  beforeAll(async () => {
    user = await createTestUser("Budget User");
    currentUserId = user.user.id;
  });

  afterAll(async () => {
    await cleanupTestUsers();
  });

  async function spend(amount: string, day = 5) {
    await testDb.transaction.create({
      data: {
        userId: user.user.id,
        accountId: user.account.id,
        categoryId: user.expenseCategory.id,
        type: "EXPENSE",
        amount: money(amount),
        description: `Spend ${amount}`,
        date: dateThisMonth(day),
      },
    });
  }

  it("creates a budget and reports zero spent before any transactions", async () => {
    const month = firstOfThisMonth().toISOString().slice(0, 7);

    const result = await createBudgetAction({
      categoryId: user.expenseCategory.id,
      amount: "150000",
      month,
      note: "",
    });

    expect(result.ok).toBe(true);

    const [budget] = await listBudgets(user.user.id, new Date());
    expect(budget.amount).toBe("150000.00");
    expect(budget.spent).toBe("0.00");
    expect(budget.remaining).toBe("150000.00");
    expect(budget.percentUsed).toBe(0);
    expect(budget.status).toBe("on-track");
  });

  it("counts real transactions towards the budget", async () => {
    await spend("120000.00");

    const [budget] = await listBudgets(user.user.id, new Date());
    expect(budget.spent).toBe("120000.00");
    expect(budget.remaining).toBe("30000.00");
    expect(budget.percentUsed).toBe(80);
    // 80% is the point at which we start warning.
    expect(budget.status).toBe("warning");
  });

  it("marks a budget as exceeded and reports the overspend", async () => {
    await spend("45000.00", 8);

    const [budget] = await listBudgets(user.user.id, new Date());
    expect(budget.spent).toBe("165000.00");
    expect(budget.remaining).toBe("-15000.00");
    expect(budget.percentUsed).toBe(110);
    expect(budget.status).toBe("exceeded");
  });

  it("ignores income and other categories when totalling spend", async () => {
    await testDb.transaction.create({
      data: {
        userId: user.user.id,
        accountId: user.account.id,
        categoryId: user.incomeCategory.id,
        type: "INCOME",
        amount: money("500000.00"),
        description: "Salary",
        date: dateThisMonth(9),
      },
    });

    const [budget] = await listBudgets(user.user.id, new Date());
    expect(budget.spent).toBe("165000.00");
  });

  it("ignores spending from a different month", async () => {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1, 15);

    await testDb.transaction.create({
      data: {
        userId: user.user.id,
        accountId: user.account.id,
        categoryId: user.expenseCategory.id,
        type: "EXPENSE",
        amount: money("99000.00"),
        description: "Last month spend",
        date: lastMonth,
      },
    });

    const [budget] = await listBudgets(user.user.id, new Date());
    expect(budget.spent).toBe("165000.00");
  });

  it("summarises a set of budgets", async () => {
    const budgets = await listBudgets(user.user.id, new Date());
    const summary = summariseBudgets(budgets);

    expect(summary.totalBudgeted).toBe("150000.00");
    expect(summary.totalSpent).toBe("165000.00");
    expect(summary.totalRemaining).toBe("-15000.00");
    expect(summary.exceededCount).toBe(1);
  });

  it("refuses a second budget for the same category and month", async () => {
    const month = firstOfThisMonth().toISOString().slice(0, 7);

    const duplicate = await createBudgetAction({
      categoryId: user.expenseCategory.id,
      amount: "50000",
      month,
      note: "",
    });

    expect(duplicate.ok).toBe(false);
  });

  it("refuses to budget an income category", async () => {
    const month = firstOfThisMonth().toISOString().slice(0, 7);

    const result = await createBudgetAction({
      categoryId: user.incomeCategory.id,
      amount: "50000",
      month,
      note: "",
    });

    expect(result.ok).toBe(false);
  });

  it("will not delete another user's budget", async () => {
    const other = await createTestUser("Other Budget User");
    const budgets = await listBudgets(user.user.id, new Date());

    currentUserId = other.user.id;
    const result = await deleteBudgetAction(budgets[0].id);
    expect(result.ok).toBe(false);

    currentUserId = user.user.id;
    expect(await listBudgets(user.user.id, new Date())).toHaveLength(1);
  });
});

describe.skipIf(!hasDatabase)("savings goal calculations", () => {
  let user: TestUser;

  beforeAll(async () => {
    user = await createTestUser("Goal User");
    currentUserId = user.user.id;
  });

  afterAll(async () => {
    await cleanupTestUsers();
  });

  it("creates a goal and records the starting balance as a contribution", async () => {
    const result = await createGoalAction({
      name: "Emergency Fund",
      targetAmount: "1000000",
      currentAmount: "250000",
      targetDate: "",
      description: "Six months of expenses",
      color: "#0f9d76",
    });

    expect(result.ok).toBe(true);

    const [goal] = await listSavingsGoals(user.user.id);
    expect(goal.currentAmount).toBe("250000.00");
    expect(goal.remaining).toBe("750000.00");
    expect(goal.percentComplete).toBe(25);
    expect(goal.completed).toBe(false);
    expect(goal.contributions).toHaveLength(1);
  });

  it("adds money and moves the progress forward", async () => {
    const [goal] = await listSavingsGoals(user.user.id);

    const result = await contributeToGoalAction({
      goalId: goal.id,
      amount: "100000.50",
      direction: "add",
      note: "October transfer",
    });

    expect(result.ok).toBe(true);

    const [updated] = await listSavingsGoals(user.user.id);
    expect(updated.currentAmount).toBe("350000.50");
    expect(updated.remaining).toBe("649999.50");
    expect(updated.contributions).toHaveLength(2);
  });

  it("withdraws money and records it as a negative contribution", async () => {
    const [goal] = await listSavingsGoals(user.user.id);

    const result = await contributeToGoalAction({
      goalId: goal.id,
      amount: "50000.50",
      direction: "withdraw",
      note: "Emergency repair",
    });

    expect(result.ok).toBe(true);

    const [updated] = await listSavingsGoals(user.user.id);
    expect(updated.currentAmount).toBe("300000.00");
    expect(Number(updated.contributions[0].amount)).toBeLessThan(0);
  });

  it("refuses to withdraw more than the goal holds", async () => {
    const [goal] = await listSavingsGoals(user.user.id);

    const result = await contributeToGoalAction({
      goalId: goal.id,
      amount: "999999999",
      direction: "withdraw",
      note: "",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors?.amount).toBeDefined();
    }

    const [unchanged] = await listSavingsGoals(user.user.id);
    expect(unchanged.currentAmount).toBe("300000.00");
  });

  it("marks a goal complete once it reaches the target, and caps progress at 100%", async () => {
    const [goal] = await listSavingsGoals(user.user.id);

    await contributeToGoalAction({
      goalId: goal.id,
      amount: "800000",
      direction: "add",
      note: "Windfall",
    });

    const [completed] = await listSavingsGoals(user.user.id);
    expect(completed.currentAmount).toBe("1100000.00");
    expect(completed.completed).toBe(true);
    expect(completed.percentComplete).toBe(100);
    // Remaining never goes negative — it is "nothing left to save".
    expect(completed.remaining).toBe("0.00");
  });

  it("summarises goals across the account", async () => {
    const goals = await listSavingsGoals(user.user.id);
    const summary = summariseGoals(goals);

    expect(summary.totalSaved).toBe("1100000.00");
    expect(summary.totalTarget).toBe("1000000.00");
    expect(summary.completedCount).toBe(1);
    expect(summary.percentComplete).toBe(100);
  });

  it("will not let another user contribute to or delete the goal", async () => {
    const other = await createTestUser("Goal Intruder");
    const [goal] = await listSavingsGoals(user.user.id);

    currentUserId = other.user.id;

    const contribute = await contributeToGoalAction({
      goalId: goal.id,
      amount: "1000",
      direction: "add",
      note: "",
    });
    expect(contribute.ok).toBe(false);

    const remove = await deleteGoalAction(goal.id);
    expect(remove.ok).toBe(false);

    currentUserId = user.user.id;
    expect(await listSavingsGoals(user.user.id)).toHaveLength(1);
  });
});
