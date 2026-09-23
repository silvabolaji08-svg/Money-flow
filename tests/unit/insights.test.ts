import { describe, expect, it } from "vitest";

import { buildInsights, type InsightInput } from "@/server/insights";

function makeInput(overrides: Partial<InsightInput> = {}): InsightInput {
  return {
    current: { income: "1000000", expenses: "600000", net: "400000", count: 40 },
    previous: { income: "1000000", expenses: "600000", net: "400000", count: 40 },
    spendingByCategory: [],
    previousSpendByCategory: new Map(),
    budgets: [],
    goals: [],
    periodLabel: "This month",
    ...overrides,
  };
}

describe("buildInsights", () => {
  it("names the largest spending category with its real share", () => {
    const insights = buildInsights(
      makeInput({
        spendingByCategory: [
          { id: "food", name: "Food", color: "#f97316", icon: "Circle", amount: 240000, share: 24 },
          { id: "rent", name: "Housing", color: "#8b5cf6", icon: "Circle", amount: 200000, share: 20 },
        ],
      }),
    );

    const largest = insights.find((insight) => insight.id === "largest-category");
    expect(largest?.title).toBe("Food is your biggest expense");
    expect(largest?.detail).toContain("24%");
  });

  it("reports a genuine drop in a category against the previous period", () => {
    const insights = buildInsights(
      makeInput({
        spendingByCategory: [
          {
            id: "transport",
            name: "Transport",
            color: "#0ea5e9",
            icon: "Circle",
            amount: 82000,
            share: 18,
          },
        ],
        previousSpendByCategory: new Map([["transport", "100000"]]),
      }),
    );

    const movement = insights.find((insight) => insight.id === "category-movement");
    expect(movement?.title).toBe("Transport spending fell 18%");
    expect(movement?.tone).toBe("positive");
  });

  it("stays silent about a category with no prior period to compare against", () => {
    const insights = buildInsights(
      makeInput({
        spendingByCategory: [
          { id: "new", name: "Education", color: "#6366f1", icon: "Circle", amount: 50000, share: 10 },
        ],
        previousSpendByCategory: new Map(),
      }),
    );

    expect(insights.find((insight) => insight.id === "category-movement")).toBeUndefined();
  });

  it("flags a month where spending exceeded income", () => {
    const insights = buildInsights(
      makeInput({
        current: { income: "500000", expenses: "620000", net: "-120000", count: 30 },
      }),
    );

    const negative = insights.find((insight) => insight.id === "negative-cashflow");
    expect(negative?.tone).toBe("negative");
  });

  it("reports improved savings against the previous period", () => {
    const insights = buildInsights(
      makeInput({
        current: { income: "1000000", expenses: "500000", net: "500000", count: 40 },
        previous: { income: "1000000", expenses: "700000", net: "300000", count: 40 },
      }),
    );

    const trend = insights.find((insight) => insight.id === "cashflow-trend");
    expect(trend?.title).toContain("increased");
    expect(trend?.tone).toBe("positive");
  });

  it("calls out budgets that went over their limit", () => {
    const insights = buildInsights(
      makeInput({
        budgets: [
          { categoryName: "Food", percentUsed: 128, status: "exceeded" },
          { categoryName: "Transport", percentUsed: 65, status: "on-track" },
        ],
      }),
    );

    const exceeded = insights.find((insight) => insight.id === "budgets-exceeded");
    expect(exceeded?.title).toBe("Food is over budget");
    expect(exceeded?.detail).toContain("128%");
  });

  it("celebrates a fully funded goal", () => {
    const insights = buildInsights(
      makeInput({
        goals: [{ name: "New Laptop", percentComplete: 100, completed: true }],
      }),
    );

    expect(insights.find((insight) => insight.id === "goal-complete")?.tone).toBe("positive");
  });

  it("produces nothing when there is no data to describe", () => {
    const insights = buildInsights(
      makeInput({
        current: { income: "0", expenses: "0", net: "0", count: 0 },
        previous: { income: "0", expenses: "0", net: "0", count: 0 },
      }),
    );

    expect(insights).toHaveLength(0);
  });

  it("never returns more than six observations", () => {
    const insights = buildInsights(
      makeInput({
        current: { income: "1000000", expenses: "1500000", net: "-500000", count: 90 },
        previous: { income: "900000", expenses: "600000", net: "300000", count: 20 },
        spendingByCategory: [
          { id: "food", name: "Food", color: "#f97316", icon: "Circle", amount: 900000, share: 60 },
          { id: "shop", name: "Shopping", color: "#ec4899", icon: "Circle", amount: 600000, share: 40 },
        ],
        previousSpendByCategory: new Map([
          ["food", "300000"],
          ["shop", "200000"],
        ]),
        budgets: [
          { categoryName: "Food", percentUsed: 180, status: "exceeded" },
          { categoryName: "Shopping", percentUsed: 150, status: "exceeded" },
        ],
        goals: [{ name: "Vacation", percentComplete: 100, completed: true }],
      }),
    );

    expect(insights.length).toBeLessThanOrEqual(6);
  });
});
