import "server-only";

import { prisma } from "@/lib/prisma";
import { dec, toMoneyString } from "@/server/money";
import type { AccountDTO, TransactionDTO } from "@/types";

import { serialiseTransaction } from "./transactions";

type AccountTotals = { income: ReturnType<typeof dec>; expenses: ReturnType<typeof dec>; count: number };

/**
 * Income/expense totals per account in a single grouped query, so listing N
 * accounts stays at two queries rather than N+1.
 */
async function totalsByAccount(userId: string): Promise<Map<string, AccountTotals>> {
  const grouped = await prisma.transaction.groupBy({
    by: ["accountId", "type"],
    where: { userId },
    _sum: { amount: true },
    _count: { _all: true },
  });

  const totals = new Map<string, AccountTotals>();

  for (const row of grouped) {
    const current =
      totals.get(row.accountId) ?? { income: dec(0), expenses: dec(0), count: 0 };

    if (row.type === "INCOME") {
      current.income = current.income.plus(dec(row._sum.amount));
    } else {
      current.expenses = current.expenses.plus(dec(row._sum.amount));
    }

    current.count += row._count._all;
    totals.set(row.accountId, current);
  }

  return totals;
}

export async function listAccounts(userId: string): Promise<AccountDTO[]> {
  const [accounts, totals] = await Promise.all([
    prisma.account.findMany({
      where: { userId },
      orderBy: [{ archived: "asc" }, { createdAt: "asc" }],
    }),
    totalsByAccount(userId),
  ]);

  return accounts.map((account) => {
    const totalsForAccount = totals.get(account.id) ?? {
      income: dec(0),
      expenses: dec(0),
      count: 0,
    };

    const balance = dec(account.openingBalance)
      .plus(totalsForAccount.income)
      .minus(totalsForAccount.expenses);

    return {
      id: account.id,
      name: account.name,
      type: account.type,
      currency: account.currency,
      openingBalance: toMoneyString(account.openingBalance),
      description: account.description,
      archived: account.archived,
      balance: toMoneyString(balance),
      income: toMoneyString(totalsForAccount.income),
      expenses: toMoneyString(totalsForAccount.expenses),
      transactionCount: totalsForAccount.count,
    } satisfies AccountDTO;
  });
}

/** Total across every active account. Archived accounts are excluded. */
export async function getTotalBalance(userId: string) {
  const [accounts, grouped] = await Promise.all([
    prisma.account.aggregate({
      where: { userId, archived: false },
      _sum: { openingBalance: true },
    }),
    prisma.transaction.groupBy({
      by: ["type"],
      where: { userId, account: { archived: false } },
      _sum: { amount: true },
    }),
  ]);

  let balance = dec(accounts._sum.openingBalance);

  for (const row of grouped) {
    balance =
      row.type === "INCOME"
        ? balance.plus(dec(row._sum.amount))
        : balance.minus(dec(row._sum.amount));
  }

  return balance;
}

export type AccountDetail = {
  account: AccountDTO;
  recentTransactions: TransactionDTO[];
  monthly: { income: string; expenses: string; net: string };
};

export async function getAccountDetail(
  userId: string,
  accountId: string,
  monthRange: { from: Date; to: Date },
): Promise<AccountDetail | null> {
  const account = await prisma.account.findFirst({
    where: { id: accountId, userId },
  });

  if (!account) return null;

  const [grouped, monthGrouped, recent] = await Promise.all([
    prisma.transaction.groupBy({
      by: ["type"],
      where: { userId, accountId },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.transaction.groupBy({
      by: ["type"],
      where: { userId, accountId, date: { gte: monthRange.from, lte: monthRange.to } },
      _sum: { amount: true },
    }),
    prisma.transaction.findMany({
      where: { userId, accountId },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 12,
      include: {
        account: { select: { id: true, name: true, type: true } },
        category: { select: { id: true, name: true, icon: true, color: true, kind: true } },
      },
    }),
  ]);

  const income = dec(grouped.find((row) => row.type === "INCOME")?._sum.amount);
  const expenses = dec(grouped.find((row) => row.type === "EXPENSE")?._sum.amount);
  const transactionCount = grouped.reduce((total, row) => total + row._count._all, 0);

  const monthIncome = dec(monthGrouped.find((row) => row.type === "INCOME")?._sum.amount);
  const monthExpenses = dec(monthGrouped.find((row) => row.type === "EXPENSE")?._sum.amount);

  return {
    account: {
      id: account.id,
      name: account.name,
      type: account.type,
      currency: account.currency,
      openingBalance: toMoneyString(account.openingBalance),
      description: account.description,
      archived: account.archived,
      balance: toMoneyString(dec(account.openingBalance).plus(income).minus(expenses)),
      income: toMoneyString(income),
      expenses: toMoneyString(expenses),
      transactionCount,
    },
    recentTransactions: recent.map(serialiseTransaction),
    monthly: {
      income: toMoneyString(monthIncome),
      expenses: toMoneyString(monthExpenses),
      net: toMoneyString(monthIncome.minus(monthExpenses)),
    },
  };
}

/** Lightweight list used to populate form selects. */
export async function listAccountOptions(userId: string) {
  return prisma.account.findMany({
    where: { userId, archived: false },
    select: { id: true, name: true, type: true },
    orderBy: { name: "asc" },
  });
}
