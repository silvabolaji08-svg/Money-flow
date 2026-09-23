import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Receipt } from "lucide-react";

import { AccountActions } from "@/components/accounts/account-actions";
import { AnimatedAmount } from "@/components/motion/animated-number";
import { AddTransactionButton } from "@/components/transactions/add-transaction-button";
import {
  ACCOUNT_TYPE_LABELS,
  AccountIcon,
} from "@/components/shared/category-icon";
import { EmptyState } from "@/components/shared/empty-state";
import { Amount } from "@/components/shared/money";
import { SectionCard } from "@/components/shared/section-card";
import { TransactionRow } from "@/components/transactions/transaction-row";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CurrencyCode } from "@/lib/currency";
import { currentMonthRange } from "@/lib/dates";
import { getAccountDetail } from "@/server/queries/accounts";
import { requireUser } from "@/server/session";

export async function generateMetadata(
  props: PageProps<"/accounts/[id]">,
): Promise<Metadata> {
  const user = await requireUser();
  const { id } = await props.params;
  const detail = await getAccountDetail(user.id, id, currentMonthRange());

  return { title: detail?.account.name ?? "Account" };
}

export default async function AccountDetailPage(props: PageProps<"/accounts/[id]">) {
  const user = await requireUser();
  const { id } = await props.params;

  const detail = await getAccountDetail(user.id, id, currentMonthRange());

  if (!detail) notFound();

  const { account, recentTransactions, monthly } = detail;
  const accountCurrency = account.currency as CurrencyCode;

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
        <Link href="/accounts">
          <ArrowLeft className="size-4" aria-hidden="true" />
          All accounts
        </Link>
      </Button>

      <section className="surface relative overflow-hidden p-6 sm:p-8">
        <div className="hero-sheen absolute inset-0 opacity-70" aria-hidden="true" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <AccountIcon type={account.type} size="lg" />
              <div>
                <h1 className="flex items-center gap-2 text-xl font-semibold tracking-[-0.02em] text-foreground">
                  {account.name}
                  {account.archived ? (
                    <Badge variant="secondary" className="text-[0.65rem]">
                      Archived
                    </Badge>
                  ) : null}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {ACCOUNT_TYPE_LABELS[account.type]} · {account.currency}
                </p>
              </div>
            </div>

            <p className="mt-6 text-xs font-medium uppercase tracking-[0.13em] text-muted-foreground">
              Current balance
            </p>
            <AnimatedAmount
              value={account.balance}
              currency={accountCurrency}
              className="mt-1.5 block text-[2.25rem] font-semibold leading-none tracking-[-0.03em] text-foreground"
            />

            {account.description ? (
              <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
                {account.description}
              </p>
            ) : null}
          </div>

          <div className="relative flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <AddTransactionButton accountId={account.id} />
              <AccountActions
                account={account}
                currency={user.currency}
                redirectTo="/accounts"
              />
            </div>

            <dl className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm lg:border-l lg:border-border lg:pl-8">
              <Stat label="Opening balance">
                <Amount value={account.openingBalance} currency={accountCurrency} compactDecimals />
              </Stat>
              <Stat label="Transactions">
                <span className="tnum">{account.transactionCount}</span>
              </Stat>
              <Stat label="Total in">
                <Amount
                  value={account.income}
                  currency={accountCurrency}
                  className="text-positive"
                  compactDecimals
                />
              </Stat>
              <Stat label="Total out">
                <Amount value={account.expenses} currency={accountCurrency} compactDecimals />
              </Stat>
            </dl>
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-3">
        <SectionCard title="This month" description="Activity on this account" className="lg:col-span-1">
          <dl className="space-y-4">
            <MonthRow label="Income">
              <Amount value={monthly.income} currency={accountCurrency} className="text-positive" />
            </MonthRow>
            <MonthRow label="Expenses">
              <Amount value={monthly.expenses} currency={accountCurrency} />
            </MonthRow>
            <div className="border-t border-border pt-4">
              <MonthRow label="Net cash flow">
                <Amount value={monthly.net} currency={accountCurrency} signed colorBySign />
              </MonthRow>
            </div>
          </dl>
        </SectionCard>

        <SectionCard
          title="Recent activity"
          description={`Latest transactions on ${account.name}`}
          href={`/transactions?accountId=${account.id}`}
          className="lg:col-span-2"
          bodyClassName="p-3 sm:p-3"
        >
          {recentTransactions.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No transactions yet"
              description="Transactions recorded against this account will appear here."
              compact
              className="border-0 bg-transparent"
              action={<AddTransactionButton accountId={account.id} label="Add one now" />}
            />
          ) : (
            <ul className="divide-y divide-border/70">
              {recentTransactions.map((transaction) => (
                <li key={transaction.id}>
                  <TransactionRow
                    transaction={transaction}
                    currency={accountCurrency}
                    showAccount={false}
                  />
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium text-foreground">{children}</dd>
    </div>
  );
}

function MonthRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{children}</dd>
    </div>
  );
}
