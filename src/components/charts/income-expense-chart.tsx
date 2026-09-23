"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartTooltip } from "@/components/charts/chart-tooltip";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { formatCompactCurrency, formatCurrency, type CurrencyCode } from "@/lib/currency";
import type { SeriesPoint } from "@/types";

type IncomeExpenseChartProps = {
  data: SeriesPoint[];
  currency: CurrencyCode;
  height?: number;
};

/**
 * Income against expenses over time. Two soft gradients rather than solid
 * fills, so overlapping months stay readable.
 */
export function IncomeExpenseChart({ data, currency, height = 288 }: IncomeExpenseChartProps) {
  // Recharts animates on mount and whenever the data changes — a new date
  // range redraws smoothly — but never loops once it has settled.
  const reducedMotion = useReducedMotion();

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="mf-income" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--positive)" stopOpacity={0.28} />
              <stop offset="100%" stopColor="var(--positive)" stopOpacity={0.01} />
            </linearGradient>
            <linearGradient id="mf-expense" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.22} />
              <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0.01} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="4 4"
            vertical={false}
            stroke="var(--border)"
            strokeOpacity={0.8}
          />

          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={12}
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
          />

          <YAxis
            tickLine={false}
            axisLine={false}
            width={62}
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            tickFormatter={(value: number) => formatCompactCurrency(value, currency)}
          />

          <Tooltip
            cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
            content={
              <ChartTooltip
                currency={currency}
                labels={{ income: "Income", expenses: "Expenses" }}
                footer={(payload) => {
                  const income = Number(
                    payload.find((entry) => entry.dataKey === "income")?.value ?? 0,
                  );
                  const expenses = Number(
                    payload.find((entry) => entry.dataKey === "expenses")?.value ?? 0,
                  );
                  return `Net ${formatCurrency(income - expenses, currency)}`;
                }}
              />
            }
          />

          <Area
            type="monotone"
            dataKey="income"
            stroke="var(--positive)"
            strokeWidth={2}
            fill="url(#mf-income)"
            activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
            isAnimationActive={!reducedMotion}
            animationDuration={650}
          />
          <Area
            type="monotone"
            dataKey="expenses"
            stroke="var(--chart-2)"
            strokeWidth={2}
            fill="url(#mf-expense)"
            activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
            isAnimationActive={!reducedMotion}
            animationDuration={650}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
