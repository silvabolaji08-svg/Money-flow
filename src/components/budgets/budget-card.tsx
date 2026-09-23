"use client";

import { AlertTriangle, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { BudgetForm, type BudgetCategoryOption } from "@/components/budgets/budget-form";
import { BudgetProgress } from "@/components/budgets/budget-progress";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ResponsiveDialog } from "@/components/shared/responsive-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CurrencyCode } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { deleteBudgetAction } from "@/server/actions/budgets";
import type { BudgetDTO } from "@/types";

type BudgetCardProps = {
  budget: BudgetDTO;
  currency: CurrencyCode;
  categories: BudgetCategoryOption[];
  month: string;
};

export function BudgetCard({ budget, currency, categories, month }: BudgetCardProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);

  async function handleDelete() {
    const result = await deleteBudgetAction(budget.id);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success("Budget deleted", { description: budget.category.name });
    router.refresh();
  }

  return (
    <>
      <article
        className={cn(
          "surface surface-hover p-5",
          // A breached budget draws the eye once, then settles. Nothing in a
          // finance product should pulse forever.
          budget.status === "exceeded" && "border-negative/35 animate-ring-pulse",
        )}
        style={
          budget.status === "exceeded"
            ? ({ "--ring-pulse-color": "color-mix(in oklab, var(--negative) 38%, transparent)" } as React.CSSProperties)
            : undefined
        }
      >
        <BudgetProgress
          budget={budget}
          currency={currency}
          action={
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground"
                  aria-label={`Actions for the ${budget.category.name} budget`}
                >
                  <MoreHorizontal className="size-4" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onSelect={() => setEditing(true)} className="gap-2">
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
                  title={`Delete the ${budget.category.name} budget?`}
                  description="Your transactions are untouched — only the monthly limit is removed."
                  confirmLabel="Delete budget"
                  destructive
                  onConfirm={handleDelete}
                />
              </DropdownMenuContent>
            </DropdownMenu>
          }
        />

        {budget.status !== "on-track" ? (
          <p
            className={cn(
              "mt-4 flex items-start gap-2 rounded-lg px-3 py-2 text-xs leading-relaxed animate-fade",
              budget.status === "exceeded"
                ? "bg-negative-muted text-negative"
                : "bg-warning-muted text-warning",
            )}
          >
            <AlertTriangle
              className={cn(
                "mt-0.5 size-3.5 shrink-0",
                budget.status === "warning" && "animate-soft-pulse",
              )}
              aria-hidden="true"
            />
            {budget.status === "exceeded"
              ? "You have gone past this limit for the month."
              : "You are close to this limit — pace the rest of the month."}
          </p>
        ) : null}

        {budget.note ? (
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{budget.note}</p>
        ) : null}
      </article>

      <ResponsiveDialog
        open={editing}
        onOpenChange={setEditing}
        title="Edit budget"
        description="Change the limit, category or month."
      >
        <BudgetForm
          categories={categories}
          currency={currency}
          month={month}
          budget={budget}
          onDone={() => setEditing(false)}
        />
      </ResponsiveDialog>
    </>
  );
}
