"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Option = { id: string; name: string };

type TransactionFiltersProps = {
  accounts: Option[];
  categories: Option[];
};

const SORT_OPTIONS = [
  { value: "date-desc", label: "Newest first" },
  { value: "date-asc", label: "Oldest first" },
  { value: "amount-desc", label: "Largest amount" },
  { value: "amount-asc", label: "Smallest amount" },
];

/**
 * Filters live in the URL, so a filtered view is shareable, survives a
 * refresh, and lets the server do the querying rather than shipping every
 * transaction to the browser.
 */
export function TransactionFilters({ accounts, categories }: TransactionFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  const type = searchParams.get("type") ?? "all";
  const accountId = searchParams.get("accountId") ?? "all";
  const categoryId = searchParams.get("categoryId") ?? "all";
  const sort = searchParams.get("sort") ?? "date-desc";
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";

  const activeCount = [
    type !== "all",
    accountId !== "all",
    categoryId !== "all",
    Boolean(from),
    Boolean(to),
  ].filter(Boolean).length;

  function apply(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(updates)) {
      if (!value || value === "all") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }

    // Any filter change resets to the first page.
    params.delete("page");

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }

  // Debounce the search box so typing does not fire a query per keystroke.
  useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (query === current) return;

    const timer = setTimeout(() => apply({ q: query || null }), 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function clearAll() {
    setQuery("");
    startTransition(() => router.replace(pathname, { scroll: false }));
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", isPending && "opacity-70")}>
      <div className="relative min-w-0 flex-1 sm:max-w-xs">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search transactions"
          className="pl-9"
          aria-label="Search transactions"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-1 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <Select value={type} onValueChange={(value) => apply({ type: value })}>
        <SelectTrigger className="w-[7.5rem]" aria-label="Filter by type">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          <SelectItem value="INCOME">Income</SelectItem>
          <SelectItem value="EXPENSE">Expense</SelectItem>
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="gap-2">
            <SlidersHorizontal className="size-4" aria-hidden="true" />
            Filters
            {activeCount > 0 ? (
              <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary text-[0.65rem] font-semibold text-primary-foreground">
                {activeCount}
              </span>
            ) : null}
          </Button>
        </PopoverTrigger>

        <PopoverContent align="end" className="w-[19rem] space-y-4 p-4">
          <div className="space-y-2">
            <Label className="text-xs">Account</Label>
            <Select value={accountId} onValueChange={(value) => apply({ accountId: value })}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All accounts</SelectItem>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Category</Label>
            <Select value={categoryId} onValueChange={(value) => apply({ categoryId: value })}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="filter-from" className="text-xs">
                From
              </Label>
              <Input
                id="filter-from"
                type="date"
                value={from}
                onChange={(event) => apply({ from: event.target.value || null })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="filter-to" className="text-xs">
                To
              </Label>
              <Input
                id="filter-to"
                type="date"
                value={to}
                onChange={(event) => apply({ to: event.target.value || null })}
              />
            </div>
          </div>

          <Button variant="ghost" size="sm" onClick={clearAll} className="w-full">
            Clear all filters
          </Button>
        </PopoverContent>
      </Popover>

      <Select value={sort} onValueChange={(value) => apply({ sort: value })}>
        <SelectTrigger className="w-[9.5rem]" aria-label="Sort transactions">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
