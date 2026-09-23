"use client";

import { PiggyBank, Plus, Target, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { useQuickAdd } from "@/components/providers/quick-add-provider";
import { cn } from "@/lib/utils";

const ACTIONS: {
  kind: "transaction" | "account" | "budget" | "goal";
  label: string;
  hint: string;
  icon: LucideIcon;
  accent: string;
}[] = [
  {
    kind: "transaction",
    label: "Add transaction",
    hint: "Money in or out",
    icon: Plus,
    accent: "var(--brand)",
  },
  {
    kind: "account",
    label: "Add account",
    hint: "Bank, cash, wallet",
    icon: Wallet,
    accent: "var(--chart-5)",
  },
  {
    kind: "budget",
    label: "Add budget",
    hint: "Set a monthly limit",
    icon: PiggyBank,
    accent: "var(--warning)",
  },
  {
    kind: "goal",
    label: "Add savings goal",
    hint: "Save with a purpose",
    icon: Target,
    accent: "var(--savings)",
  },
];

export function QuickActions({ className }: { className?: string }) {
  const { open } = useQuickAdd();

  return (
    <div className={cn("grid gap-3 sm:grid-cols-2 xl:grid-cols-4", className)}>
      {ACTIONS.map((action) => {
        const Icon = action.icon;

        return (
          <button
            key={action.kind}
            type="button"
            onClick={() => open(action.kind)}
            className={cn(
              "surface surface-hover group flex items-center gap-3 p-4 text-left",
              "focus-visible:outline-none",
            )}
          >
            <span
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border transition-transform duration-200 group-hover:scale-105"
              style={{
                color: action.accent,
                backgroundColor: `color-mix(in oklab, ${action.accent} 12%, transparent)`,
                borderColor: `color-mix(in oklab, ${action.accent} 24%, transparent)`,
              }}
              aria-hidden="true"
            >
              <Icon className="size-[1.15rem]" strokeWidth={1.9} />
            </span>

            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-foreground">
                {action.label}
              </span>
              <span className="block truncate text-xs text-muted-foreground">{action.hint}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
