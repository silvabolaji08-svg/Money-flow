"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDownLeft, ArrowUpRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
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
import { toDateInputValue } from "@/lib/dates";
import { applyServerErrors } from "@/lib/form";
import { cn } from "@/lib/utils";
import { transactionSchema, type TransactionInput } from "@/lib/validations";
import {
  createTransactionAction,
  updateTransactionAction,
} from "@/server/actions/transactions";
import type { TransactionDTO } from "@/types";

export type AccountOption = { id: string; name: string; type: string };
export type CategoryOption = {
  id: string;
  name: string;
  kind: "INCOME" | "EXPENSE";
  icon: string;
  color: string;
};

type TransactionFormProps = {
  accounts: AccountOption[];
  categories: CategoryOption[];
  currency: CurrencyCode;
  /** Present when editing an existing transaction. */
  transaction?: TransactionDTO;
  defaultAccountId?: string;
  onDone: () => void;
};

export function TransactionForm({
  accounts,
  categories,
  currency,
  transaction,
  defaultAccountId,
  onDone,
}: TransactionFormProps) {
  const router = useRouter();
  const isEditing = Boolean(transaction);

  const form = useForm<TransactionInput>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      amount: transaction?.amount ?? "",
      type: transaction?.type ?? "EXPENSE",
      accountId: transaction?.account.id ?? defaultAccountId ?? accounts[0]?.id ?? "",
      categoryId: transaction?.category.id ?? "",
      date: toDateInputValue(transaction?.date ?? new Date()),
      description: transaction?.description ?? "",
      notes: transaction?.notes ?? "",
    },
  });

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = form;

  const type = useWatch({ control, name: "type" });
  const categoryId = useWatch({ control, name: "categoryId" });
  const accountId = useWatch({ control, name: "accountId" });

  const visibleCategories = useMemo(
    () => categories.filter((category) => category.kind === type),
    [categories, type],
  );

  // Keep the selected category valid when the income/expense toggle flips.
  useEffect(() => {
    if (categoryId && visibleCategories.some((category) => category.id === categoryId)) {
      return;
    }
    setValue("categoryId", visibleCategories[0]?.id ?? "", { shouldValidate: false });
  }, [type, visibleCategories, categoryId, setValue]);

  async function onSubmit(values: TransactionInput) {
    const payload = isEditing ? { ...values, id: transaction!.id } : values;
    const result = isEditing
      ? await updateTransactionAction(payload)
      : await createTransactionAction(payload);

    if (!result.ok) {
      const message = applyServerErrors(form, result);
      if (message) toast.error(message);
      return;
    }

    toast.success(isEditing ? "Transaction updated" : "Transaction added", {
      description: values.description,
    });

    router.refresh();
    onDone();
  }

  const symbol = currencySymbol(currency);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {/* The amount is the focal point of this form. */}
      <div className="rounded-2xl border border-border bg-muted/40 p-5">
        <label
          htmlFor="transaction-amount"
          className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground"
        >
          Amount
        </label>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span
            className={cn(
              "text-2xl font-medium",
              type === "INCOME" ? "text-positive" : "text-muted-foreground",
            )}
            aria-hidden="true"
          >
            {symbol}
          </span>
          <input
            id="transaction-amount"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0.00"
            aria-invalid={Boolean(errors.amount)}
            aria-describedby={errors.amount ? "transaction-amount-error" : undefined}
            className={cn(
              "w-full min-w-0 bg-transparent text-[2.1rem] font-semibold leading-none tracking-[-0.02em] tnum",
              "text-foreground outline-none placeholder:text-muted-foreground/45",
              type === "INCOME" && "text-positive",
            )}
            {...register("amount")}
          />
        </div>
        {errors.amount ? (
          <p
            id="transaction-amount-error"
            role="alert"
            className="mt-2 text-xs font-medium text-destructive"
          >
            {errors.amount.message}
          </p>
        ) : null}
      </div>

      {/* Income / expense segmented control */}
      <fieldset>
        <legend className="sr-only">Transaction type</legend>
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
          {(["EXPENSE", "INCOME"] as const).map((option) => {
            const active = type === option;
            const Icon = option === "INCOME" ? ArrowDownLeft : ArrowUpRight;

            return (
              <button
                key={option}
                type="button"
                onClick={() => setValue("type", option, { shouldValidate: true })}
                aria-pressed={active}
                className={cn(
                  "flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all duration-150",
                  active
                    ? option === "INCOME"
                      ? "bg-card text-positive shadow-[var(--shadow-elevated)]"
                      : "bg-card text-foreground shadow-[var(--shadow-elevated)]"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                {option === "INCOME" ? "Income" : "Expense"}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Category" error={errors.categoryId?.message} required>
          {(props) => (
            <Select
              value={categoryId}
              onValueChange={(value) => setValue("categoryId", value, { shouldValidate: true })}
            >
              <SelectTrigger id={props.id} aria-invalid={props["aria-invalid"]} className="w-full">
                <SelectValue placeholder="Choose a category" />
              </SelectTrigger>
              <SelectContent>
                {visibleCategories.map((category) => (
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

        <Field label="Account" error={errors.accountId?.message} required>
          {(props) => (
            <Select
              value={accountId}
              onValueChange={(value) => setValue("accountId", value, { shouldValidate: true })}
            >
              <SelectTrigger id={props.id} aria-invalid={props["aria-invalid"]} className="w-full">
                <SelectValue placeholder="Choose an account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Date" error={errors.date?.message} required>
          {(props) => <Input type="date" {...props} {...register("date")} />}
        </Field>

        <Field label="Description" error={errors.description?.message} required>
          {(props) => (
            <Input
              placeholder={type === "INCOME" ? "October salary" : "Groceries"}
              autoComplete="off"
              {...props}
              {...register("description")}
            />
          )}
        </Field>
      </div>

      <Field label="Notes" error={errors.notes?.message} hint="Optional — anything worth remembering later.">
        {(props) => (
          <Textarea rows={2} placeholder="Add a note" {...props} {...register("notes")} />
        )}
      </Field>

      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={onDone} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="sm:min-w-36">
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Saving
            </>
          ) : isEditing ? (
            "Save changes"
          ) : (
            "Add transaction"
          )}
        </Button>
      </div>
    </form>
  );
}
