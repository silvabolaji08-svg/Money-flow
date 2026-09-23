import {
  ChartPie,
  LayoutDashboard,
  PiggyBank,
  Receipt,
  Settings,
  Target,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Shown in the mobile bottom bar. */
  primary?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, primary: true },
  { href: "/transactions", label: "Transactions", icon: Receipt, primary: true },
  { href: "/accounts", label: "Accounts", icon: Wallet, primary: true },
  { href: "/budgets", label: "Budgets", icon: PiggyBank, primary: true },
  { href: "/goals", label: "Savings Goals", icon: Target },
  { href: "/analytics", label: "Analytics", icon: ChartPie },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
