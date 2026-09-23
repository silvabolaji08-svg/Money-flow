"use client";

import { Plus } from "lucide-react";

import { MobileTabBar } from "@/components/layout/mobile-nav";
import { useQuickAdd } from "@/components/providers/quick-add-provider";
import { Button } from "@/components/ui/button";

/** The raised centre action in the mobile tab bar. */
export function MobileTabBarWithAction() {
  const { open } = useQuickAdd();

  return (
    <MobileTabBar
      action={
        <Button
          size="icon"
          onClick={() => open("transaction")}
          aria-label="Add transaction"
          className="size-12 rounded-full shadow-[var(--shadow-lifted)]"
        >
          <Plus className="size-5" aria-hidden="true" />
        </Button>
      }
    />
  );
}
