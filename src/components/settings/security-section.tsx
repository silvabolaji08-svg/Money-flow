"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { SaveButton } from "@/components/motion/save-button";
import { Field } from "@/components/shared/field";
import { Input } from "@/components/ui/input";
import { applyServerErrors } from "@/lib/form";
import { changePasswordSchema, type ChangePasswordInput } from "@/lib/validations";
import { changePasswordAction } from "@/server/actions/settings";

export function SecuritySection({ memberSince }: { memberSince: string }) {
  const [savedAt, setSavedAt] = useState(0);
  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = form;

  async function onSubmit(values: ChangePasswordInput) {
    const result = await changePasswordAction(values);

    if (!result.ok) {
      const message = applyServerErrors(form, result);
      if (message) toast.error(message);
      return;
    }

    toast.success("Password changed", {
      description: "Use your new password the next time you sign in.",
    });
    setSavedAt((count) => count + 1);
    reset();
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-3 rounded-xl border border-border bg-muted/40 p-4">
        <ShieldCheck className="mt-0.5 size-[1.05rem] shrink-0 text-brand" aria-hidden="true" />
        <div className="space-y-1 text-xs leading-relaxed text-muted-foreground">
          <p className="text-sm font-medium text-foreground">Your account is protected</p>
          <p>
            Passwords are hashed with bcrypt before they are stored, and your session is a signed
            token that never contains your financial data. Account opened {memberSince}.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field label="Current password" error={errors.currentPassword?.message} required>
          {(props) => (
            <Input
              type="password"
              autoComplete="current-password"
              className="sm:max-w-sm"
              {...props}
              {...register("currentPassword")}
            />
          )}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="New password"
            error={errors.newPassword?.message}
            hint="At least 8 characters, with a letter and a number."
            required
          >
            {(props) => (
              <Input
                type="password"
                autoComplete="new-password"
                {...props}
                {...register("newPassword")}
              />
            )}
          </Field>

          <Field label="Confirm new password" error={errors.confirmPassword?.message} required>
            {(props) => (
              <Input
                type="password"
                autoComplete="new-password"
                {...props}
                {...register("confirmPassword")}
              />
            )}
          </Field>
        </div>

        <div className="flex justify-end">
          <SaveButton
            pending={isSubmitting}
            savedAt={savedAt}
            label="Change password"
            savingLabel="Updating"
            savedLabel="Password changed"
          />
        </div>
      </form>
    </div>
  );
}
