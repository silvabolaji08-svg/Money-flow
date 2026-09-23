import { describe, expect, it } from "vitest";

import {
  accountSchema,
  budgetSchema,
  changePasswordSchema,
  deleteAccountSchema,
  loginSchema,
  registerSchema,
  transactionFiltersSchema,
  transactionSchema,
} from "@/lib/validations";

describe("registration rules", () => {
  it("accepts a valid registration and normalises the email", () => {
    const result = registerSchema.safeParse({
      name: "  Ada Okafor ",
      email: "  ADA@Example.COM ",
      password: "sixteenChars1",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("ada@example.com");
      expect(result.data.name).toBe("Ada Okafor");
    }
  });

  it("rejects weak passwords", () => {
    expect(registerSchema.safeParse({ name: "Ada", email: "a@b.co", password: "short1" }).success).toBe(false);
    expect(
      registerSchema.safeParse({ name: "Ada", email: "a@b.co", password: "allletters" }).success,
    ).toBe(false);
    expect(
      registerSchema.safeParse({ name: "Ada", email: "a@b.co", password: "12345678" }).success,
    ).toBe(false);
  });

  it("rejects malformed emails", () => {
    expect(
      registerSchema.safeParse({ name: "Ada", email: "not-an-email", password: "password1" }).success,
    ).toBe(false);
  });

  it("requires both fields at login", () => {
    expect(loginSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(false);
  });
});

describe("transaction rules", () => {
  const valid = {
    amount: "2500.50",
    type: "EXPENSE" as const,
    accountId: "acc_1",
    categoryId: "cat_1",
    date: "2026-03-17",
    description: "Groceries",
    notes: "",
  };

  it("accepts a well formed transaction", () => {
    expect(transactionSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects zero and negative amounts", () => {
    expect(transactionSchema.safeParse({ ...valid, amount: "0" }).success).toBe(false);
    expect(transactionSchema.safeParse({ ...valid, amount: "-50" }).success).toBe(false);
  });

  it("rejects more than two decimal places", () => {
    expect(transactionSchema.safeParse({ ...valid, amount: "10.555" }).success).toBe(false);
  });

  it("rejects non-numeric amounts", () => {
    expect(transactionSchema.safeParse({ ...valid, amount: "1,000" }).success).toBe(false);
    expect(transactionSchema.safeParse({ ...valid, amount: "abc" }).success).toBe(false);
  });

  it("requires an account, a category and a description", () => {
    expect(transactionSchema.safeParse({ ...valid, accountId: "" }).success).toBe(false);
    expect(transactionSchema.safeParse({ ...valid, categoryId: "" }).success).toBe(false);
    expect(transactionSchema.safeParse({ ...valid, description: "" }).success).toBe(false);
  });

  it("rejects an unparseable date", () => {
    expect(transactionSchema.safeParse({ ...valid, date: "not-a-date" }).success).toBe(false);
  });
});

describe("filter parsing", () => {
  it("applies sensible defaults for an empty query string", () => {
    const filters = transactionFiltersSchema.parse({});
    expect(filters).toMatchObject({ type: "all", sort: "date-desc", page: 1, perPage: 20 });
  });

  it("coerces numeric query parameters", () => {
    const filters = transactionFiltersSchema.parse({ page: "3", perPage: "50" });
    expect(filters.page).toBe(3);
    expect(filters.perPage).toBe(50);
  });

  it("rejects an out-of-range page size", () => {
    expect(transactionFiltersSchema.safeParse({ perPage: "5000" }).success).toBe(false);
    expect(transactionFiltersSchema.safeParse({ page: "0" }).success).toBe(false);
  });
});

describe("account and budget rules", () => {
  it("allows a negative opening balance, for credit accounts", () => {
    const result = accountSchema.safeParse({
      name: "Credit Card",
      type: "CREDIT",
      currency: "NGN",
      openingBalance: "-45000",
      description: "",
    });

    expect(result.success).toBe(true);
  });

  it("rejects an unknown account type or currency", () => {
    const base = { name: "Test", currency: "NGN", openingBalance: "0", description: "" };
    expect(accountSchema.safeParse({ ...base, type: "CRYPTO" }).success).toBe(false);
    expect(accountSchema.safeParse({ ...base, type: "BANK", currency: "JPY" }).success).toBe(false);
  });

  it("requires a yyyy-MM month on budgets", () => {
    const base = { categoryId: "cat_1", amount: "150000", note: "" };
    expect(budgetSchema.safeParse({ ...base, month: "2026-03" }).success).toBe(true);
    expect(budgetSchema.safeParse({ ...base, month: "2026-3" }).success).toBe(false);
    expect(budgetSchema.safeParse({ ...base, month: "March" }).success).toBe(false);
  });
});

describe("security-sensitive forms", () => {
  it("requires the new password to be confirmed and different", () => {
    expect(
      changePasswordSchema.safeParse({
        currentPassword: "oldPassword1",
        newPassword: "newPassword1",
        confirmPassword: "different1",
      }).success,
    ).toBe(false);

    expect(
      changePasswordSchema.safeParse({
        currentPassword: "samePassword1",
        newPassword: "samePassword1",
        confirmPassword: "samePassword1",
      }).success,
    ).toBe(false);

    expect(
      changePasswordSchema.safeParse({
        currentPassword: "oldPassword1",
        newPassword: "newPassword1",
        confirmPassword: "newPassword1",
      }).success,
    ).toBe(true);
  });

  it("only accepts the exact DELETE confirmation", () => {
    expect(deleteAccountSchema.safeParse({ confirmation: "DELETE", password: "x" }).success).toBe(true);
    expect(deleteAccountSchema.safeParse({ confirmation: "delete", password: "x" }).success).toBe(false);
    expect(deleteAccountSchema.safeParse({ confirmation: "", password: "x" }).success).toBe(false);
  });
});
