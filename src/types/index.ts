import type {
  AccountType,
  CategoryKind,
  Currency,
  TransactionType,
} from "@/generated/prisma/enums";

export type { AccountType, CategoryKind, Currency, TransactionType };

/**
 * Data transfer objects handed to Client Components.
 * Money is always a fixed-2 decimal *string*; dates are ISO strings.
 */

export type AccountDTO = {
  id: string;
  name: string;
  type: AccountType;
  currency: Currency;
  openingBalance: string;
  description: string | null;
  archived: boolean;
  balance: string;
  income: string;
  expenses: string;
  transactionCount: number;
};

export type CategoryDTO = {
  id: string;
  name: string;
  kind: CategoryKind;
  icon: string;
  color: string;
  isDefault: boolean;
  transactionCount: number;
};

export type TransactionDTO = {
  id: string;
  type: TransactionType;
  amount: string;
  description: string;
  notes: string | null;
  date: string;
  account: { id: string; name: string; type: AccountType };
  category: { id: string; name: string; icon: string; color: string; kind: CategoryKind };
};

export type TransactionPage = {
  rows: TransactionDTO[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
  totals: { income: string; expenses: string; net: string };
};

export type BudgetDTO = {
  id: string;
  amount: string;
  spent: string;
  remaining: string;
  percentUsed: number;
  month: string;
  note: string | null;
  status: "on-track" | "warning" | "exceeded";
  category: { id: string; name: string; icon: string; color: string };
};

export type SavingsGoalDTO = {
  id: string;
  name: string;
  targetAmount: string;
  currentAmount: string;
  remaining: string;
  percentComplete: number;
  targetDate: string | null;
  description: string | null;
  color: string | null;
  completed: boolean;
  daysRemaining: number | null;
  contributions: GoalContributionDTO[];
};

export type GoalContributionDTO = {
  id: string;
  amount: string;
  note: string | null;
  occurredAt: string;
};

export type SeriesPoint = {
  label: string;
  income: number;
  expenses: number;
  net: number;
};

export type CategorySlice = {
  id: string;
  name: string;
  color: string;
  icon: string;
  amount: number;
  share: number;
};

export type DashboardStats = {
  totalBalance: string;
  monthlyIncome: string;
  monthlyExpenses: string;
  netCashFlow: string;
  savingsRate: number;
  balanceChange: number | null;
  incomeChange: number | null;
  expenseChange: number | null;
  netChange: number | null;
  savingsRateChange: number | null;
};

export type DashboardData = {
  stats: DashboardStats;
  series: SeriesPoint[];
  spendingByCategory: CategorySlice[];
  recentTransactions: TransactionDTO[];
  budgets: BudgetDTO[];
  goals: SavingsGoalDTO[];
  accountCount: number;
  hasAnyTransactions: boolean;
};

export type Insight = {
  id: string;
  tone: "positive" | "negative" | "neutral" | "warning";
  title: string;
  detail: string;
};

export type AnalyticsData = {
  range: { from: string; to: string; label: string };
  totals: {
    income: string;
    expenses: string;
    net: string;
    savingsRate: number;
    transactionCount: number;
    averageExpense: string;
  };
  changes: {
    income: number | null;
    expenses: number | null;
    net: number | null;
  };
  series: SeriesPoint[];
  spendingByCategory: CategorySlice[];
  incomeByCategory: CategorySlice[];
  accountBalances: { id: string; name: string; balance: number; type: AccountType }[];
  topExpenses: TransactionDTO[];
  insights: Insight[];
};
