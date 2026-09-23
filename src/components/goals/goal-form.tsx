"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Field } from "@/components/shared/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { currencySymbol, type CurrencyCode } from "@/lib/currency";
import { applyServerErrors } from "@/lib/form";
import { cn } from "@/lib/utils";
import { savingsGoalSchema, type SavingsGoalInput } from "@/lib/validations";
import { createGoalAction, updateGoalAction } from "@/server/actions/goals";
import type { SavingsGoalDTO } from "@/types";

const SWATCHES = ["#0f9d76", "#6366f1", "#f59e0b", "#ec4899", "#0ea5e9", "#8b5cf6"];

type GoalFormProps = {
  currency: CurrencyCode;
  goal?: SavingsGoalDTO;
  onDone: () => void;
};

export function GoalForm({ currency, goal, onDone }: GoalFormProps) {
  const router = useRouter();
  const isEditing = Boolean(goal);

  const form = useForm<SavingsGoalInput>({
    resolver: zodResolver(savingsGoalSchema),
    defaultValues: {
      name: goal?.name ?? "",
      targetAmount: goal?.targetAmount ?? "",
      currentAmount: goal?.currentAmount ?? "0",
      targetDate: goal?.targetDate ? goal.targetDate.slice(0, 10) : "",
      description: goal?.description ?? "",
      color: goal?.color ?? SWATCHES[0],
    },
  });

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = form;

  const color = useWatch({ control, name: "color" });

  async function onSubmit(values: SavingsGoalInput) {
    const result = isEditing
      ? await updateGoalAction({ ...values, id: goal!.id })
      : await createGoalAction(values);

    if (!result.ok) {
      const message = applyServerErrors(form, result);
      if (message) toast.error(message);
      return;
    }

    toast.success(isEditing ? "Goal updated" : "Goal created", { description: values.name });
    router.refresh();
    onDone();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <Field label="Goal name" error={errors.name?.message} required>
        {(props) => (
          <Input placeholder="e.g. Emergency Fund" autoComplete="off" {...props} {...register("name")} />
        )}
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Target amount" error={errors.targetAmount?.message} required>
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
                className="pl-8 tnum"
                {...props}
                {...register("targetAmount")}
              />
            </div>
          )}
        </Field>

        {!isEditing ? (
          <Field
            label="Already saved"
            error={errors.currentAmount?.message}
            hint="Optional starting balance."
          >
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
                  className="pl-8 tnum"
                  {...props}
                  {...register("currentAmount")}
                />
              </div>
            )}
          </Field>
        ) : (
          <Field label="Target date" error={errors.targetDate?.message} hint="Optional.">
            {(props) => <Input type="date" {...props} {...register("targetDate")} />}
          </Field>
        )}
      </div>

      {!isEditing ? (
        <Field label="Target date" error={errors.targetDate?.message} hint="Optional.">
          {(props) => <Input type="date" {...props} {...register("targetDate")} />}
        </Field>
      ) : null}

      <fieldset className="space-y-2">
        <legend className="text-[0.8rem] font-medium text-foreground">Colour</legend>
        <div className="flex flex-wrap gap-2">
          {SWATCHES.map((swatch) => (
            <button
              key={swatch}
              type="button"
              aria-label={`Use colour ${swatch}`}
              aria-pressed={color === swatch}
              onClick={() => setValue("color", swatch, { shouldValidate: true })}
              className={cn(
                "size-8 rounded-full border-2 transition-transform duration-150 hover:scale-105",
                color === swatch ? "border-foreground" : "border-transparent",
              )}
              style={{ backgroundColor: swatch }}
            />
          ))}
        </div>
      </fieldset>

      <Field label="Description" error={errors.description?.message} hint="Optional.">
        {(props) => (
          <Textarea rows={2} placeholder="What are you saving for?" {...props} {...register("description")} />
        )}
      </Field>

      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={onDone} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="sm:min-w-32">
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Saving
            </>
          ) : isEditing ? (
            "Save changes"
          ) : (
            "Create goal"
          )}
        </Button>
      </div>
    </form>
  );
}
