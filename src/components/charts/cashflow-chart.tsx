"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { formatCompactCurrency, formatCurrency, type CurrencyCode } from "@/lib/currency";
import type { SeriesPoint } from "@/types";

type CashFlowChartProps = {
  data: SeriesPoint[];
  currency: CurrencyCode;
  height?: number;
};

/** Net cash flow per month. Bars below the zero line are deficit months. */
export function CashFlowChart({ data, currency, height = 240 }: CashFlowChartProps) {
  const reducedMotion = useReducedMotion();

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
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

          <ReferenceLine y={0} stroke="var(--border)" />

          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.45 }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0].payload as SeriesPoint;

              return (
                <div className="min-w-[11rem] rounded-xl border border-border bg-popover p-3 shadow-[var(--shadow-lifted)]">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">{label}</p>
                  <div className="space-y-1 text-sm">
                    <Row label="Income" value={formatCurrency(point.income, currency)} />
                    <Row label="Expenses" value={formatCurrency(point.expenses, currency)} />
                    <div className="mt-1.5 flex items-center justify-between gap-4 border-t border-border pt-1.5">
                      <span className="text-muted-foreground">Net</span>
                      <span
                        className={
                          point.net >= 0
                            ? "font-medium tnum text-positive"
                            : "font-medium tnum text-negative"
                        }
                      >
                        {formatCurrency(point.net, currency, { signed: true })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            }}
          />

          <Bar
            dataKey="net"
            radius={[6, 6, 6, 6]}
            isAnimationActive={!reducedMotion}
            animationDuration={650}
            maxBarSize={44}
          >
            {data.map((point) => (
              <Cell
                key={point.label}
                fill={point.net >= 0 ? "var(--positive)" : "var(--negative)"}
                fillOpacity={point.net >= 0 ? 0.85 : 0.75}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tnum text-foreground">{value}</span>
    </div>
  );
}
