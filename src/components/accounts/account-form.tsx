"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { ACCOUNT_TYPE_LABELS } from "@/components/shared/category-icon";
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
import { CURRENCIES, CURRENCY_CODES, currencySymbol, type CurrencyCode } from "@/lib/currency";
import { applyServerErrors } from "@/lib/form";
import { accountSchema, type AccountInput } from "@/lib/validations";
import { createAccountAction, updateAccountAction } from "@/server/actions/accounts";
import type { AccountDTO, AccountType } from "@/types";

const ACCOUNT_TYPES = Object.keys(ACCOUNT_TYPE_LABELS) as AccountType[];

type AccountFormProps = {
  currency: CurrencyCode;
  account?: AccountDTO;
  onDone: () => void;
};

export function AccountForm({ currency, account, onDone }: AccountFormProps) {
  const router = useRouter();
  const isEditing = Boolean(account);

  const form = useForm<AccountInput>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: account?.name ?? "",
      type: (account?.type as AccountInput["type"]) ?? "BANK",
      currency: account?.currency ?? currency,
      openingBalance: account?.openingBalance ?? "0",
      description: account?.description ?? "",
    },
  });

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = form;

  const selectedType = useWatch({ control, name: "type" });
  const selectedCurrency = useWatch({ control, name: "currency" }) as CurrencyCode;

  async function onSubmit(values: AccountInput) {
    const result = isEditing
      ? await updateAccountAction({ ...values, id: account!.id })
      : await createAccountAction(values);

    if (!result.ok) {
      const message = applyServerErrors(form, result);
      if (message) toast.error(message);
      return;
    }

    toast.success(isEditing ? "Account updated" : "Account created", {
      description: values.name,
    });

    router.refresh();
    onDone();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <Field label="Account name" error={errors.name?.message} required>
        {(props) => (
          <Input placeholder="e.g. GTBank Current" autoComplete="off" {...props} {...register("name")} />
        )}
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Type" error={errors.type?.message} required>
          {(props) => (
            <Select
              value={selectedType}
              onValueChange={(value) =>
                setValue("type", value as AccountInput["type"], { shouldValidate: true })
              }
            >
              <SelectTrigger id={props.id} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACCOUNT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {ACCOUNT_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </Field>

        <Field label="Currency" error={errors.currency?.message} required>
          {(props) => (
            <Select
              value={selectedCurrency}
              onValueChange={(value) => setValue("currency", value, { shouldValidate: true })}
            >
              <SelectTrigger id={props.id} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCY_CODES.map((code) => (
                  <SelectItem key={code} value={code}>
                    {CURRENCIES[code].symbol} {code} — {CURRENCIES[code].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </Field>
      </div>

      <Field
        label={isEditing ? "Opening balance" : "Starting balance"}
        error={errors.openingBalance?.message}
        hint="What the account holds before any tracked transaction."
        required
      >
        {(props) => (
          <div className="relative">
            <span
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
              aria-hidden="true"
            >
              {currencySymbol(selectedCurrency ?? currency)}
            </span>
            <Input
              inputMode="decimal"
              autoComplete="off"
              placeholder="0.00"
              className="pl-8 tnum"
              {...props}
              {...register("openingBalance")}
            />
          </div>
        )}
      </Field>

      <Field label="Description" error={errors.description?.message} hint="Optional.">
        {(props) => (
          <Textarea rows={2} placeholder="What is this account for?" {...props} {...register("description")} />
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
            "Create account"
          )}
        </Button>
      </div>
    </form>
  );
}
