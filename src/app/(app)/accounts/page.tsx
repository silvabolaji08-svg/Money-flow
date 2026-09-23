import type { Metadata } from "next";
import { Wallet } from "lucide-react";

import { AccountCard } from "@/components/accounts/account-card";
import { AddAccountButton } from "@/components/accounts/add-account-button";
import { AnimatedAmount } from "@/components/motion/animated-number";
import { Reveal } from "@/components/motion/reveal";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { listAccounts } from "@/server/queries/accounts";
import { dec, toMoneyString } from "@/server/money";
import { requireUser } from "@/server/session";

export const metadata: Metadata = {
  title: "Accounts",
  description: "Every place you keep money, with balances kept up to date.",
};

export default async function AccountsPage() {
  const user = await requireUser();
  const accounts = await listAccounts(user.id);

  const active = accounts.filter((account) => !account.archived);
  const archived = accounts.filter((account) => account.archived);

  const total = toMoneyString(
    active.reduce((sum, account) => sum.plus(dec(account.balance)), dec(0)),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Accounts"
        description="Cash, bank accounts, wallets and investments — all in one place."
        actions={<AddAccountButton />}
      />

      {accounts.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No accounts yet"
          description="Add the first place you keep money. Every transaction is recorded against an account, so this comes first."
          action={<AddAccountButton label="Add your first account" />}
        />
      ) : (
        <>
          <section className="surface flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.13em] text-muted-foreground">
                Total balance
              </p>
              <AnimatedAmount
                value={total}
                currency={user.currency}
                once="accounts-total"
                className="mt-1.5 block text-3xl font-semibold tracking-[-0.03em] text-foreground"
              />
            </div>

            <dl className="flex gap-8 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Active accounts</dt>
                <dd className="mt-1 text-lg font-semibold tnum text-foreground">
                  {active.length}
                </dd>
              </div>
              {archived.length > 0 ? (
                <div>
                  <dt className="text-xs text-muted-foreground">Archived</dt>
                  <dd className="mt-1 text-lg font-semibold tnum text-muted-foreground">
                    {archived.length}
                  </dd>
                </div>
              ) : null}
            </dl>
          </section>

          <Reveal id="accounts-list" stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {active.map((account) => (
              <AccountCard key={account.id} account={account} currency={user.currency} />
            ))}
          </Reveal>

          {archived.length > 0 ? (
            <section className="space-y-4">
              <h2 className="text-sm font-medium text-muted-foreground">Archived</h2>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {archived.map((account) => (
                  <AccountCard key={account.id} account={account} currency={user.currency} />
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
