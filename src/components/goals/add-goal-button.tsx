"use client";

import { Plus } from "lucide-react";

import { useQuickAdd } from "@/components/providers/quick-add-provider";
import { Button } from "@/components/ui/button";

export function AddGoalButton({ label = "Add savings goal" }: { label?: string }) {
  const { open } = useQuickAdd();

  return (
    <Button onClick={() => open("goal")}>
      <Plus className="size-4" aria-hidden="true" />
      {label}
    </Button>
  );
}
