"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { addMonths, format, parse } from "date-fns";

import { Button } from "@/components/ui/button";

type MonthSwitcherProps = {
  /** yyyy-MM currently being shown. */
  month: string;
};

/** Steps the budget view between months, keeping the choice in the URL. */
export function MonthSwitcher({ month }: MonthSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const current = parse(month, "yyyy-MM", new Date());

  function goTo(offset: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", format(addMonths(current, offset), "yyyy-MM"));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-card p-1">
      <Button variant="ghost" size="icon-sm" onClick={() => goTo(-1)} aria-label="Previous month">
        <ChevronLeft className="size-4" aria-hidden="true" />
      </Button>

      <span className="min-w-[7.5rem] text-center text-sm font-medium text-foreground">
        {format(current, "MMMM yyyy")}
      </span>

      <Button variant="ghost" size="icon-sm" onClick={() => goTo(1)} aria-label="Next month">
        <ChevronRight className="size-4" aria-hidden="true" />
      </Button>
    </div>
  );
}
