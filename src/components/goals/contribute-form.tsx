"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Minus, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Field } from "@/components/shared/field";
import { Amount } from "@/components/shared/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { currencySymbol, type CurrencyCode } from "@/lib/currency";
import { applyServerErrors } from "@/lib/form";
import { cn } from "@/lib/utils";
import { goalContributionSchema, type GoalContributionInput } from "@/lib/validations";
import { contributeToGoalAction } from "@/server/actions/goals";
import type { SavingsGoalDTO } from "@/types";

type ContributeFormProps = {
  goal: SavingsGoalDTO;
  currency: CurrencyCode;
  onDone: () => void;
};

export function ContributeForm({ goal, currency, onDone }: ContributeFormProps) {
  const router = useRouter();

  const form = useForm<GoalContributionInput>({
    resolver: zodResolver(goalContributionSchema),
    defaultValues: { goalId: goal.id, amount: "", direction: "add", note: "" },
  });

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = form;

  const direction = useWatch({ control, name: "direction" });

  async function onSubmit(values: GoalContributionInput) {
    const result = await contributeToGoalAction(values);

    if (!result.ok) {
      const message = applyServerErrors(form, result);
      if (message) toast.error(message);
      return;
    }

    toast.success(direction === "add" ? "Money added" : "Money withdrawn", {
      description: goal.name,
    });

    router.refresh();
    onDone();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm">
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">Currently saved</span>
          <Amount
            value={goal.currentAmount}
            currency={currency}
            className="font-semibold text-foreground"
          />
        </div>
        <div className="mt-2 flex items-center justify-between gap-4">
          <span className="text-muted-foreground">Target</span>
          <Amount value={goal.targetAmount} currency={currency} className="text-muted-foreground" />
        </div>
      </div>

      <fieldset>
        <legend className="sr-only">Direction</legend>
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
          {(["add", "withdraw"] as const).map((option) => {
            const active = direction === option;
            const Icon = option === "add" ? Plus : Minus;

            return (
              <button
                key={option}
                type="button"
                onClick={() => setValue("direction", option, { shouldValidate: true })}
                aria-pressed={active}
                className={cn(
                  "flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all duration-150",
                  active
                    ? "bg-card text-foreground shadow-[var(--shadow-elevated)]"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                {option === "add" ? "Add money" : "Withdraw"}
              </button>
            );
          })}
        </div>
      </fieldset>

      <Field label="Amount" error={errors.amount?.message} required>
        {(props) => (
          <div className="relative">
            <span
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
              aria-hidden="true"
            >
              {currencySymbol(currency)}
            </span>
            <Input
              inputMode="decimal"
              autoComplete="off"
              placeholder="0.00"
              autoFocus
              className="pl-8 tnum"
              {...props}
              {...register("amount")}
            />
          </div>
        )}
      </Field>

      <Field label="Note" error={errors.note?.message} hint="Optional.">
        {(props) => <Input placeholder="e.g. October transfer" {...props} {...register("note")} />}
      </Field>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={onDone} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="sm:min-w-32">
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Saving
            </>
          ) : direction === "add" ? (
            "Add money"
          ) : (
            "Withdraw"
          )}
        </Button>
      </div>
    </form>
  );
}
