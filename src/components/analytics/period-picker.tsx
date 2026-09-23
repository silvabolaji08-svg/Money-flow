"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PERIOD_PRESETS } from "@/lib/dates";
import { cn } from "@/lib/utils";

type PeriodPickerProps = {
  preset: string;
  from: string;
  to: string;
};

export function PeriodPicker({ preset, from, to }: PeriodPickerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function apply(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(updates)) {
      if (!value) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }

  return (
    <div className={cn("flex flex-wrap items-end gap-2", isPending && "opacity-70")}>
      <Select value={preset} onValueChange={(value) => apply({ period: value })}>
        <SelectTrigger className="w-[10.5rem]" aria-label="Select period">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PERIOD_PRESETS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {preset === "custom" ? (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="period-from" className="text-xs">
              From
            </Label>
            <Input
              id="period-from"
              type="date"
              value={from}
              onChange={(event) => apply({ from: event.target.value || null })}
              className="w-[9.5rem]"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="period-to" className="text-xs">
              To
            </Label>
            <Input
              id="period-to"
              type="date"
              value={to}
              onChange={(event) => apply({ to: event.target.value || null })}
              className="w-[9.5rem]"
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
