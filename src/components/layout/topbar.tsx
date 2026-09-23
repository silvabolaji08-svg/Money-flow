"use client";

import { Plus } from "lucide-react";

import { MobileNavDrawer } from "@/components/layout/mobile-nav";
import { NAV_ITEMS, isActivePath } from "@/components/layout/nav-items";
import { UserMenu } from "@/components/layout/user-menu";
import { useQuickAdd } from "@/components/providers/quick-add-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";

type TopbarProps = {
  name: string;
  email: string;
};

export function Topbar({ name, email }: TopbarProps) {
  const pathname = usePathname();
  const { open } = useQuickAdd();

  const current = NAV_ITEMS.find((item) => isActivePath(pathname, item.href));

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-2 px-4 sm:px-6 lg:px-8">
        <div className="lg:hidden">
          <MobileNavDrawer />
        </div>

        <h2 className="truncate text-[0.95rem] font-medium text-foreground lg:hidden">
          {current?.label ?? "MoneyFlow"}
        </h2>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <Button
            onClick={() => open("transaction")}
            className="hidden sm:inline-flex"
            size="default"
          >
            <Plus className="size-4" aria-hidden="true" />
            Add transaction
          </Button>

          <ThemeToggle />
          <UserMenu name={name} email={email} />
        </div>
      </div>
    </header>
  );
}
