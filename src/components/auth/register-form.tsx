"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Field } from "@/components/shared/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { applyServerErrors } from "@/lib/form";
import { cn } from "@/lib/utils";
import { registerSchema, type RegisterInput } from "@/lib/validations";
import { loginAction, registerAction } from "@/server/actions/auth";

const RULES = [
  { test: (value: string) => value.length >= 8, label: "At least 8 characters" },
  { test: (value: string) => /[a-zA-Z]/.test(value), label: "Contains a letter" },
  { test: (value: string) => /\d/.test(value), label: "Contains a number" },
];

export function RegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = form;

  const password = useWatch({ control, name: "password" }) ?? "";

  async function onSubmit(values: RegisterInput) {
    const result = await registerAction(values);

    if (!result.ok) {
      const message = applyServerErrors(form, result);
      if (message) toast.error(message);
      return;
    }

    // Sign the new user straight in — no second form to fill.
    const signedIn = await loginAction({ email: values.email, password: values.password });

    if (!signedIn.ok) {
      toast.success("Account created", { description: "Please sign in to continue." });
      router.push("/login");
      return;
    }

    toast.success("Welcome to MoneyFlow", {
      description: "We have set up your default categories to get you started.",
    });

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-[-0.025em] text-foreground">
          Create your account
        </h1>
        <p className="text-sm text-muted-foreground">
          Free to start. Your first dashboard is a minute away.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field label="Full name" error={errors.name?.message} required>
          {(props) => (
            <Input placeholder="Ada Okafor" autoComplete="name" autoFocus {...props} {...register("name")} />
          )}
        </Field>

        <Field label="Email" error={errors.email?.message} required>
          {(props) => (
            <Input
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              {...props}
              {...register("email")}
            />
          )}
        </Field>

        <Field label="Password" error={errors.password?.message} required>
          {(props) => (
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="new-password"
                className="pr-10"
                {...props}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((previous) => !previous)}
                className="absolute right-1 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="size-4" aria-hidden="true" />
                ) : (
                  <Eye className="size-4" aria-hidden="true" />
                )}
              </button>
            </div>
          )}
        </Field>

        <ul className="space-y-1.5 pt-1">
          {RULES.map((rule) => {
            const met = rule.test(password);

            return (
              <li
                key={rule.label}
                className={cn(
                  "flex items-center gap-2 text-xs transition-colors",
                  met ? "text-positive" : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "inline-flex size-3.5 items-center justify-center rounded-full border transition-colors",
                    met ? "border-positive bg-positive text-positive-foreground" : "border-border",
                  )}
                  aria-hidden="true"
                >
                  {met ? <Check className="size-2.5" strokeWidth={3} /> : null}
                </span>
                {rule.label}
              </li>
            );
          })}
        </ul>

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Creating account
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
