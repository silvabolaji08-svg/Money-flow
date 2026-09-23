"use client";

import { Plus } from "lucide-react";

import { useQuickAdd } from "@/components/providers/quick-add-provider";
import { Button } from "@/components/ui/button";

export function AddAccountButton({ label = "Add account" }: { label?: string }) {
  const { open } = useQuickAdd();

  return (
    <Button onClick={() => open("account")}>
      <Plus className="size-4" aria-hidden="true" />
      {label}
    </Button>
  );
}
