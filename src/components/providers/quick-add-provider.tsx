"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { AccountForm } from "@/components/accounts/account-form";
import { BudgetForm, type BudgetCategoryOption } from "@/components/budgets/budget-form";
import { GoalForm } from "@/components/goals/goal-form";
import { ResponsiveDialog } from "@/components/shared/responsive-dialog";
import {
  TransactionForm,
  type AccountOption,
  type CategoryOption,
} from "@/components/transactions/transaction-form";
import type { CurrencyCode } from "@/lib/currency";
import type { TransactionDTO } from "@/types";

type QuickAddKind = "transaction" | "account" | "budget" | "goal";

type OpenOptions = {
  /** Pre-select an account, e.g. when adding from an account detail page. */
  accountId?: string;
  /** Edit instead of create. */
  transaction?: TransactionDTO;
};

type QuickAddContextValue = {
  open: (kind: QuickAddKind, options?: OpenOptions) => void;
  hasAccounts: boolean;
};

const QuickAddContext = createContext<QuickAddContextValue | null>(null);

export function useQuickAdd(): QuickAddContextValue {
  const context = useContext(QuickAddContext);

  if (!context) {
    throw new Error("useQuickAdd must be used inside <QuickAddProvider>");
  }

  return context;
}

type QuickAddProviderProps = {
  children: ReactNode;
  currency: CurrencyCode;
  accounts: AccountOption[];
  categories: CategoryOption[];
  budgetCategories: BudgetCategoryOption[];
  /** yyyy-MM of the month budgets default to. */
  currentMonth: string;
};

/**
 * Holds the create/edit dialogs once, at the shell level, so every screen and
 * the mobile tab bar can open them without duplicating the forms or refetching
 * the account and category lists.
 */
export function QuickAddProvider({
  children,
  currency,
  accounts,
  categories,
  budgetCategories,
  currentMonth,
}: QuickAddProviderProps) {
  const [kind, setKind] = useState<QuickAddKind | null>(null);
  const [options, setOptions] = useState<OpenOptions>({});

  const open = useCallback((next: QuickAddKind, nextOptions: OpenOptions = {}) => {
    setOptions(nextOptions);
    setKind(next);
  }, []);

  const close = useCallback(() => {
    setKind(null);
    setOptions({});
  }, []);

  const value = useMemo(
    () => ({ open, hasAccounts: accounts.length > 0 }),
    [open, accounts.length],
  );

  return (
    <QuickAddContext.Provider value={value}>
      {children}

      <ResponsiveDialog
        open={kind === "transaction"}
        onOpenChange={(next) => (next ? null : close())}
        title={options.transaction ? "Edit transaction" : "Add transaction"}
        description={
          accounts.length === 0
            ? "Create an account first — every transaction belongs to one."
            : "Record money coming in or going out."
        }
        className="sm:max-w-[34rem]"
      >
        {accounts.length === 0 ? (
          <NoAccountsNotice onCreateAccount={() => open("account")} />
        ) : (
          <TransactionForm
            accounts={accounts}
            categories={categories}
            currency={currency}
            transaction={options.transaction}
            defaultAccountId={options.accountId}
            onDone={close}
          />
        )}
      </ResponsiveDialog>

      <ResponsiveDialog
        open={kind === "account"}
        onOpenChange={(next) => (next ? null : close())}
        title="Add account"
        description="Cash, a bank account, a wallet — anywhere you keep money."
      >
        <AccountForm currency={currency} onDone={close} />
      </ResponsiveDialog>

      <ResponsiveDialog
        open={kind === "budget"}
        onOpenChange={(next) => (next ? null : close())}
        title="Create budget"
        description="Set a monthly spending limit for a category."
      >
        <BudgetForm
          categories={budgetCategories}
          currency={currency}
          month={currentMonth}
          onDone={close}
        />
      </ResponsiveDialog>

      <ResponsiveDialog
        open={kind === "goal"}
        onOpenChange={(next) => (next ? null : close())}
        title="Create savings goal"
        description="Give the money you set aside a purpose."
      >
        <GoalForm currency={currency} onDone={close} />
      </ResponsiveDialog>
    </QuickAddContext.Provider>
  );
}

function NoAccountsNotice({ onCreateAccount }: { onCreateAccount: () => void }) {
  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-muted-foreground">
        Transactions are recorded against an account, so there is nothing to attach this to yet.
      </p>
      <button
        type="button"
        onClick={onCreateAccount}
        className="h-9 w-full rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/85"
      >
        Create your first account
      </button>
    </div>
  );
}
