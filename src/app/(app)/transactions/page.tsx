import type { Metadata } from "next";
import { Suspense } from "react";

import { AddTransactionButton } from "@/components/transactions/add-transaction-button";
import { TransactionFilters } from "@/components/transactions/transaction-filters";
import { TransactionList } from "@/components/transactions/transaction-list";
import { AnimatedAmount } from "@/components/motion/animated-number";
import { Pagination } from "@/components/shared/pagination";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { transactionFiltersSchema } from "@/lib/validations";
import { listAccountOptions } from "@/server/queries/accounts";
import { listCategoryOptions } from "@/server/queries/categories";
import { listTransactions } from "@/server/queries/transactions";
import { requireUser } from "@/server/session";

export const metadata: Metadata = {
  title: "Transactions",
  description: "Search, filter and manage every transaction you have recorded.",
};

export default async function TransactionsPage(props: PageProps<"/transactions">) {
  const user = await requireUser();
  const searchParams = await props.searchParams;

  // Unknown or malformed query strings fall back to defaults rather than 500.
  const parsed = transactionFiltersSchema.safeParse(searchParams);
  const filters = parsed.success ? parsed.data : transactionFiltersSchema.parse({});

  const [page, accounts, categories] = await Promise.all([
    listTransactions(user.id, filters),
    listAccountOptions(user.id),
    listCategoryOptions(user.id),
  ]);

  const hasFilters = Boolean(
    filters.q ||
      filters.type !== "all" ||
      (filters.accountId && filters.accountId !== "all") ||
      (filters.categoryId && filters.categoryId !== "all") ||
      filters.from ||
      filters.to,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transactions"
        description="Every naira in and out, searchable and filterable."
        actions={<AddTransactionButton />}
      />

      {/* Totals for the current filter selection, not the whole history. */}
      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryTile label="Income">
          <AnimatedAmount
            value={page.totals.income}
            currency={user.currency}
            className="text-xl font-semibold text-positive"
          />
        </SummaryTile>
        <SummaryTile label="Expenses">
          <AnimatedAmount
            value={page.totals.expenses}
            currency={user.currency}
            className="text-xl font-semibold text-foreground"
          />
        </SummaryTile>
        <SummaryTile label="Net">
          <AnimatedAmount
            value={page.totals.net}
            currency={user.currency}
            signed
            className={cn(
              "text-xl font-semibold",
              Number(page.totals.net) > 0 && "text-positive",
              Number(page.totals.net) < 0 && "text-negative",
            )}
          />
        </SummaryTile>
      </div>

      <Suspense fallback={<Skeleton className="h-10 w-full" />}>
        <TransactionFilters accounts={accounts} categories={categories} />
      </Suspense>

      <div className="surface overflow-hidden">
        <TransactionList
          transactions={page.rows}
          currency={user.currency}
          hasFilters={hasFilters}
        />

        {page.total > 0 ? (
          <Suspense fallback={null}>
            <Pagination
              page={page.page}
              pageCount={page.pageCount}
              total={page.total}
              perPage={page.perPage}
            />
          </Suspense>
        ) : null}
      </div>
    </div>
  );
}

function SummaryTile({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="surface p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="mt-1.5">{children}</div>
      <p className="mt-1 text-[0.7rem] text-muted-foreground">Across the current filters</p>
    </div>
  );
}
