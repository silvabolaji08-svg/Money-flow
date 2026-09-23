import { describe, expect, it } from "vitest";

import {
  dec,
  money,
  percentChange,
  percentOf,
  savingsRate,
  sum,
  toMoneyString,
} from "@/server/money";
import { formatCurrency, formatCompactCurrency, parseAmountInput } from "@/lib/currency";

describe("decimal money arithmetic", () => {
  it("does not lose precision the way floats do", () => {
    // 0.1 + 0.2 === 0.30000000000000004 in float arithmetic.
    expect(sum(["0.1", "0.2"]).toString()).toBe("0.3");
    expect(dec("0.1").plus(dec("0.2")).equals(dec("0.3"))).toBe(true);
  });

  it("sums a long list of amounts exactly", () => {
    const amounts = Array.from({ length: 1000 }, () => "0.01");
    expect(toMoneyString(sum(amounts))).toBe("10.00");
  });

  it("rounds to 2 places, half up", () => {
    expect(money("10.005").toFixed(2)).toBe("10.01");
    expect(money("10.004").toFixed(2)).toBe("10.00");
    expect(money("-10.005").toFixed(2)).toBe("-10.01");
  });

  it("treats null, undefined and empty string as zero", () => {
    expect(toMoneyString(null)).toBe("0.00");
    expect(toMoneyString(undefined)).toBe("0.00");
    expect(toMoneyString("")).toBe("0.00");
  });

  it("handles negative balances", () => {
    expect(toMoneyString(dec("500").minus(dec("1200.50")))).toBe("-700.50");
  });
});

describe("percentChange", () => {
  it("computes growth and decline", () => {
    expect(percentChange("120", "100")).toBe(20);
    expect(percentChange("80", "100")).toBe(-20);
  });

  it("returns null when there is no previous value to compare against", () => {
    expect(percentChange("500", "0")).toBeNull();
    expect(percentChange("500", null)).toBeNull();
  });

  it("reports no change when both periods are zero", () => {
    expect(percentChange("0", "0")).toBe(0);
  });

  it("uses the magnitude of a negative baseline", () => {
    // Going from -100 to -50 is an improvement of 50%.
    expect(percentChange("-50", "-100")).toBe(50);
  });
});

describe("percentOf", () => {
  it("computes a share of a total", () => {
    expect(percentOf("25", "200")).toBe(12.5);
  });

  it("returns zero rather than dividing by zero", () => {
    expect(percentOf("25", "0")).toBe(0);
  });

  it("can exceed 100 when a budget is overspent", () => {
    expect(percentOf("150", "100")).toBe(150);
  });
});

describe("savingsRate", () => {
  it("is the share of income that was not spent", () => {
    expect(savingsRate("1000", "750")).toBe(25);
    expect(savingsRate("1000", "0")).toBe(100);
  });

  it("goes negative when spending exceeds income", () => {
    expect(savingsRate("1000", "1500")).toBe(-50);
  });

  it("returns zero when there is no income", () => {
    expect(savingsRate("0", "500")).toBe(0);
    expect(savingsRate(null, "500")).toBe(0);
  });
});

describe("currency formatting", () => {
  it("formats naira with two decimals and grouping", () => {
    const formatted = formatCurrency("2450000", "NGN");
    expect(formatted).toContain("2,450,000.00");
    expect(formatted).toContain("₦");
  });

  it("marks negative amounts with a leading minus", () => {
    expect(formatCurrency("-1500", "NGN").startsWith("-")).toBe(true);
  });

  it("renders an explicit sign when asked", () => {
    expect(formatCurrency("1500", "USD", { signed: true }).startsWith("+")).toBe(true);
    expect(formatCurrency("0", "USD", { signed: true }).startsWith("+")).toBe(false);
  });

  it("compacts large values for chart axes", () => {
    expect(formatCompactCurrency(2_450_000, "NGN")).toBe("₦2.5M");
    expect(formatCompactCurrency(850_000, "NGN")).toBe("₦850K");
    expect(formatCompactCurrency(-4_200, "NGN")).toBe("-₦4.2K");
  });

  it("parses messy keyboard input into a decimal string", () => {
    expect(parseAmountInput("₦1,250.50")).toBe("1250.50");
    expect(parseAmountInput("abc")).toBeNull();
    expect(parseAmountInput("")).toBeNull();
  });
});
