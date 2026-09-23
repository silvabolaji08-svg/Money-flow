"use client";

import { Plus } from "lucide-react";

import { useQuickAdd } from "@/components/providers/quick-add-provider";
import { Button } from "@/components/ui/button";

type AddTransactionButtonProps = {
  /** Pre-select an account, e.g. from an account detail page. */
  accountId?: string;
  label?: string;
};

export function AddTransactionButton({
  accountId,
  label = "Add transaction",
}: AddTransactionButtonProps) {
  const { open } = useQuickAdd();

  return (
    <Button onClick={() => open("transaction", { accountId })}>
      <Plus className="size-4" aria-hidden="true" />
      {label}
    </Button>
  );
}
