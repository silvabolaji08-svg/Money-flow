import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

import { PrismaClient, Prisma } from "../src/generated/prisma/client";

/**
 * Development seed data.
 *
 * Creates one demo user with five accounts, roughly nine months of realistic
 * Nigerian-scale transactions, budgets for the last three months, and four
 * savings goals — enough that every chart, insight and budget bar on the
 * dashboard has something meaningful to show.
 *
 * Re-running the seed wipes and recreates the demo user only. Other users are
 * left untouched.
 */

const DEMO_EMAIL = "demo@moneyflow.app";
const DEMO_PASSWORD = "DemoPass123";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env first.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

/** Small deterministic PRNG so every seed run produces the same dataset. */
function createRandom(seed: number) {
  let state = seed;

  return {
    next(): number {
      state = (state * 1664525 + 1013904223) % 4294967296;
      return state / 4294967296;
    },
    between(min: number, max: number): number {
      return min + this.next() * (max - min);
    },
    int(min: number, max: number): number {
      return Math.floor(this.between(min, max + 1));
    },
    pick<T>(items: readonly T[]): T {
      return items[Math.floor(this.next() * items.length)];
    },
    chance(probability: number): boolean {
      return this.next() < probability;
    },
  };
}

const random = createRandom(20260922);

const money = (value: number) =>
  new Prisma.Decimal(value.toFixed(2));

const INCOME_CATEGORIES = [
  { name: "Salary", icon: "Wallet", color: "#0f9d76" },
  { name: "Freelance", icon: "Laptop", color: "#2563eb" },
  { name: "Business", icon: "Briefcase", color: "#7c3aed" },
  { name: "Investments", icon: "TrendingUp", color: "#0891b2" },
  { name: "Other", icon: "CirclePlus", color: "#64748b" },
];

const EXPENSE_CATEGORIES = [
  { name: "Food", icon: "UtensilsCrossed", color: "#f97316" },
  { name: "Transport", icon: "Car", color: "#0ea5e9" },
  { name: "Housing", icon: "Home", color: "#8b5cf6" },
  { name: "Utilities", icon: "Zap", color: "#eab308" },
  { name: "Shopping", icon: "ShoppingBag", color: "#ec4899" },
  { name: "Entertainment", icon: "Clapperboard", color: "#f43f5e" },
  { name: "Healthcare", icon: "HeartPulse", color: "#14b8a6" },
  { name: "Education", icon: "GraduationCap", color: "#6366f1" },
  { name: "Subscriptions", icon: "Repeat", color: "#a855f7" },
  { name: "Other", icon: "Circle", color: "#64748b" },
];

const ACCOUNTS = [
  {
    name: "GTBank Current",
    type: "BANK" as const,
    openingBalance: 420_000,
    description: "Salary lands here. Day-to-day spending account.",
  },
  {
    name: "Kuda Savings",
    type: "SAVINGS" as const,
    openingBalance: 950_000,
    description: "Set aside for goals and emergencies.",
  },
  {
    name: "OPay Wallet",
    type: "WALLET" as const,
    openingBalance: 65_000,
    description: "Transport, small transfers and airtime.",
  },
  {
    name: "Cash",
    type: "CASH" as const,
    openingBalance: 40_000,
    description: "Physical cash on hand.",
  },
  {
    name: "Bamboo Investments",
    type: "INVESTMENT" as const,
    openingBalance: 780_000,
    description: "Long-term equities portfolio.",
  },
];

/** Expense templates: category, description pool, amount range, frequency per month. */
const EXPENSE_PATTERNS = [
  {
    category: "Housing",
    account: "GTBank Current",
    descriptions: ["Monthly rent contribution", "Service charge", "Estate levy"],
    min: 180_000,
    max: 220_000,
    perMonth: 1,
  },
  {
    category: "Food",
    account: "GTBank Current",
    descriptions: [
      "Market shopping",
      "Groceries at Shoprite",
      "Weekly food stock",
      "Lunch with the team",
      "Dinner out",
      "Bakery run",
    ],
    min: 6_500,
    max: 42_000,
    perMonth: 9,
  },
  {
    category: "Transport",
    account: "OPay Wallet",
    descriptions: ["Bolt ride", "Fuel top-up", "Bus fare", "Airport transfer", "Uber to work"],
    min: 1_800,
    max: 18_000,
    perMonth: 8,
  },
  {
    category: "Utilities",
    account: "GTBank Current",
    descriptions: ["Electricity units", "Water bill", "Internet subscription", "Airtime and data"],
    min: 8_000,
    max: 46_000,
    perMonth: 3,
  },
  {
    category: "Shopping",
    account: "GTBank Current",
    descriptions: ["New shoes", "Work shirts", "Household items", "Phone accessories", "Gift"],
    min: 12_000,
    max: 95_000,
    perMonth: 2,
  },
  {
    category: "Entertainment",
    account: "Cash",
    descriptions: ["Cinema tickets", "Concert", "Weekend outing", "Games night"],
    min: 5_000,
    max: 38_000,
    perMonth: 2,
  },
  {
    category: "Subscriptions",
    account: "GTBank Current",
    descriptions: ["Netflix", "Spotify", "iCloud storage", "Gym membership"],
    min: 2_900,
    max: 22_000,
    perMonth: 3,
  },
  {
    category: "Healthcare",
    account: "GTBank Current",
    descriptions: ["Pharmacy", "Dental check-up", "Health insurance"],
    min: 7_000,
    max: 65_000,
    perMonth: 1,
  },
  {
    category: "Education",
    account: "GTBank Current",
    descriptions: ["Online course", "Textbooks", "Certification fee"],
    min: 15_000,
    max: 85_000,
    perMonth: 1,
  },
];

