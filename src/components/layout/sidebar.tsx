"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { Logo, LogoMark } from "@/components/brand/logo";
import { NAV_ITEMS, isActivePath } from "@/components/layout/nav-items";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useHydrated } from "@/hooks/use-hydrated";
import { useLocalStorageFlag } from "@/hooks/use-local-storage";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "moneyflow:sidebar-collapsed";

export function Sidebar() {
  const pathname = usePathname();
  const mounted = useHydrated();
  const [collapsed, setCollapsed] = useLocalStorageFlag(STORAGE_KEY, false);

  function toggle() {
    setCollapsed(!collapsed);
  }

  return (
    <aside
      data-collapsed={collapsed}
      className={cn(
        "sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex",
        "transition-[width] duration-200 ease-out",
        collapsed ? "w-[4.75rem]" : "w-[16.5rem]",
      )}
    >
      <div
        className={cn(
          "flex h-16 items-center border-b border-sidebar-border",
          collapsed ? "justify-center px-3" : "px-5",
        )}
      >
        <Link
          href="/dashboard"
          className="rounded-lg focus-visible:outline-none"
          aria-label="MoneyFlow home"
        >
          {collapsed ? <LogoMark /> : <Logo />}
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5 scrollbar-slim" aria-label="Main">
        {!collapsed ? (
          <p className="px-3 pb-2 text-[0.7rem] font-medium uppercase tracking-[0.13em] text-muted-foreground">
            Menu
          </p>
        ) : null}

        {NAV_ITEMS.map((item) => {
          const active = mounted && isActivePath(pathname, item.href);
          const Icon = item.icon;

          const link = (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex items-center rounded-xl text-sm font-medium transition-colors duration-150",
                collapsed ? "h-10 w-full justify-center" : "h-10 gap-3 px-3",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
              )}
            >
              <span
                className={cn(
                  "absolute left-0 h-5 w-[3px] rounded-r-full bg-brand transition-all duration-200",
                  active ? "opacity-100" : "scale-y-0 opacity-0",
                )}
                aria-hidden="true"
              />
              <Icon
                className={cn("size-[1.05rem] shrink-0", active && "text-foreground")}
                strokeWidth={active ? 2.1 : 1.85}
                aria-hidden="true"
              />
              {!collapsed ? <span className="truncate">{item.label}</span> : null}
            </Link>
          );

          return collapsed ? (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>{link}</TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          ) : (
            link
          );
        })}
      </nav>

      <div className={cn("border-t border-sidebar-border p-3", collapsed && "flex justify-center")}>
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "sm"}
          onClick={toggle}
          className={cn("text-muted-foreground", !collapsed && "w-full justify-start gap-2")}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen className="size-4" aria-hidden="true" />
          ) : (
            <>
              <PanelLeftClose className="size-4" aria-hidden="true" />
              <span>Collapse</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
