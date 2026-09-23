import "server-only";

import { prisma } from "@/lib/prisma";
import type { CategoryDTO } from "@/types";

export async function listCategories(userId: string): Promise<CategoryDTO[]> {
  const categories = await prisma.category.findMany({
    where: { userId },
    orderBy: [{ kind: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { transactions: true } },
    },
  });

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    kind: category.kind,
    icon: category.icon,
    color: category.color,
    isDefault: category.isDefault,
    transactionCount: category._count.transactions,
  }));
}

/** Lightweight list for form selects. */
export async function listCategoryOptions(userId: string) {
  return prisma.category.findMany({
    where: { userId },
    select: { id: true, name: true, kind: true, icon: true, color: true },
    orderBy: [{ kind: "asc" }, { name: "asc" }],
  });
}

export const DEFAULT_INCOME_CATEGORIES = [
  { name: "Salary", icon: "Wallet", color: "#0f9d76" },
  { name: "Freelance", icon: "Laptop", color: "#2563eb" },
  { name: "Business", icon: "Briefcase", color: "#7c3aed" },
  { name: "Investments", icon: "TrendingUp", color: "#0891b2" },
  { name: "Other", icon: "CirclePlus", color: "#64748b" },
] as const;

export const DEFAULT_EXPENSE_CATEGORIES = [
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
] as const;

/**
 * Seeds the default category set for a brand-new user.
 * Safe to call more than once — existing names are skipped.
 */
export async function createDefaultCategories(userId: string) {
  const data = [
    ...DEFAULT_INCOME_CATEGORIES.map((category) => ({
      ...category,
      kind: "INCOME" as const,
      userId,
      isDefault: true,
    })),
    ...DEFAULT_EXPENSE_CATEGORIES.map((category) => ({
      ...category,
      kind: "EXPENSE" as const,
      userId,
      isDefault: true,
    })),
  ];

  await prisma.category.createMany({ data, skipDuplicates: true });
}
