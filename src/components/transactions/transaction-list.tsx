"use client";

import { MoreHorizontal, Pencil, Receipt, Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { useQuickAdd } from "@/components/providers/quick-add-provider";
import { CategoryIcon } from "@/components/shared/category-icon";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { TransactionAmount } from "@/components/shared/money";
import { TransactionRow } from "@/components/transactions/transaction-row";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useNewlyAdded } from "@/hooks/use-newly-added";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type { CurrencyCode } from "@/lib/currency";
import { formatTransactionDate } from "@/lib/dates";
import { ROW_EXIT_MS } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { deleteTransactionAction } from "@/server/actions/transactions";
import type { TransactionDTO } from "@/types";

type TransactionListProps = {
  transactions: TransactionDTO[];
  currency: CurrencyCode;
  hasFilters: boolean;
};

/** Only the first rows stagger; a full page of them would crawl. */
const MAX_STAGGERED_ROWS = 8;

/**
 * A table on laptops and up; on phones the same data becomes a touch-friendly
 * card list, because a six-column table is unusable at 380px wide.
 *
 * Three pieces of motion, each tied to something that actually happened:
 * a row that was just created animates in and its amount is briefly tinted;
 * a deleted row leaves before it is removed; and re-filtering fades the list
 * rather than swapping it underneath the reader.
 */
export function TransactionList({ transactions, currency, hasFilters }: TransactionListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { open } = useQuickAdd();
  const reducedMotion = useReducedMotion();

  /** Rows mid-exit. They stay mounted until the animation finishes. */
  const [removing, setRemoving] = useState<Set<string>>(new Set());

  const newlyAdded = useNewlyAdded(transactions.map((transaction) => transaction.id));

  // Re-filtering replaces the contents, so the list fades back in as a unit.
  const filterKey = searchParams.toString();

  async function handleDelete(transaction: TransactionDTO) {
    // Let the row leave first; the write follows. If it fails the row comes
    // back and nothing has been lost.
    if (!reducedMotion) {
      setRemoving((current) => new Set(current).add(transaction.id));
      await new Promise((resolve) => setTimeout(resolve, ROW_EXIT_MS));
    }

    const result = await deleteTransactionAction(transaction.id);

    if (!result.ok) {
      setRemoving((current) => {
        const next = new Set(current);
        next.delete(transaction.id);
        return next;
      });
      toast.error(result.error);
      return;
    }

    toast.success("Transaction deleted", { description: transaction.description });
    router.refresh();
  }

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title={hasFilters ? "No matching transactions" : "No transactions yet"}
        description={
          hasFilters
            ? "Try widening your search or clearing a filter to see more."
            : "Start tracking your money by adding your first transaction."
        }
        action={
          hasFilters ? null : (
            <Button onClick={() => open("transaction")}>Add transaction</Button>
          )
        }
      />
    );
  }

  return (
    <div key={filterKey} className="animate-fade">
      {/* Mobile: cards. Each row is its own box, so it can truly collapse. */}
      <ul className="divide-y divide-border/70 sm:hidden">
        {transactions.map((transaction, index) => {
          const isNew = newlyAdded.has(transaction.id);

          return (
            <li
              key={transaction.id}
              className="row-collapse"
              data-removing={removing.has(transaction.id)}
            >
              <div>
                <TransactionRow
                  transaction={transaction}
                  currency={currency}
                  highlightAmount={isNew}
                  className={cn(isNew && "animate-row-enter")}
                  style={
                    isNew && index < MAX_STAGGERED_ROWS
                      ? { animationDelay: `${index * 30}ms` }
                      : undefined
                  }
                  action={
                    <RowActions
                      transaction={transaction}
                      onEdit={() => open("transaction", { transaction })}
                      onDelete={() => handleDelete(transaction)}
                      pending={removing.has(transaction.id)}
                    />
                  }
                />
              </div>
            </li>
          );
        })}
      </ul>

      {/* Desktop: table. Table rows cannot animate their own height, so a
          removed row slides and fades instead of collapsing. */}
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[38%]">Transaction</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="hidden lg:table-cell">Account</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {transactions.map((transaction, index) => {
              const isNew = newlyAdded.has(transaction.id);
              const isRemoving = removing.has(transaction.id);

              return (
                <TableRow
                  key={transaction.id}
                  className={cn(
                    "group row-interactive",
                    isNew && "animate-row-enter",
                    isRemoving && "animate-row-exit pointer-events-none",
                  )}
                  style={
                    isNew && index < MAX_STAGGERED_ROWS
                      ? { animationDelay: `${index * 30}ms` }
                      : undefined
                  }
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <CategoryIcon
                        icon={transaction.category.icon}
                        color={transaction.category.color}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">
                          {transaction.description}
                        </p>
                        {transaction.notes ? (
                          <p className="truncate text-xs text-muted-foreground">
                            {transaction.notes}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="text-muted-foreground">
                    {transaction.category.name}
                  </TableCell>

                  <TableCell className="hidden text-muted-foreground lg:table-cell">
                    {transaction.account.name}
                  </TableCell>

                  <TableCell className="whitespace-nowrap text-muted-foreground tnum">
                    <time dateTime={transaction.date}>
                      {formatTransactionDate(transaction.date)}
                    </time>
                  </TableCell>

                  <TableCell className="text-right">
                    <TransactionAmount
                      value={transaction.amount}
                      type={transaction.type}
                      currency={currency}
                      className={cn(
                        "rounded-md px-1.5 py-0.5",
                        isNew && "animate-value-flash",
                      )}
                    />
                  </TableCell>

                  <TableCell>
                    <RowActions
                      transaction={transaction}
                      onEdit={() => open("transaction", { transaction })}
                      onDelete={() => handleDelete(transaction)}
                      pending={isRemoving}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function RowActions({
  transaction,
  onEdit,
  onDelete,
  pending,
}: {
  transaction: TransactionDTO;
  onEdit: () => void;
  onDelete: () => Promise<void> | void;
  pending: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={pending}
          aria-label={`Actions for ${transaction.description}`}
          className="text-muted-foreground transition-opacity"
        >
          <MoreHorizontal className="size-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onSelect={onEdit} className="gap-2">
          <Pencil className="size-4" aria-hidden="true" />
          Edit
        </DropdownMenuItem>

        <ConfirmDialog
          trigger={
            <DropdownMenuItem
              onSelect={(event) => event.preventDefault()}
              className="gap-2 text-destructive focus:text-destructive"
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Delete
            </DropdownMenuItem>
          }
          title="Delete this transaction?"
          description={`"${transaction.description}" will be removed permanently, and your balances will be recalculated without it.`}
          confirmLabel="Delete"
          destructive
          onConfirm={onDelete}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
