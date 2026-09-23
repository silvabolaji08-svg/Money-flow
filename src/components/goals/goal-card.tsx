"use client";

import { MoreHorizontal, PartyPopper, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { ContributeForm } from "@/components/goals/contribute-form";
import { GoalForm } from "@/components/goals/goal-form";
import { GoalProgress } from "@/components/goals/goal-progress";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Amount } from "@/components/shared/money";
import { ResponsiveDialog } from "@/components/shared/responsive-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CurrencyCode } from "@/lib/currency";
import { formatTransactionDate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { deleteGoalAction } from "@/server/actions/goals";
import type { SavingsGoalDTO } from "@/types";

type GoalCardProps = {
  goal: SavingsGoalDTO;
  currency: CurrencyCode;
};

export function GoalCard({ goal, currency }: GoalCardProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [contributing, setContributing] = useState(false);

  /**
   * The success moment is for the transition into "funded", not for the state
   * of being funded. A goal that was already complete when the page loaded
   * gets the quiet badge; one that crosses the line while you are watching
   * gets the ring and the message, once.
   */
  const wasComplete = useRef(goal.completed);
  const [justCompleted, setJustCompleted] = useState(false);

  useEffect(() => {
    if (goal.completed && !wasComplete.current) {
      setJustCompleted(true);
      const timer = setTimeout(() => setJustCompleted(false), 3200);
      return () => clearTimeout(timer);
    }

    wasComplete.current = goal.completed;
  }, [goal.completed]);

  async function handleDelete() {
    const result = await deleteGoalAction(goal.id);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success("Goal deleted", { description: goal.name });
    router.refresh();
  }

  return (
    <>
      <article
        className={cn(
          "surface surface-hover flex flex-col p-5",
          justCompleted && "animate-ring-pulse border-positive/40",
        )}
      >
        <GoalProgress
          goal={goal}
          currency={currency}
          action={
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground"
                  aria-label={`Actions for ${goal.name}`}
                >
                  <MoreHorizontal className="size-4" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onSelect={() => setEditing(true)} className="gap-2">
                  <Pencil className="size-4" aria-hidden="true" />
                  Edit goal
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
                  title={`Delete ${goal.name}?`}
                  description="The goal and its contribution history will be removed permanently."
                  confirmLabel="Delete goal"
                  destructive
                  onConfirm={handleDelete}
                />
              </DropdownMenuContent>
            </DropdownMenu>
          }
        />

        {justCompleted ? (
          <p
            className="mt-4 flex items-center gap-2 rounded-lg bg-positive-muted px-3 py-2 text-xs font-medium text-positive animate-fade"
            role="status"
          >
            <PartyPopper className="size-3.5 shrink-0" aria-hidden="true" />
            Goal reached — {goal.name} is fully funded.
          </p>
        ) : null}

        {goal.contributions.length > 0 ? (
          <ul className="mt-5 space-y-2 border-t border-border pt-4">
            {goal.contributions.slice(0, 3).map((contribution) => {
              const isWithdrawal = Number(contribution.amount) < 0;

              return (
                <li
                  key={contribution.id}
                  className="flex items-center justify-between gap-3 text-xs"
                >
                  <span className="min-w-0 truncate text-muted-foreground">
                    {contribution.note ?? (isWithdrawal ? "Withdrawal" : "Contribution")}
                    <span className="mx-1.5 text-border" aria-hidden="true">
                      ·
                    </span>
                    <time dateTime={contribution.occurredAt}>
                      {formatTransactionDate(contribution.occurredAt)}
                    </time>
                  </span>
                  <Amount
                    value={contribution.amount}
                    currency={currency}
                    signed
                    colorBySign
                    className="shrink-0 font-medium"
                    compactDecimals
                  />
                </li>
              );
            })}
          </ul>
        ) : null}

        <Button
          variant="outline"
          className="mt-5 w-full"
          onClick={() => setContributing(true)}
        >
          <Plus className="size-4" aria-hidden="true" />
          Add or withdraw money
        </Button>
      </article>

      <ResponsiveDialog
        open={editing}
        onOpenChange={setEditing}
        title="Edit goal"
        description="Change the target, date or description."
      >
        <GoalForm currency={currency} goal={goal} onDone={() => setEditing(false)} />
      </ResponsiveDialog>

      <ResponsiveDialog
        open={contributing}
        onOpenChange={setContributing}
        title={goal.name}
        description="Move money into or out of this goal."
      >
        <ContributeForm goal={goal} currency={currency} onDone={() => setContributing(false)} />
      </ResponsiveDialog>
    </>
  );
}