const BUDGET_PLAN = [
  { category: "Food", amount: 260_000 },
  { category: "Transport", amount: 90_000 },
  { category: "Housing", amount: 220_000 },
  { category: "Utilities", amount: 85_000 },
  { category: "Shopping", amount: 120_000 },
  { category: "Entertainment", amount: 60_000 },
];

const GOALS = [
  {
    name: "Emergency Fund",
    targetAmount: 3_000_000,
    currentAmount: 1_850_000,
    monthsAhead: 8,
    description: "Six months of essential expenses, kept liquid.",
    color: "#0f9d76",
  },
  {
    name: "New Laptop",
    targetAmount: 1_400_000,
    currentAmount: 980_000,
    monthsAhead: 3,
    description: "A 16-inch machine for design and development work.",
    color: "#6366f1",
  },
  {
    name: "Vacation",
    targetAmount: 1_800_000,
    currentAmount: 420_000,
    monthsAhead: 11,
    description: "Two weeks away at the end of the year.",
    color: "#f59e0b",
  },
  {
    name: "Professional Course",
    targetAmount: 650_000,
    currentAmount: 650_000,
    monthsAhead: 1,
    description: "Fully funded — enrolment opens next intake.",
    color: "#ec4899",
  },
];

const MONTHS_OF_HISTORY = 9;

// Dates are calendar dates, stored at UTC midnight — the same rule the app
// itself follows, so seeded months line up exactly with the charts.
function startOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function addMonths(date: Date, count: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + count, 1));
}

function dayIn(month: Date, day: number): Date {
  const lastDay = new Date(
    Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0),
  ).getUTCDate();

  return new Date(
    Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), Math.min(day, lastDay)),
  );
}

