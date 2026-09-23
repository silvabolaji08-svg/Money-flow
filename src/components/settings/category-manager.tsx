"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Lock, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import {
  CategoryIcon,
  ICON_NAMES,
  resolveIcon,
} from "@/components/shared/category-icon";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Field } from "@/components/shared/field";
import { ResponsiveDialog } from "@/components/shared/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { applyServerErrors } from "@/lib/form";
import { cn } from "@/lib/utils";
import { categorySchema, type CategoryInput } from "@/lib/validations";
import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
} from "@/server/actions/categories";
import type { CategoryDTO } from "@/types";

const SWATCHES = [
  "#0f9d76",
  "#2563eb",
  "#7c3aed",
  "#f97316",
  "#ec4899",
  "#eab308",
  "#14b8a6",
  "#64748b",
];

export function CategoryManager({ categories }: { categories: CategoryDTO[] }) {
  const [editing, setEditing] = useState<CategoryDTO | null>(null);
  const [creating, setCreating] = useState<"INCOME" | "EXPENSE" | null>(null);

  const income = categories.filter((category) => category.kind === "INCOME");
  const expense = categories.filter((category) => category.kind === "EXPENSE");

  return (
    <div className="space-y-8">
      <Group
        title="Income categories"
        categories={income}
        onEdit={setEditing}
        onAdd={() => setCreating("INCOME")}
      />

      <Group
        title="Expense categories"
        categories={expense}
        onEdit={setEditing}
        onAdd={() => setCreating("EXPENSE")}
      />

      <ResponsiveDialog
        open={creating !== null}
        onOpenChange={(open) => (open ? null : setCreating(null))}
        title={`New ${creating === "INCOME" ? "income" : "expense"} category`}
        description="Give it a name, an icon and a colour."
      >
        {creating ? (
          <CategoryForm kind={creating} onDone={() => setCreating(null)} />
        ) : null}
      </ResponsiveDialog>

      <ResponsiveDialog
        open={editing !== null}
        onOpenChange={(open) => (open ? null : setEditing(null))}
        title="Edit category"
        description="Rename it or change how it looks."
      >
        {editing ? (
          <CategoryForm
            kind={editing.kind}
            category={editing}
            onDone={() => setEditing(null)}
          />
        ) : null}
      </ResponsiveDialog>
    </div>
  );
}

function Group({
  title,
  categories,
  onEdit,
  onAdd,
}: {
  title: string;
  categories: CategoryDTO[];
  onEdit: (category: CategoryDTO) => void;
  onAdd: () => void;
}) {
  const router = useRouter();

  async function handleDelete(category: CategoryDTO) {
    const result = await deleteCategoryAction(category.id);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success("Category deleted", { description: category.name });
    router.refresh();
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
        <Button variant="outline" size="sm" onClick={onAdd}>
          <Plus className="size-4" aria-hidden="true" />
          Add
        </Button>
      </div>

      <ul className="grid gap-2 sm:grid-cols-2">
        {categories.map((category) => (
          <li
            key={category.id}
            className="flex items-center gap-3 rounded-xl border border-border p-3"
          >
            <CategoryIcon icon={category.icon} color={category.color} size="sm" />

            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 truncate text-sm font-medium text-foreground">
                {category.name}
                {category.isDefault ? (
                  <Lock className="size-3 text-muted-foreground" aria-label="Built-in category" />
                ) : null}
              </p>
              <p className="text-xs text-muted-foreground tnum">
                {category.transactionCount} transaction
                {category.transactionCount === 1 ? "" : "s"}
              </p>
            </div>

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onEdit(category)}
              aria-label={`Edit ${category.name}`}
              className="text-muted-foreground"
            >
              <Pencil className="size-3.5" aria-hidden="true" />
            </Button>

            {!category.isDefault ? (
              <ConfirmDialog
                trigger={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Delete ${category.name}`}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" aria-hidden="true" />
                  </Button>
                }
                title={`Delete ${category.name}?`}
                description="Categories can only be deleted when no transactions use them."
                confirmLabel="Delete"
                destructive
                onConfirm={() => handleDelete(category)}
              />
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function CategoryForm({
  kind,
  category,
  onDone,
}: {
  kind: "INCOME" | "EXPENSE";
  category?: CategoryDTO;
  onDone: () => void;
}) {
  const router = useRouter();
  const isEditing = Boolean(category);

  const form = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name ?? "",
      kind,
      icon: category?.icon ?? "Circle",
      color: category?.color ?? SWATCHES[0],
    },
  });

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = form;

  const icon = useWatch({ control, name: "icon" });
  const color = useWatch({ control, name: "color" });
  const name = useWatch({ control, name: "name" });

  async function onSubmit(values: CategoryInput) {
    const result = isEditing
      ? await updateCategoryAction({ ...values, id: category!.id })
      : await createCategoryAction(values);

    if (!result.ok) {
      const message = applyServerErrors(form, result);
      if (message) toast.error(message);
      return;
    }

    toast.success(isEditing ? "Category updated" : "Category created", {
      description: values.name,
    });
    router.refresh();
    onDone();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-4">
        <CategoryIcon icon={icon} color={color} size="lg" />
        <div>
          <p className="text-sm font-medium text-foreground">{name || "New category"}</p>
          <p className="text-xs text-muted-foreground">
            {kind === "INCOME" ? "Income" : "Expense"} category
          </p>
        </div>
      </div>

      <Field label="Name" error={errors.name?.message} required>
        {(props) => (
          <Input placeholder="e.g. Groceries" autoComplete="off" {...props} {...register("name")} />
        )}
      </Field>

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
                "size-7 rounded-full border-2 transition-transform duration-150 hover:scale-105",
                color === swatch ? "border-foreground" : "border-transparent",
              )}
              style={{ backgroundColor: swatch }}
            />
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-[0.8rem] font-medium text-foreground">Icon</legend>
        <ScrollArea className="h-40 rounded-xl border border-border p-2">
          <div className="grid grid-cols-7 gap-1.5 sm:grid-cols-9">
            {ICON_NAMES.map((name) => {
              const Icon = resolveIcon(name);
              const active = icon === name;

              return (
                <button
                  key={name}
                  type="button"
                  aria-label={name}
                  aria-pressed={active}
                  onClick={() => setValue("icon", name, { shouldValidate: true })}
                  className={cn(
                    "inline-flex size-8 items-center justify-center rounded-lg border transition-colors",
                    active
                      ? "border-foreground/30 bg-accent text-foreground"
                      : "border-transparent text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                  )}
                >
                  <Icon className="size-4" strokeWidth={1.9} aria-hidden="true" />
                </button>
              );
            })}
          </div>
        </ScrollArea>
        {errors.icon ? (
          <p role="alert" className="text-xs font-medium text-destructive">
            {errors.icon.message}
          </p>
        ) : null}
      </fieldset>

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
            "Create category"
          )}
        </Button>
      </div>
    </form>
  );
}
