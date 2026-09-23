import { z } from "zod";

import { CURRENCY_CODES } from "@/lib/currency";

/**
 * A single source of truth for input rules, shared by React Hook Form on the
 * client and by every server action. The server always re-validates; client
 * validation is purely for fast feedback.
 */

const MAX_AMOUNT = 1_000_000_000_000; // 1 trillion — a sane upper bound.

/** Money arrives as a string so we never lose precision in transit. */
export const amountSchema = z
  .string()
  .trim()
  .min(1, "Enter an amount")
  .refine((value) => /^-?\d*(\.\d{1,2})?$/.test(value), {
    message: "Use numbers with up to 2 decimal places",
  })
  .refine((value) => Number(value) > 0, { message: "Amount must be greater than zero" })
  .refine((value) => Number(value) <= MAX_AMOUNT, { message: "That amount is too large" });

export const signedAmountSchema = z
  .string()
  .trim()
  .min(1, "Enter an amount")
  .refine((value) => /^-?\d*(\.\d{1,2})?$/.test(value), {
    message: "Use numbers with up to 2 decimal places",
  })
  .refine((value) => Number.isFinite(Number(value)), { message: "Enter a valid amount" })
  .refine((value) => Math.abs(Number(value)) <= MAX_AMOUNT, { message: "That amount is too large" });

const currencySchema = z.enum(CURRENCY_CODES as [string, ...string[]]);

const isoDateSchema = z
  .string()
  .min(1, "Pick a date")
  .refine((value) => !Number.isNaN(Date.parse(value)), { message: "Pick a valid date" });

/* -------------------------------------------------------------------------
   Authentication
------------------------------------------------------------------------- */

export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(72, "Password is too long")
  .refine((value) => /[a-zA-Z]/.test(value), { message: "Include at least one letter" })
  .refine((value) => /\d/.test(value), { message: "Include at least one number" });

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Tell us your name").max(80, "That name is too long"),
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address")),
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address")),
  password: z.string().min(1, "Enter your password"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

/* -------------------------------------------------------------------------
   Accounts
------------------------------------------------------------------------- */

export const accountTypeSchema = z.enum([
  "CASH",
  "BANK",
  "SAVINGS",
  "INVESTMENT",
  "WALLET",
  "CREDIT",
]);

export const accountSchema = z.object({
  name: z.string().trim().min(2, "Give the account a name").max(60, "Keep the name under 60 characters"),
  type: accountTypeSchema,
  currency: currencySchema,
  openingBalance: signedAmountSchema,
  description: z.string().trim().max(200, "Keep it under 200 characters").optional().or(z.literal("")),
});

export const accountUpdateSchema = accountSchema.extend({
  id: z.string().min(1),
});

export type AccountInput = z.infer<typeof accountSchema>;

/* -------------------------------------------------------------------------
   Categories
------------------------------------------------------------------------- */

export const categoryKindSchema = z.enum(["INCOME", "EXPENSE"]);

export const categorySchema = z.object({
  name: z.string().trim().min(2, "Give the category a name").max(40, "Keep the name under 40 characters"),
  kind: categoryKindSchema,
  icon: z.string().trim().min(1, "Pick an icon").max(40),
  color: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "Pick a colour"),
});

export const categoryUpdateSchema = categorySchema.extend({
  id: z.string().min(1),
});

export type CategoryInput = z.infer<typeof categorySchema>;

/* -------------------------------------------------------------------------
   Transactions
------------------------------------------------------------------------- */

export const transactionTypeSchema = z.enum(["INCOME", "EXPENSE"]);

export const transactionSchema = z.object({
  amount: amountSchema,
  type: transactionTypeSchema,
  accountId: z.string().min(1, "Choose an account"),
  categoryId: z.string().min(1, "Choose a category"),
  date: isoDateSchema,
  description: z
    .string()
    .trim()
    .min(1, "Add a short description")
    .max(120, "Keep the description under 120 characters"),
  notes: z.string().trim().max(500, "Keep notes under 500 characters").optional().or(z.literal("")),
});

export const transactionUpdateSchema = transactionSchema.extend({
  id: z.string().min(1),
});

export type TransactionInput = z.infer<typeof transactionSchema>;

/** Query-string contract for the transactions page. */
export const transactionFiltersSchema = z.object({
  q: z.string().trim().max(120).optional(),
  type: z.enum(["all", "INCOME", "EXPENSE"]).default("all"),
  accountId: z.string().optional(),
  categoryId: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  sort: z.enum(["date-desc", "date-asc", "amount-desc", "amount-asc"]).default("date-desc"),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(5).max(100).default(20),
});

export type TransactionFilters = z.infer<typeof transactionFiltersSchema>;

/* -------------------------------------------------------------------------
   Budgets
------------------------------------------------------------------------- */

export const budgetSchema = z.object({
  categoryId: z.string().min(1, "Choose a category"),
  amount: amountSchema,
  /** yyyy-MM — the month the budget applies to. */
  month: z.string().regex(/^\d{4}-\d{2}$/, "Choose a month"),
  note: z.string().trim().max(200, "Keep it under 200 characters").optional().or(z.literal("")),
});

export const budgetUpdateSchema = budgetSchema.extend({
  id: z.string().min(1),
});

export type BudgetInput = z.infer<typeof budgetSchema>;

/* -------------------------------------------------------------------------
   Savings goals
------------------------------------------------------------------------- */

export const savingsGoalSchema = z.object({
  name: z.string().trim().min(2, "Name your goal").max(60, "Keep the name under 60 characters"),
  targetAmount: amountSchema,
  currentAmount: z
    .string()
    .trim()
    .refine((value) => /^\d*(\.\d{1,2})?$/.test(value), { message: "Use a positive amount" })
    .optional(),
  targetDate: z.string().optional().or(z.literal("")),
  description: z.string().trim().max(200, "Keep it under 200 characters").optional().or(z.literal("")),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Pick a colour")
    .optional()
    .or(z.literal("")),
});

export const savingsGoalUpdateSchema = savingsGoalSchema.extend({
  id: z.string().min(1),
});

export const goalContributionSchema = z.object({
  goalId: z.string().min(1),
  amount: amountSchema,
  direction: z.enum(["add", "withdraw"]),
  note: z.string().trim().max(120).optional().or(z.literal("")),
});

export type SavingsGoalInput = z.infer<typeof savingsGoalSchema>;
export type GoalContributionInput = z.infer<typeof goalContributionSchema>;

/* -------------------------------------------------------------------------
   Settings
------------------------------------------------------------------------- */

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Tell us your name").max(80, "That name is too long"),
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address")),
});

export const preferencesSchema = z.object({
  currency: currencySchema,
  budgetAlerts: z.boolean(),
  savingsAlerts: z.boolean(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "Choose a password you have not used here before",
    path: ["newPassword"],
  });

export const deleteAccountSchema = z.object({
  confirmation: z
    .string()
    .refine((value): boolean => value === "DELETE", { message: "Type DELETE to confirm" }),
  password: z.string().min(1, "Enter your password"),
});

export type ProfileInput = z.infer<typeof profileSchema>;
export type PreferencesInput = z.infer<typeof preferencesSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
