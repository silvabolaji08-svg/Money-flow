import Link from "next/link";

import { AccountActions } from "@/components/accounts/account-actions";
import {
  ACCOUNT_TYPE_LABELS,
  AccountIcon,
} from "@/components/shared/category-icon";
import { Amount } from "@/components/shared/money";
import { Badge } from "@/components/ui/badge";
import type { CurrencyCode } from "@/lib/currency";
import { cn } from "@/lib/utils";
import type { AccountDTO } from "@/types";

type AccountCardProps = {
  account: AccountDTO;
  currency: CurrencyCode;
};

/**
 * One account at a glance: what it is, what it holds, and what has moved
 * through it. Only the actions menu is interactive, so the card itself stays a
 * Server Component.
 */
export function AccountCard({ account, currency }: AccountCardProps) {
  const accountCurrency = account.currency as CurrencyCode;

  return (
    <article
      className={cn(
        "surface surface-hover relative flex flex-col p-5",
        account.archived && "opacity-70",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <AccountIcon type={account.type} />
          <div className="min-w-0">
            <Link
              href={`/accounts/${account.id}`}
              className="block truncate text-sm font-medium text-foreground underline-offset-4 hover:underline"
            >
              {account.name}
            </Link>
            <p className="truncate text-xs text-muted-foreground">
              {ACCOUNT_TYPE_LABELS[account.type]} · {account.currency}
            </p>
          </div>
        </div>

        <AccountActions account={account} currency={currency} tone="subtle" />
      </div>

      <div className="mt-5">
        <p className="text-xs text-muted-foreground">Current balance</p>
        <Amount
          value={account.balance}
          currency={accountCurrency}
          className="mt-1 block text-[1.6rem] font-semibold leading-none tracking-[-0.025em] text-foreground"
        />
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-4 text-xs">
        <div>
          <dt className="text-muted-foreground">Money in</dt>
          <dd className="mt-0.5">
            <Amount
              value={account.income}
              currency={accountCurrency}
              className="font-medium text-positive"
              compactDecimals
            />
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Money out</dt>
          <dd className="mt-0.5">
            <Amount
              value={account.expenses}
              currency={accountCurrency}
              className="font-medium text-foreground"
              compactDecimals
            />
          </dd>
        </div>
      </dl>

      {account.archived ? (
        <Badge variant="secondary" className="absolute right-4 top-14 text-[0.65rem]">
          Archived
        </Badge>
      ) : null}
    </article>
  );
}
