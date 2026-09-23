import "server-only";

import { prisma } from "@/lib/prisma";
import { monthKey, monthLabel, monthsBetween, type DateRange } from "@/lib/dates";
import { dec, toMoneyString } from "@/server/money";
import type { CategorySlice, SeriesPoint } from "@/types";
import { Prisma } from "@/generated/prisma/client";

/** Income and expense totals for a window. */
export async function totalsForRange(userId: string, range: DateRange) {
  const grouped = await prisma.transaction.groupBy({
    by: ["type"],
    where: { userId, date: { gte: range.from, lte: range.to } },
    _sum: { amount: true },
    _count: { _all: true },
  });

  const income = dec(grouped.find((row) => row.type === "INCOME")?._sum.amount);
  const expenses = dec(grouped.find((row) => row.type === "EXPENSE")?._sum.amount);
  const count = grouped.reduce((total, row) => total + row._count._all, 0);

  return { income, expenses, net: income.minus(expenses), count };
}

type MonthlyRow = { month: string; type: string; total: Prisma.Decimal | string | number };

/**
 * Monthly income/expense totals, aggregated in Postgres rather than by pulling
 * every transaction into Node. Months with no activity are filled with zeros so
 * charts keep a continuous x-axis.
 */
export async function monthlySeries(userId: string, range: DateRange): Promise<SeriesPoint[]> {
  const rows = await prisma.$queryRaw<MonthlyRow[]>(Prisma.sql`
    SELECT to_char(date_trunc('month', "date"), 'YYYY-MM') AS month,
           "type"::text AS type,
           SUM("amount") AS total
      FROM "transactions"
     WHERE "userId" = ${userId}
       AND "date" >= ${range.from}
       AND "date" <= ${range.to}
     GROUP BY 1, 2
     ORDER BY 1 ASC
  `);

  const buckets = new Map<string, { income: Prisma.Decimal; expenses: Prisma.Decimal }>();

  for (const row of rows) {
    const key = row.month;
    const bucket = buckets.get(key) ?? { income: dec(0), expenses: dec(0) };

    if (row.type === "INCOME") {
      bucket.income = bucket.income.plus(dec(row.total as Prisma.Decimal));
    } else {
      bucket.expenses = bucket.expenses.plus(dec(row.total as Prisma.Decimal));
    }

    buckets.set(key, bucket);
  }

  return monthsBetween(range).map((month) => {
    const bucket = buckets.get(monthKey(month)) ?? { income: dec(0), expenses: dec(0) };

    return {
      label: monthLabel(month),
      income: bucket.income.toNumber(),
      expenses: bucket.expenses.toNumber(),
      net: bucket.income.minus(bucket.expenses).toNumber(),
    } satisfies SeriesPoint;
  });
}

/** Spend (or income) split by category, largest first. */
export async function categoryBreakdown(
  userId: string,
  range: DateRange,
  type: "INCOME" | "EXPENSE",
): Promise<CategorySlice[]> {
  const grouped = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: { userId, type, date: { gte: range.from, lte: range.to } },
    _sum: { amount: true },
    orderBy: { _sum: { amount: "desc" } },
  });

  if (grouped.length === 0) return [];

  const categories = await prisma.category.findMany({
    where: { userId, id: { in: grouped.map((row) => row.categoryId) } },
    select: { id: true, name: true, color: true, icon: true },
  });

  const lookup = new Map(categories.map((category) => [category.id, category]));
  const total = grouped.reduce((sum, row) => sum.plus(dec(row._sum.amount)), dec(0));

  return grouped
    .map((row) => {
      const category = lookup.get(row.categoryId);
      const amount = dec(row._sum.amount);

      return {
        id: row.categoryId,
        name: category?.name ?? "Uncategorised",
        color: category?.color ?? "#64748b",
        icon: category?.icon ?? "Circle",
        amount: amount.toNumber(),
        share: total.isZero() ? 0 : amount.dividedBy(total).times(100).toDecimalPlaces(1).toNumber(),
      } satisfies CategorySlice;
    })
    .filter((slice) => slice.amount > 0);
}

/** Per-category spend as Decimal, used by insight generation. */
export async function categorySpendMap(userId: string, range: DateRange) {
  const grouped = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: { userId, type: "EXPENSE", date: { gte: range.from, lte: range.to } },
    _sum: { amount: true },
  });

  return new Map(grouped.map((row) => [row.categoryId, dec(row._sum.amount)]));
}

export async function averageExpense(userId: string, range: DateRange) {
  const result = await prisma.transaction.aggregate({
    where: { userId, type: "EXPENSE", date: { gte: range.from, lte: range.to } },
    _avg: { amount: true },
  });

  return toMoneyString(result._avg.amount ?? 0);
}
