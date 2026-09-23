"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Field } from "@/components/shared/field";
import { ResponsiveDialog } from "@/components/shared/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { applyServerErrors } from "@/lib/form";
import { deleteAccountSchema } from "@/lib/validations";
import { deleteUserAccountAction } from "@/server/actions/settings";
import type { z } from "zod";

type DeleteInput = z.infer<typeof deleteAccountSchema>;

type DangerZoneProps = {
  counts: { accounts: number; transactions: number; budgets: number; goals: number };
};

export function DangerZone({ counts }: DangerZoneProps) {
  const [open, setOpen] = useState(false);

  const form = useForm<DeleteInput>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: { confirmation: "", password: "" },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  async function onSubmit(values: DeleteInput) {
    const result = await deleteUserAccountAction(values);

    // A successful delete signs the user out and redirects, so reaching this
    // branch at all means something went wrong.
    if (!result.ok) {
      const message = applyServerErrors(form, result);
      if (message) toast.error(message);
    }
  }

  return (
    <>
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
        <div className="flex gap-3">
          <TriangleAlert
            className="mt-0.5 size-[1.05rem] shrink-0 text-destructive"
            aria-hidden="true"
          />
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-foreground">Delete this account</h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              This permanently removes your profile along with {counts.accounts} account
              {counts.accounts === 1 ? "" : "s"}, {counts.transactions} transaction
              {counts.transactions === 1 ? "" : "s"}, {counts.budgets} budget
              {counts.budgets === 1 ? "" : "s"} and {counts.goals} savings goal
              {counts.goals === 1 ? "" : "s"}. It cannot be undone.
            </p>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button
            variant="destructive"
            onClick={() => setOpen(true)}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            Delete account
          </Button>
        </div>
      </div>

      <ResponsiveDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete your MoneyFlow account?"
        description="Everything is removed immediately and cannot be recovered. Confirm with your password."
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Field
            label="Type DELETE to confirm"
            error={errors.confirmation?.message}
            required
          >
            {(props) => (
              <Input
                placeholder="DELETE"
                autoComplete="off"
                spellCheck={false}
                {...props}
                {...register("confirmation")}
              />
            )}
          </Field>

          <Field label="Your password" error={errors.password?.message} required>
            {(props) => (
              <Input
                type="password"
                autoComplete="current-password"
                {...props}
                {...register("password")}
              />
            )}
          </Field>

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Deleting
                </>
              ) : (
                "Permanently delete"
              )}
            </Button>
          </div>
        </form>
      </ResponsiveDialog>
    </>
  );
}
