"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Plus } from "lucide-react";
import { useState } from "react";

import { Logo } from "@/components/brand/logo";
import { NAV_ITEMS, isActivePath } from "@/components/layout/nav-items";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/** Slide-over navigation drawer, opened from the mobile header. */
export function MobileNavDrawer() {
  const pathname = usePathname();

  // Keying on the path remounts the drawer closed after a navigation, which
  // avoids driving the open state from an effect.
  return <NavDrawer key={pathname} pathname={pathname} />;
}

function NavDrawer({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open navigation">
          <Menu className="size-5" aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[17rem] p-0">
        <SheetHeader className="h-16 justify-center border-b border-border px-5">
          <SheetTitle asChild>
            <Logo />
          </SheetTitle>
        </SheetHeader>

        <nav className="space-y-1 px-3 py-4" aria-label="Main">
          {NAV_ITEMS.map((item) => {
            const active = isActivePath(pathname, item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-xl px-3 text-[0.925rem] font-medium transition-colors",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                )}
              >
                <Icon className="size-[1.1rem]" strokeWidth={active ? 2.1 : 1.85} aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

type MobileTabBarProps = {
  /** Rendered as the centre action — the "add transaction" trigger. */
  action?: React.ReactNode;
};

/**
 * Bottom tab bar for phones. Four primary destinations plus a raised centre
 * action, sitting above the home indicator on iOS.
 */
export function MobileTabBar({ action }: MobileTabBarProps) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => item.primary);
  const left = items.slice(0, 2);
  const right = items.slice(2, 4);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/85 backdrop-blur-xl lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary"
    >
      <div className="mx-auto grid max-w-lg grid-cols-5 items-center px-2">
        {left.map((item) => (
          <TabLink key={item.href} item={item} pathname={pathname} />
        ))}

        <div className="flex items-center justify-center">
          {action ?? (
            <Button size="icon" className="size-11 rounded-full shadow-[var(--shadow-elevated)]">
              <Plus className="size-5" aria-hidden="true" />
            </Button>
          )}
        </div>

        {right.map((item) => (
          <TabLink key={item.href} item={item} pathname={pathname} />
        ))}
      </div>
    </nav>
  );
}

function TabLink({
  item,
  pathname,
}: {
  item: (typeof NAV_ITEMS)[number];
  pathname: string;
}) {
  const active = isActivePath(pathname, item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-16 flex-col items-center justify-center gap-1 rounded-lg text-[0.68rem] font-medium transition-colors",
        active ? "text-foreground" : "text-muted-foreground",
      )}
    >
      <span className="relative">
        <Icon className="size-[1.2rem]" strokeWidth={active ? 2.2 : 1.8} aria-hidden="true" />
        {active ? (
          <span
            className="absolute -bottom-1.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-brand"
            aria-hidden="true"
          />
        ) : null}
      </span>
      <span className="truncate">{item.label.split(" ")[0]}</span>
    </Link>
  );
}
