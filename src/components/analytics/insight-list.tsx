import { Info, Lightbulb, TrendingDown, TrendingUp, TriangleAlert } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";
import type { Insight } from "@/types";

const TONE: Record<Insight["tone"], { icon: LucideIcon; wrapper: string; iconClass: string }> = {
  positive: {
    icon: TrendingUp,
    wrapper: "border-positive/25 bg-positive-muted/45",
    iconClass: "text-positive",
  },
  negative: {
    icon: TrendingDown,
    wrapper: "border-negative/25 bg-negative-muted/45",
    iconClass: "text-negative",
  },
  warning: {
    icon: TriangleAlert,
    wrapper: "border-warning/25 bg-warning-muted/45",
    iconClass: "text-warning",
  },
  neutral: {
    icon: Info,
    wrapper: "border-border bg-muted/45",
    iconClass: "text-muted-foreground",
  },
};

/**
 * Observations derived entirely from the user's own aggregates. If there is
 * not enough data to say something factual, nothing is shown — we never guess.
 */
export function InsightList({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) {
    return (
      <EmptyState
        icon={Lightbulb}
        title="Not enough data yet"
        description="Once there are transactions in two comparable periods, insights about your spending will appear here."
        compact
        className="border-0 bg-transparent"
      />
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {insights.map((insight) => {
        const tone = TONE[insight.tone];
        const Icon = tone.icon;

        return (
          <li
            key={insight.id}
            className={cn("flex gap-3 rounded-xl border p-4", tone.wrapper)}
          >
            <Icon
              className={cn("mt-0.5 size-[1.05rem] shrink-0", tone.iconClass)}
              strokeWidth={2}
              aria-hidden="true"
            />
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium text-foreground">{insight.title}</p>
              <p className="text-xs leading-relaxed text-muted-foreground">{insight.detail}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