async function main() {
  console.log("Seeding MoneyFlow demo data…");

  // Start clean for the demo user. Cascades remove their owned rows.
  await prisma.user.deleteMany({ where: { email: DEMO_EMAIL } });

  const user = await prisma.user.create({
    data: {
      name: "Ada Okafor",
      email: DEMO_EMAIL,
      passwordHash: await bcrypt.hash(DEMO_PASSWORD, 12),
      currency: "NGN",
      theme: "system",
    },
  });

  await prisma.category.createMany({
    data: [
      ...INCOME_CATEGORIES.map((category) => ({
        ...category,
        kind: "INCOME" as const,
        userId: user.id,
        isDefault: true,
      })),
      ...EXPENSE_CATEGORIES.map((category) => ({
        ...category,
        kind: "EXPENSE" as const,
        userId: user.id,
        isDefault: true,
      })),
    ],
  });

  const categories = await prisma.category.findMany({ where: { userId: user.id } });
  const categoryId = (name: string, kind: "INCOME" | "EXPENSE") => {
    const match = categories.find((item) => item.name === name && item.kind === kind);
    if (!match) throw new Error(`Missing category: ${name} (${kind})`);
    return match.id;
  };

  await prisma.account.createMany({
    data: ACCOUNTS.map((account) => ({
      ...account,
      userId: user.id,
      currency: "NGN" as const,
      openingBalance: money(account.openingBalance),
    })),
  });

  const accounts = await prisma.account.findMany({ where: { userId: user.id } });
  const accountId = (name: string) => {
    const match = accounts.find((item) => item.name === name);
    if (!match) throw new Error(`Missing account: ${name}`);
    return match.id;
  };

  const now = new Date();
  const firstMonth = addMonths(startOfMonth(now), -(MONTHS_OF_HISTORY - 1));

  type TransactionSeed = {
    userId: string;
    accountId: string;
    categoryId: string;
    type: "INCOME" | "EXPENSE";
    amount: Prisma.Decimal;
    description: string;
    notes?: string | null;
    date: Date;
  };

  const transactions: TransactionSeed[] = [];

  for (let index = 0; index < MONTHS_OF_HISTORY; index += 1) {
    const month = addMonths(firstMonth, index);
    const isCurrentMonth = index === MONTHS_OF_HISTORY - 1;
    // Only seed up to today in the current month, so "this month" looks live.
    const dayLimit = isCurrentMonth ? now.getUTCDate() : 31;

    // Salary — a steady monthly income with a raise part-way through.
    const salary = index >= 5 ? random.between(880_000, 920_000) : random.between(760_000, 790_000);

    if (dayLimit >= 26) {
      transactions.push({
        userId: user.id,
        accountId: accountId("GTBank Current"),
        categoryId: categoryId("Salary", "INCOME"),
        type: "INCOME",
        amount: money(salary),
        description: "Monthly salary",
        notes: index >= 5 ? "Includes annual review increase" : null,
        date: dayIn(month, 26),
      });
    }

    // Freelance work lands most months.
    if (random.chance(0.7)) {
      const day = random.int(4, 22);
      if (day <= dayLimit) {
        transactions.push({
          userId: user.id,
          accountId: accountId("GTBank Current"),
          categoryId: categoryId("Freelance", "INCOME"),
          type: "INCOME",
          amount: money(random.between(120_000, 460_000)),
          description: random.pick([
            "Website redesign project",
            "Brand identity commission",
            "Consulting retainer",
            "Mobile app contract",
          ]),
          date: dayIn(month, day),
        });
      }
    }

    // Quarterly investment dividend.
    if (index % 3 === 2 && dayLimit >= 15) {
      transactions.push({
        userId: user.id,
        accountId: accountId("Bamboo Investments"),
        categoryId: categoryId("Investments", "INCOME"),
        type: "INCOME",
        amount: money(random.between(48_000, 135_000)),
        description: "Dividend payout",
        date: dayIn(month, 15),
      });
    }

    // Recurring expense patterns.
    for (const pattern of EXPENSE_PATTERNS) {
      const occurrences =
        pattern.perMonth === 1 ? 1 : random.int(Math.max(1, pattern.perMonth - 2), pattern.perMonth + 1);

      for (let occurrence = 0; occurrence < occurrences; occurrence += 1) {
        const day = pattern.perMonth === 1 ? random.int(2, 6) : random.int(1, 28);
        if (day > dayLimit) continue;

        transactions.push({
          userId: user.id,
          accountId: accountId(pattern.account),
          categoryId: categoryId(pattern.category, "EXPENSE"),
          type: "EXPENSE",
          amount: money(random.between(pattern.min, pattern.max)),
          description: random.pick(pattern.descriptions),
          date: dayIn(month, day),
        });
      }
    }

    // A monthly transfer into savings, recorded as an expense out of current.
    if (dayLimit >= 27) {
      transactions.push({
        userId: user.id,
        accountId: accountId("GTBank Current"),
        categoryId: categoryId("Other", "EXPENSE"),
        type: "EXPENSE",
        amount: money(random.between(140_000, 210_000)),
        description: "Transfer to savings",
        notes: "Monthly savings contribution",
        date: dayIn(month, 27),
      });

      transactions.push({
        userId: user.id,
        accountId: accountId("Kuda Savings"),
        categoryId: categoryId("Other", "INCOME"),
        type: "INCOME",
        amount: money(random.between(140_000, 210_000)),
        description: "Savings transfer received",
        date: dayIn(month, 27),
      });
    }
  }

  await prisma.transaction.createMany({ data: transactions });

  // Budgets for the last three months, including the current one.
  const budgets = [];
  for (let offset = 2; offset >= 0; offset -= 1) {
    const month = addMonths(startOfMonth(now), -offset);
    const monthUtc = new Date(Date.UTC(month.getFullYear(), month.getMonth(), 1));

    for (const plan of BUDGET_PLAN) {
      budgets.push({
        userId: user.id,
        categoryId: categoryId(plan.category, "EXPENSE"),
        amount: money(plan.amount),
        month: monthUtc,
        note: offset === 0 ? null : "Carried over from the previous month",
      });
    }
  }

  await prisma.budget.createMany({ data: budgets });

  for (const goal of GOALS) {
    const targetDate = addMonths(startOfMonth(now), goal.monthsAhead);

    const created = await prisma.savingsGoal.create({
      data: {
        userId: user.id,
        name: goal.name,
        targetAmount: money(goal.targetAmount),
        currentAmount: money(goal.currentAmount),
        targetDate: new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), 15)),
        description: goal.description,
        color: goal.color,
        completedAt: goal.currentAmount >= goal.targetAmount ? new Date() : null,
      },
    });

    // Split the current balance into a few dated contributions.
    const parts = 4;
    let remaining = goal.currentAmount;

    for (let index = 0; index < parts; index += 1) {
      const isLast = index === parts - 1;
      const amount = isLast ? remaining : Math.round((goal.currentAmount / parts) * random.between(0.8, 1.2));
      remaining -= amount;

      if (amount <= 0) continue;

      await prisma.goalContribution.create({
        data: {
          goalId: created.id,
          amount: money(amount),
          note: index === 0 ? "Starting balance" : "Monthly contribution",
          occurredAt: dayIn(addMonths(startOfMonth(now), -(parts - index)), 27),
        },
      });
    }
  }

  const counts = {
    accounts: await prisma.account.count({ where: { userId: user.id } }),
    categories: await prisma.category.count({ where: { userId: user.id } }),
    transactions: await prisma.transaction.count({ where: { userId: user.id } }),
    budgets: await prisma.budget.count({ where: { userId: user.id } }),
    goals: await prisma.savingsGoal.count({ where: { userId: user.id } }),
  };

  console.log("Seed complete.");
  console.table(counts);
  console.log(`\nDemo login:  ${DEMO_EMAIL}  /  ${DEMO_PASSWORD}\n`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
