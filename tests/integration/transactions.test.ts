import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import {
  cleanupTestUsers,
  createTestUser,
  dateThisMonth,
  hasDatabase,
  testDb,
  type TestUser,
} from "./helpers";

/**
 * The signed-in user is injected here so the real action code — validation,
 * ownership checks, Decimal maths and database writes — runs unchanged.
 */
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

const {
  createTransactionAction,
  updateTransactionAction,
  deleteTransactionAction,
} = await import("@/server/actions/transactions");
const { listTransactions } = await import("@/server/queries/transactions");
const { listAccounts, getTotalBalance } = await import("@/server/queries/accounts");

describe.skipIf(!hasDatabase)("transactions", () => {
  let alice: TestUser;
  let bob: TestUser;

  beforeAll(async () => {
    alice = await createTestUser("Alice");
    bob = await createTestUser("Bob");
    currentUserId = alice.user.id;
  });

  afterAll(async () => {
    await cleanupTestUsers();
  });

  it("creates a transaction and reflects it in the account balance", async () => {
    currentUserId = alice.user.id;

    const result = await createTransactionAction({
      amount: "25000.50",
      type: "EXPENSE",
      accountId: alice.account.id,
      categoryId: alice.expenseCategory.id,
      date: dateThisMonth(5).toISOString(),
      description: "Groceries",
      notes: "Weekly shop",
    });

    expect(result.ok).toBe(true);

    const accounts = await listAccounts(alice.user.id);
    const account = accounts.find((item) => item.id === alice.account.id)!;

    // 100,000 opening − 25,000.50 spent
    expect(account.balance).toBe("74999.50");
    expect(account.expenses).toBe("25000.50");
    expect(account.transactionCount).toBe(1);
  });

  it("adds income back to the balance, without floating point drift", async () => {
    currentUserId = alice.user.id;

    for (const amount of ["0.10", "0.20"]) {
      const result = await createTransactionAction({
        amount,
        type: "INCOME",
        accountId: alice.account.id,
        categoryId: alice.incomeCategory.id,
        date: dateThisMonth(6).toISOString(),
        description: `Refund ${amount}`,
        notes: "",
      });
      expect(result.ok).toBe(true);
    }

    const accounts = await listAccounts(alice.user.id);
    const account = accounts.find((item) => item.id === alice.account.id)!;

    // 74,999.50 + 0.10 + 0.20 — exactly 74,999.80, not 74999.80000000001
    expect(account.balance).toBe("74999.80");
    expect(account.income).toBe("0.30");
  });

  it("edits a transaction and recalculates the balance", async () => {
    currentUserId = alice.user.id;

    const page = await listTransactions(alice.user.id, {
      type: "all",
      sort: "date-desc",
      page: 1,
      perPage: 20,
    });

    const groceries = page.rows.find((row) => row.description === "Groceries")!;
    expect(groceries).toBeDefined();

    const result = await updateTransactionAction({
      id: groceries.id,
      amount: "15000.00",
      type: "EXPENSE",
      accountId: alice.account.id,
      categoryId: alice.expenseCategory.id,
      date: dateThisMonth(5).toISOString(),
      description: "Groceries (corrected)",
      notes: "",
    });

    expect(result.ok).toBe(true);

    const accounts = await listAccounts(alice.user.id);
    const account = accounts.find((item) => item.id === alice.account.id)!;

    // 100,000 − 15,000 + 0.30
    expect(account.balance).toBe("85000.30");
  });

  it("deletes a transaction and removes it from the balance", async () => {
    currentUserId = alice.user.id;

    const page = await listTransactions(alice.user.id, {
      type: "all",
      sort: "date-desc",
      page: 1,
      perPage: 20,
    });

    const target = page.rows.find((row) => row.description === "Groceries (corrected)")!;
    const result = await deleteTransactionAction(target.id);

    expect(result.ok).toBe(true);

    const accounts = await listAccounts(alice.user.id);
    const account = accounts.find((item) => item.id === alice.account.id)!;
    expect(account.balance).toBe("100000.30");

    const after = await listTransactions(alice.user.id, {
      type: "all",
      sort: "date-desc",
      page: 1,
      perPage: 20,
    });
    expect(after.rows.find((row) => row.id === target.id)).toBeUndefined();
  });

  it("refuses to record a transaction against another user's account", async () => {
    currentUserId = alice.user.id;

    const result = await createTransactionAction({
      amount: "5000",
      type: "EXPENSE",
      accountId: bob.account.id, // Bob's account
      categoryId: alice.expenseCategory.id,
      date: dateThisMonth(7).toISOString(),
      description: "Cross-account attempt",
      notes: "",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors?.accountId).toBeDefined();
    }

    const bobAccounts = await listAccounts(bob.user.id);
    expect(bobAccounts[0].transactionCount).toBe(0);
  });

  it("refuses to use another user's category", async () => {
    currentUserId = alice.user.id;

    const result = await createTransactionAction({
      amount: "5000",
      type: "EXPENSE",
      accountId: alice.account.id,
      categoryId: bob.expenseCategory.id,
      date: dateThisMonth(7).toISOString(),
      description: "Cross-category attempt",
      notes: "",
    });

    expect(result.ok).toBe(false);
  });

  it("will not edit or delete a transaction belonging to someone else", async () => {
    currentUserId = bob.user.id;

    const created = await createTransactionAction({
      amount: "9000",
      type: "EXPENSE",
      accountId: bob.account.id,
      categoryId: bob.expenseCategory.id,
      date: dateThisMonth(8).toISOString(),
      description: "Bob's private transaction",
      notes: "",
    });

    expect(created.ok).toBe(true);
    const bobTransactionId = created.ok ? created.data.id : "";

    // Now act as Alice.
    currentUserId = alice.user.id;

    const edit = await updateTransactionAction({
      id: bobTransactionId,
      amount: "1",
      type: "EXPENSE",
      accountId: alice.account.id,
      categoryId: alice.expenseCategory.id,
      date: dateThisMonth(8).toISOString(),
      description: "Hijacked",
      notes: "",
    });
    expect(edit.ok).toBe(false);

    const remove = await deleteTransactionAction(bobTransactionId);
    expect(remove.ok).toBe(false);

    // Bob's record is untouched.
    const stillThere = await testDb.transaction.findUnique({ where: { id: bobTransactionId } });
    expect(stillThere).not.toBeNull();
    expect(stillThere!.description).toBe("Bob's private transaction");
  });

  it("rejects writes when nobody is signed in", async () => {
    currentUserId = "";

    const result = await createTransactionAction({
      amount: "1000",
      type: "EXPENSE",
      accountId: alice.account.id,
      categoryId: alice.expenseCategory.id,
      date: dateThisMonth(9).toISOString(),
      description: "Anonymous",
      notes: "",
    });

    expect(result.ok).toBe(false);
    currentUserId = alice.user.id;
  });

  it("never returns another user's transactions from a listing", async () => {
    const alicePage = await listTransactions(alice.user.id, {
      type: "all",
      sort: "date-desc",
      page: 1,
      perPage: 100,
    });

    expect(
      alicePage.rows.some((row) => row.description === "Bob's private transaction"),
    ).toBe(false);

    const bobPage = await listTransactions(bob.user.id, {
      type: "all",
      sort: "date-desc",
      page: 1,
      perPage: 100,
    });

    expect(bobPage.rows).toHaveLength(1);
    expect(bobPage.rows[0].description).toBe("Bob's private transaction");
  });

  it("keeps each user's total balance separate", async () => {
    const aliceTotal = await getTotalBalance(alice.user.id);
    const bobTotal = await getTotalBalance(bob.user.id);

    expect(aliceTotal.toFixed(2)).toBe("100000.30");
    expect(bobTotal.toFixed(2)).toBe("91000.00"); // 100,000 − 9,000
  });
});

