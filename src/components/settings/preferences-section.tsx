"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { SaveButton } from "@/components/motion/save-button";
import { Field } from "@/components/shared/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useHydrated } from "@/hooks/use-hydrated";
import { CURRENCIES, CURRENCY_CODES, type CurrencyCode } from "@/lib/currency";
import { applyServerErrors } from "@/lib/form";
import { cn } from "@/lib/utils";
import { preferencesSchema, type PreferencesInput } from "@/lib/validations";
import { updatePreferencesAction, updateThemeAction } from "@/server/actions/settings";

const THEMES = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

type PreferencesSectionProps = {
  currency: CurrencyCode;
  budgetAlerts: boolean;
  savingsAlerts: boolean;
};

export function PreferencesSection({
  currency,
  budgetAlerts,
  savingsAlerts,
}: PreferencesSectionProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const mounted = useHydrated();
  const [savedAt, setSavedAt] = useState(0);

  const form = useForm<PreferencesInput>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: { currency, budgetAlerts, savingsAlerts },
  });

  const {
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = form;

  const selectedCurrency = useWatch({ control, name: "currency" }) as CurrencyCode;
  const budgets = useWatch({ control, name: "budgetAlerts" });
  const savings = useWatch({ control, name: "savingsAlerts" });

  async function onSubmit(values: PreferencesInput) {
    const result = await updatePreferencesAction(values);

    if (!result.ok) {
      const message = applyServerErrors(form, result);
      if (message) toast.error(message);
      return;
    }

    toast.success("Preferences saved", {
      description: `Amounts now display in ${CURRENCIES[values.currency as CurrencyCode].code}.`,
    });
    setSavedAt((count) => count + 1);
    form.reset(values);
    router.refresh();
  }

  function chooseTheme(value: string) {
    setTheme(value);
    void updateThemeAction(value);
    toast.success(`${value === "system" ? "System" : value === "dark" ? "Dark" : "Light"} theme applied`);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <Field
        label="Display currency"
        error={errors.currency?.message}
        hint="Used to format every amount across the app."
      >
        {(props) => (
          <Select
            value={selectedCurrency}
            onValueChange={(value) => setValue("currency", value, { shouldDirty: true })}
          >
            <SelectTrigger id={props.id} className="w-full sm:w-80">
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

      <fieldset className="space-y-2">
        <legend className="text-[0.8rem] font-medium text-foreground">Theme</legend>
        <div className="grid max-w-md grid-cols-3 gap-2">
          {THEMES.map((option) => {
            const Icon = option.icon;
            const active = mounted && theme === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => chooseTheme(option.value)}
                aria-pressed={active}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border p-4 text-xs font-medium transition-all duration-150",
                  active
                    ? "border-brand bg-brand-soft/40 text-foreground"
                    : "border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground",
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                {option.label}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          Saved to your account, so it follows you to another device.
        </p>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-[0.8rem] font-medium text-foreground">Notifications</legend>

        <ToggleRow
          id="budget-alerts"
          title="Budget alerts"
          detail="Highlight budgets as they approach or pass their monthly limit."
          checked={budgets}
          onChange={(value) => setValue("budgetAlerts", value, { shouldDirty: true })}
        />

        <ToggleRow
          id="savings-alerts"
          title="Savings notifications"
          detail="Flag savings goals that reach their target or fall behind their date."
          checked={savings}
          onChange={(value) => setValue("savingsAlerts", value, { shouldDirty: true })}
        />
      </fieldset>

      <div className="flex justify-end">
        <SaveButton
          pending={isSubmitting}
          savedAt={savedAt}
          disabled={!isDirty}
          label="Save preferences"
        />
      </div>
    </form>
  );
}

function ToggleRow({
  id,
  title,
  detail,
  checked,
  onChange,
}: {
  id: string;
  title: string;
  detail: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-border p-4">
      <div className="space-y-0.5">
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {title}
        </label>
        <p className="text-xs leading-relaxed text-muted-foreground">{detail}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
