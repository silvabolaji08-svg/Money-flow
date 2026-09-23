import type { CSSProperties } from "react";

import { CategoryIcon } from "@/components/shared/category-icon";
import { TransactionAmount } from "@/components/shared/money";
import type { CurrencyCode } from "@/lib/currency";
import { formatTransactionDate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { TransactionDTO } from "@/types";

type TransactionRowProps = {
  transaction: TransactionDTO;
  currency: CurrencyCode;
  className?: string;
  style?: CSSProperties;
  /** Hide the account name when the context already implies it. */
  showAccount?: boolean;
  /** Briefly tint the amount — used when the row has just been added. */
  highlightAmount?: boolean;
  action?: React.ReactNode;
};

/**
 * The canonical way a transaction reads across the app — dashboard, account
 * detail, and the mobile transactions list all share this row.
 */
export function TransactionRow({
  transaction,
  currency,
  className,
  style,
  showAccount = true,
  highlightAmount = false,
  action,
}: TransactionRowProps) {
  return (
    <div
      className={cn(
        "row-interactive flex items-center gap-3 rounded-xl px-2 py-2.5 sm:gap-4 sm:px-3",
        className,
      )}
      style={style}
    >
      <CategoryIcon icon={transaction.category.icon} color={transaction.category.color} />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{transaction.description}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
          <span className="truncate">{transaction.category.name}</span>
          <span aria-hidden="true">·</span>
          <time dateTime={transaction.date}>{formatTransactionDate(transaction.date)}</time>
          {showAccount ? (
            <>
              <span aria-hidden="true" className="hidden sm:inline">
                ·
              </span>
              <span className="hidden truncate sm:inline">{transaction.account.name}</span>
            </>
          ) : null}
        </p>
      </div>

      <TransactionAmount
        value={transaction.amount}
        type={transaction.type}
        currency={currency}
        className={cn(
          "shrink-0 rounded-md px-1.5 py-0.5 text-sm sm:text-[0.95rem]",
          highlightAmount && "animate-value-flash",
        )}
      />

      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