describe.skipIf(!hasDatabase)("search, filtering, sorting and pagination", () => {
  let user: TestUser;

  beforeAll(async () => {
    user = await createTestUser("Filter User");
    currentUserId = user.user.id;

    const rows = [
      { amount: "1000.00", description: "Coffee at Cafe Neo", type: "EXPENSE" as const, day: 2 },
      { amount: "2000.00", description: "Bus fare", type: "EXPENSE" as const, day: 4 },
      { amount: "3000.00", description: "Lunch meeting", type: "EXPENSE" as const, day: 6 },
      { amount: "50000.00", description: "March salary", type: "INCOME" as const, day: 8 },
      { amount: "7500.00", description: "Coffee beans order", type: "EXPENSE" as const, day: 10 },
    ];

    for (const row of rows) {
      await createTransactionAction({
        amount: row.amount,
        type: row.type,
        accountId: user.account.id,
        categoryId:
          row.type === "INCOME" ? user.incomeCategory.id : user.expenseCategory.id,
        date: dateThisMonth(row.day).toISOString(),
        description: row.description,
        notes: "",
      });
    }
  });

  afterAll(async () => {
    await cleanupTestUsers();
  });

  const base = { type: "all" as const, sort: "date-desc" as const, page: 1, perPage: 20 };

  it("searches descriptions case-insensitively", async () => {
    const page = await listTransactions(user.user.id, { ...base, q: "coffee" });
    expect(page.total).toBe(2);
    expect(page.rows.every((row) => row.description.toLowerCase().includes("coffee"))).toBe(true);
  });

  it("filters by type", async () => {
    const income = await listTransactions(user.user.id, { ...base, type: "INCOME" });
    expect(income.total).toBe(1);
    expect(income.rows[0].description).toBe("March salary");

    const expenses = await listTransactions(user.user.id, { ...base, type: "EXPENSE" });
    expect(expenses.total).toBe(4);
  });

  it("filters by date range", async () => {
    const from = dateThisMonth(4).toISOString().slice(0, 10);
    const to = dateThisMonth(8).toISOString().slice(0, 10);

    const page = await listTransactions(user.user.id, { ...base, from, to });
    expect(page.total).toBe(3);
  });

  it("sorts by amount in both directions", async () => {
    const descending = await listTransactions(user.user.id, { ...base, sort: "amount-desc" });
    expect(descending.rows[0].description).toBe("March salary");

    const ascending = await listTransactions(user.user.id, { ...base, sort: "amount-asc" });
    expect(ascending.rows[0].description).toBe("Coffee at Cafe Neo");
  });

  it("paginates and reports an accurate total", async () => {
    const first = await listTransactions(user.user.id, { ...base, perPage: 2, page: 1 });
    expect(first.rows).toHaveLength(2);
    expect(first.total).toBe(5);
    expect(first.pageCount).toBe(3);

    const last = await listTransactions(user.user.id, { ...base, perPage: 2, page: 3 });
    expect(last.rows).toHaveLength(1);

    const beyond = await listTransactions(user.user.id, { ...base, perPage: 2, page: 9 });
    expect(beyond.rows).toHaveLength(0);
    expect(beyond.total).toBe(5);
  });

  it("totals only the rows matching the current filter", async () => {
    const all = await listTransactions(user.user.id, base);
    expect(all.totals.income).toBe("50000.00");
    expect(all.totals.expenses).toBe("13500.00");
    expect(all.totals.net).toBe("36500.00");

    const coffee = await listTransactions(user.user.id, { ...base, q: "coffee" });
    expect(coffee.totals.expenses).toBe("8500.00");
  });
});
