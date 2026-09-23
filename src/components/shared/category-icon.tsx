import {
  Baby,
  Banknote,
  Book,
  Briefcase,
  Bus,
  Car,
  Circle,
  CirclePlus,
  Clapperboard,
  Coffee,
  CreditCard,
  Dumbbell,
  Film,
  Fuel,
  Gift,
  GraduationCap,
  Hammer,
  HeartPulse,
  Home,
  Hotel,
  Landmark,
  Laptop,
  LineChart,
  Music,
  PawPrint,
  Phone,
  PiggyBank,
  Plane,
  Repeat,
  Scissors,
  Shirt,
  ShoppingBag,
  Smartphone,
  Stethoscope,
  Train,
  TrendingUp,
  UtensilsCrossed,
  Wallet,
  Wifi,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { AccountType } from "@/types";

/**
 * Icons are stored as names in the database and resolved here, so we only
 * ship the icons we actually use rather than the whole Lucide set.
 */
export const ICON_REGISTRY: Record<string, LucideIcon> = {
  Baby,
  Banknote,
  Book,
  Briefcase,
  Bus,
  Car,
  Circle,
  CirclePlus,
  Clapperboard,
  Coffee,
  CreditCard,
  Dumbbell,
  Film,
  Fuel,
  Gift,
  GraduationCap,
  Hammer,
  HeartPulse,
  Home,
  Hotel,
  Landmark,
  Laptop,
  LineChart,
  Music,
  PawPrint,
  Phone,
  PiggyBank,
  Plane,
  Repeat,
  Scissors,
  Shirt,
  ShoppingBag,
  Smartphone,
  Stethoscope,
  Train,
  TrendingUp,
  UtensilsCrossed,
  Wallet,
  Wifi,
  Wrench,
  Zap,
};

export const ICON_NAMES = Object.keys(ICON_REGISTRY);

export function resolveIcon(name: string | null | undefined): LucideIcon {
  return (name && ICON_REGISTRY[name]) || Circle;
}

export const ACCOUNT_TYPE_ICONS: Record<AccountType, LucideIcon> = {
  CASH: Banknote,
  BANK: Landmark,
  SAVINGS: PiggyBank,
  INVESTMENT: LineChart,
  WALLET: Smartphone,
  CREDIT: CreditCard,
};

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  CASH: "Cash",
  BANK: "Bank account",
  SAVINGS: "Savings account",
  INVESTMENT: "Investment account",
  WALLET: "Digital wallet",
  CREDIT: "Credit account",
};

type CategoryIconProps = {
  icon: string;
  color?: string | null;
  className?: string;
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "size-8 rounded-[0.55rem] [&>svg]:size-4",
  md: "size-10 rounded-xl [&>svg]:size-[1.15rem]",
  lg: "size-12 rounded-xl [&>svg]:size-5",
} as const;

/** A tinted rounded tile carrying the category's icon. */
export function CategoryIcon({ icon, color, className, size = "md" }: CategoryIconProps) {
  const Icon = resolveIcon(icon);
  const tint = color ?? "#64748b";

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center border",
        sizeClasses[size],
        className,
      )}
      style={{
        color: tint,
        backgroundColor: `color-mix(in oklab, ${tint} 11%, transparent)`,
        borderColor: `color-mix(in oklab, ${tint} 22%, transparent)`,
      }}
      aria-hidden="true"
    >
      {/* Resolved from the fixed ICON_REGISTRY above, never constructed during
          render, so this is a stable component reference. */}
      {/* eslint-disable-next-line react-hooks/static-components */}
      <Icon strokeWidth={1.9} />
    </span>
  );
}

type AccountIconProps = {
  type: AccountType;
  className?: string;
  size?: "sm" | "md" | "lg";
};

export function AccountIcon({ type, className, size = "md" }: AccountIconProps) {
  const Icon = ACCOUNT_TYPE_ICONS[type] ?? Landmark;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center border border-border bg-muted text-muted-foreground",
        sizeClasses[size],
        className,
      )}
      aria-hidden="true"
    >
      <Icon strokeWidth={1.9} />
    </span>
  );
}
