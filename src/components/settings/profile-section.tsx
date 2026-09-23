"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { SaveButton } from "@/components/motion/save-button";
import { Field } from "@/components/shared/field";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { initialsFor } from "@/components/layout/user-menu";
import { applyServerErrors } from "@/lib/form";
import { profileSchema, type ProfileInput } from "@/lib/validations";
import { updateProfileAction } from "@/server/actions/settings";

type ProfileSectionProps = {
  name: string;
  email: string;
  memberSince: string;
};

export function ProfileSection({ name, email, memberSince }: ProfileSectionProps) {
  const router = useRouter();
  const [savedAt, setSavedAt] = useState(0);

  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name, email },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = form;

  async function onSubmit(values: ProfileInput) {
    const result = await updateProfileAction(values);

    if (!result.ok) {
      const message = applyServerErrors(form, result);
      if (message) toast.error(message);
      return;
    }

    toast.success("Profile updated");
    setSavedAt((count) => count + 1);
    form.reset(values);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <div className="flex items-center gap-4">
        <Avatar className="size-14">
          <AvatarFallback className="bg-brand-soft text-base font-semibold text-brand">
            {initialsFor(name) || "M"}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium text-foreground">{name}</p>
          <p className="text-xs text-muted-foreground">Member since {memberSince}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" error={errors.name?.message} required>
          {(props) => <Input autoComplete="name" {...props} {...register("name")} />}
        </Field>

        <Field label="Email" error={errors.email?.message} required>
          {(props) => <Input type="email" autoComplete="email" {...props} {...register("email")} />}
        </Field>
      </div>

      <div className="flex justify-end">
        <SaveButton pending={isSubmitting} savedAt={savedAt} disabled={!isDirty} />
      </div>
    </form>
  );
}
