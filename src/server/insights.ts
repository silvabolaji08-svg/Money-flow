import { dec, percentChange, type DecimalInput } from "@/server/money";
import type { CategorySlice, Insight } from "@/types";

export type InsightInput = {
  current: { income: DecimalInput; expenses: DecimalInput; net: DecimalInput; count: number };
  previous: { income: DecimalInput; expenses: DecimalInput; net: DecimalInput; count: number };
  spendingByCategory: CategorySlice[];
  previousSpendByCategory: Map<string, DecimalInput>;
  budgets: { categoryName: string; percentUsed: number; status: string }[];
  goals: { name: string; percentComplete: number; completed: boolean }[];
  periodLabel: string;
};

/**
 * Turns real aggregates into plain-language observations.
 *
 * Every sentence is backed by a computed number — nothing is inferred,
 * predicted or invented. When there is not enough history to compare against,
 * the insight is simply not produced.
 */
export function buildInsights(input: InsightInput): Insight[] {
  const insights: Insight[] = [];
  const { current, previous, spendingByCategory, previousSpendByCategory } = input;

  // 1. Largest spending category and its share.
  const [largest] = spendingByCategory;
  if (largest && largest.share > 0) {
    insights.push({
      id: "largest-category",
      tone: largest.share >= 40 ? "warning" : "neutral",
      title: `${largest.name} is your biggest expense`,
      detail: `It accounts for ${largest.share}% of everything you spent ${input.periodLabel.toLowerCase()}.`,
    });
  }

  // 2. Category with the largest movement against the previous period.
  let biggestMove: { name: string; change: number } | null = null;

  for (const slice of spendingByCategory.slice(0, 8)) {
    const before = previousSpendByCategory.get(slice.id);
    if (before === undefined) continue;

    const change = percentChange(slice.amount, before);
    if (change === null || Math.abs(change) < 10) continue;

    if (!biggestMove || Math.abs(change) > Math.abs(biggestMove.change)) {
      biggestMove = { name: slice.name, change };
    }
  }

  if (biggestMove) {
    const spentLess = biggestMove.change < 0;
    insights.push({
      id: "category-movement",
      tone: spentLess ? "positive" : "warning",
      title: `${biggestMove.name} spending ${spentLess ? "fell" : "rose"} ${Math.abs(
        Math.round(biggestMove.change),
      )}%`,
      detail: `Compared with the previous period, you spent ${
        spentLess ? "less" : "more"
      } on ${biggestMove.name.toLowerCase()}.`,
    });
  }

  // 3. Net cash flow direction against the previous period.
  const netChange = percentChange(current.net, previous.net);
  const currentNet = dec(current.net);

  if (currentNet.isNegative()) {
    insights.push({
      id: "negative-cashflow",
      tone: "negative",
      title: "You spent more than you earned",
      detail: `Expenses exceeded income ${input.periodLabel.toLowerCase()}, leaving a negative cash flow.`,
    });
  } else if (netChange !== null && Math.abs(netChange) >= 5) {
    const improved = netChange > 0;
    insights.push({
      id: "cashflow-trend",
      tone: improved ? "positive" : "warning",
      title: `Savings ${improved ? "increased" : "decreased"} ${Math.abs(Math.round(netChange))}%`,
      detail: `Your net cash flow is ${improved ? "higher" : "lower"} than the previous period.`,
    });
  }

  // 4. Budgets that went over.
  const exceeded = input.budgets.filter((budget) => budget.status === "exceeded");
  if (exceeded.length > 0) {
    insights.push({
      id: "budgets-exceeded",
      tone: "negative",
      title:
        exceeded.length === 1
          ? `${exceeded[0].categoryName} is over budget`
          : `${exceeded.length} budgets are over their limit`,
      detail:
        exceeded.length === 1
          ? `You have used ${Math.round(exceeded[0].percentUsed)}% of the ${exceeded[0].categoryName} budget.`
          : `Review ${exceeded.map((budget) => budget.categoryName).slice(0, 3).join(", ")} to get back on track.`,
    });
  }

  // 5. Goal progress.
  const completed = input.goals.filter((goal) => goal.completed);
  const nearest = input.goals
    .filter((goal) => !goal.completed && goal.percentComplete > 0)
    .sort((a, b) => b.percentComplete - a.percentComplete)[0];

  if (completed.length > 0) {
    insights.push({
      id: "goal-complete",
      tone: "positive",
      title:
        completed.length === 1
          ? `${completed[0].name} is fully funded`
          : `${completed.length} savings goals are fully funded`,
      detail: "Money set aside for these goals has reached its target amount.",
    });
  } else if (nearest) {
    insights.push({
      id: "goal-progress",
      tone: "neutral",
      title: `${nearest.name} is ${Math.round(nearest.percentComplete)}% funded`,
      detail: "Adding to it regularly is the fastest way to close the gap.",
    });
  }

  // 6. Activity level, only when there is something to compare.
  if (previous.count > 0 && current.count > 0) {
    const change = percentChange(current.count, previous.count);
    if (change !== null && Math.abs(change) >= 25) {
      insights.push({
        id: "activity",
        tone: "neutral",
        title: `You recorded ${current.count} transactions`,
        detail: `That is ${Math.abs(Math.round(change))}% ${
          change > 0 ? "more" : "fewer"
        } than the previous period (${previous.count}).`,
      });
    }
  }

  return insights.slice(0, 6);
}
