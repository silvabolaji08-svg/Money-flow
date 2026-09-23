import "server-only";

import { parseDateOnly, utcEndOfDay } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import type { TransactionFilters } from "@/lib/validations";
import { dec, toMoneyString } from "@/server/money";
import type { TransactionDTO, TransactionPage } from "@/types";
import type { Prisma } from "@/generated/prisma/client";

type TransactionRow = Prisma.TransactionModel & {
  account: { id: string; name: string; type: Prisma.AccountModel["type"] };
  category: {
    id: string;
    name: string;
    icon: string;
    color: string;
    kind: Prisma.CategoryModel["kind"];
  };
};

export function serialiseTransaction(row: TransactionRow): TransactionDTO {
  return {
    id: row.id,
    type: row.type,
    amount: toMoneyString(row.amount),
    description: row.description,
    notes: row.notes,
    date: row.date.toISOString(),
    account: row.account,
    category: row.category,
  };
}

const include = {
  account: { select: { id: true, name: true, type: true } },
  category: { select: { id: true, name: true, icon: true, color: true, kind: true } },
} as const;

/** Builds a WHERE clause that is always scoped to the owning user. */
function buildWhere(userId: string, filters: TransactionFilters): Prisma.TransactionWhereInput {
  const where: Prisma.TransactionWhereInput = { userId };

  if (filters.type !== "all") {
    where.type = filters.type;
  }

  if (filters.accountId && filters.accountId !== "all") {
    where.accountId = filters.accountId;
  }

  if (filters.categoryId && filters.categoryId !== "all") {
    where.categoryId = filters.categoryId;
  }

  const from = filters.from ? parseDateOnly(filters.from) : null;
  const to = filters.to ? parseDateOnly(filters.to) : null;

  if ((from && !Number.isNaN(from.valueOf())) || (to && !Number.isNaN(to.valueOf()))) {
    where.date = {};
    if (from && !Number.isNaN(from.valueOf())) {
      where.date.gte = from;
    }
    if (to && !Number.isNaN(to.valueOf())) {
      where.date.lte = utcEndOfDay(to);
    }
  }

  const query = filters.q?.trim();
  if (query) {
    where.OR = [
      { description: { contains: query, mode: "insensitive" } },
      { notes: { contains: query, mode: "insensitive" } },
      { category: { name: { contains: query, mode: "insensitive" } } },
      { account: { name: { contains: query, mode: "insensitive" } } },
    ];
  }

  return where;
}

function buildOrderBy(sort: TransactionFilters["sort"]): Prisma.TransactionOrderByWithRelationInput[] {
  switch (sort) {
    case "date-asc":
      return [{ date: "asc" }, { createdAt: "asc" }];
    case "amount-desc":
      return [{ amount: "desc" }, { date: "desc" }];
    case "amount-asc":
      return [{ amount: "asc" }, { date: "desc" }];
    case "date-desc":
    default:
      return [{ date: "desc" }, { createdAt: "desc" }];
  }
}

export async function listTransactions(
  userId: string,
  filters: TransactionFilters,
): Promise<TransactionPage> {
  const where = buildWhere(userId, filters);
  const skip = (filters.page - 1) * filters.perPage;

  const [rows, total, grouped] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include,
      orderBy: buildOrderBy(filters.sort),
      skip,
      take: filters.perPage,
    }),
    prisma.transaction.count({ where }),
    prisma.transaction.groupBy({
      by: ["type"],
      where,
      _sum: { amount: true },
    }),
  ]);

  const income = dec(grouped.find((row) => row.type === "INCOME")?._sum.amount);
  const expenses = dec(grouped.find((row) => row.type === "EXPENSE")?._sum.amount);

  return {
    rows: rows.map(serialiseTransaction),
    total,
    page: filters.page,
    perPage: filters.perPage,
    pageCount: Math.max(1, Math.ceil(total / filters.perPage)),
    totals: {
      income: toMoneyString(income),
      expenses: toMoneyString(expenses),
      net: toMoneyString(income.minus(expenses)),
    },
  };
}

export async function listRecentTransactions(userId: string, take = 6): Promise<TransactionDTO[]> {
  const rows = await prisma.transaction.findMany({
    where: { userId },
    include,
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take,
  });

  return rows.map(serialiseTransaction);
}

export async function getTransaction(userId: string, id: string): Promise<TransactionDTO | null> {
  const row = await prisma.transaction.findFirst({
    where: { id, userId },
    include,
  });

  return row ? serialiseTransaction(row) : null;
}
