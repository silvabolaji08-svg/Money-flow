"use client";

import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { formatCurrency, type CurrencyCode } from "@/lib/currency";
import type { CategorySlice } from "@/types";

type CategoryDonutProps = {
  data: CategorySlice[];
  currency: CurrencyCode;
  height?: number;
  /** Centre caption, e.g. "Spent". */
  centerLabel?: string;
};

/**
 * Spending split by category. The centre shows the total, or the hovered
 * slice, so the chart answers "where did it go" without a legend lookup.
 */
export function CategoryDonut({
  data,
  currency,
  height = 260,
  centerLabel = "Total spent",
}: CategoryDonutProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const reducedMotion = useReducedMotion();

  const total = data.reduce((sum, slice) => sum + slice.amount, 0);
  const active = activeIndex === null ? null : data[activeIndex];

  return (
    <div className="relative w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="amount"
            nameKey="name"
            innerRadius="62%"
            outerRadius="92%"
            paddingAngle={data.length > 1 ? 2 : 0}
            stroke="var(--card)"
            strokeWidth={2}
            isAnimationActive={!reducedMotion}
            animationDuration={650}
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            {data.map((slice, index) => (
              <Cell
                key={slice.id}
                fill={slice.color}
                opacity={activeIndex === null || activeIndex === index ? 1 : 0.35}
                style={{ transition: "opacity 150ms ease-out", outline: "none" }}
              />
            ))}
          </Pie>

          <Tooltip
            content={({ active: isActive, payload }) => {
              if (!isActive || !payload?.length) return null;
              const slice = payload[0].payload as CategorySlice;

              return (
                <div className="rounded-xl border border-border bg-popover p-3 shadow-[var(--shadow-lifted)]">
                  <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: slice.color }}
                      aria-hidden="true"
                    />
                    {slice.name}
                  </p>
                  <p className="mt-1 text-sm tnum text-muted-foreground">
                    {formatCurrency(slice.amount, currency)} · {slice.share}%
                  </p>
                </div>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <p className="text-[0.7rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {active ? active.name : centerLabel}
        </p>
        <p className="mt-1 text-xl font-semibold tracking-[-0.02em] tnum text-foreground">
          {formatCurrency(active ? active.amount : total, currency, { compactDecimals: true })}
        </p>
        {active ? (
          <p className="mt-0.5 text-xs tnum text-muted-foreground">{active.share}% of spend</p>
        ) : null}
      </div>
    </div>
  );
}
