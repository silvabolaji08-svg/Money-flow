"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { CategoryIcon } from "@/components/shared/category-icon";
import { Field } from "@/components/shared/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { currencySymbol, type CurrencyCode } from "@/lib/currency";
import { applyServerErrors } from "@/lib/form";
import { budgetSchema, type BudgetInput } from "@/lib/validations";
import { createBudgetAction, updateBudgetAction } from "@/server/actions/budgets";
import type { BudgetDTO } from "@/types";

export type BudgetCategoryOption = {
  id: string;
  name: string;
  icon: string;
  color: string;
  taken?: boolean;
};

type BudgetFormProps = {
  categories: BudgetCategoryOption[];
  currency: CurrencyCode;
  /** yyyy-MM */
  month: string;
  budget?: BudgetDTO;
  onDone: () => void;
};

export function BudgetForm({ categories, currency, month, budget, onDone }: BudgetFormProps) {
  const router = useRouter();
  const isEditing = Boolean(budget);

  const available = categories.filter(
    (category) => !category.taken || category.id === budget?.category.id,
  );

  const form = useForm<BudgetInput>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      categoryId: budget?.category.id ?? available[0]?.id ?? "",
      amount: budget?.amount ?? "",
      month: budget ? budget.month.slice(0, 7) : month,
      note: budget?.note ?? "",
    },
  });

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = form;

  const categoryId = useWatch({ control, name: "categoryId" });

  async function onSubmit(values: BudgetInput) {
    const result = isEditing
      ? await updateBudgetAction({ ...values, id: budget!.id })
      : await createBudgetAction(values);

    if (!result.ok) {
      const message = applyServerErrors(form, result);
      if (message) toast.error(message);
      return;
    }

    toast.success(isEditing ? "Budget updated" : "Budget created");
    router.refresh();
    onDone();
  }

  if (available.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Every expense category already has a budget for this month. Create a new category first,
          or edit an existing budget.
        </p>
        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={onDone}>
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <Field label="Category" error={errors.categoryId?.message} required>
        {(props) => (
          <Select
            value={categoryId}
            onValueChange={(value) => setValue("categoryId", value, { shouldValidate: true })}
          >
            <SelectTrigger id={props.id} className="w-full">
              <SelectValue placeholder="Choose a category" />
            </SelectTrigger>
            <SelectContent>
              {available.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  <span className="flex items-center gap-2">
                    <CategoryIcon
                      icon={category.icon}
                      color={category.color}
                      size="sm"
                      className="size-5 rounded-md [&>svg]:size-3"
                    />
                    {category.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Monthly limit" error={errors.amount?.message} required>
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
                {...register("amount")}
              />
            </div>
          )}
        </Field>

        <Field label="Month" error={errors.month?.message} required>
          {(props) => <Input type="month" {...props} {...register("month")} />}
        </Field>
      </div>

      <Field label="Note" error={errors.note?.message} hint="Optional.">
        {(props) => (
          <Textarea rows={2} placeholder="What is this budget for?" {...props} {...register("note")} />
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
            "Create budget"
          )}
        </Button>
      </div>
    </form>
  );
}
