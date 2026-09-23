import Link from "next/link";
import { ArrowLeft, ShieldCheck, TrendingUp, Wallet } from "lucide-react";

import { Logo } from "@/components/brand/logo";

/**
 * Split layout: the form stays front and centre on every screen size, with a
 * brand panel appearing only when there is room for it.
 */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_minmax(0,0.9fr)]">
      <div className="flex flex-col px-5 py-8 sm:px-10 lg:px-16">
        <div className="flex items-center justify-between">
          <Link href="/" className="rounded-lg" aria-label="MoneyFlow home">
            <Logo />
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-[25rem]">{children}</div>
        </div>

        <p className="text-center text-xs text-muted-foreground lg:text-left">
          © {new Date().getFullYear()} MoneyFlow. Your data stays yours.
        </p>
      </div>

      <aside className="relative hidden overflow-hidden border-l border-border bg-card lg:flex lg:flex-col lg:justify-between">
        <div className="hero-sheen absolute inset-0" aria-hidden="true" />
        <div
          className="grid-lines absolute inset-0 opacity-30 [mask-image:radial-gradient(120%_100%_at_100%_0%,black,transparent_70%)]"
          aria-hidden="true"
        />

        <div className="relative p-12 pt-24">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Personal finance, clearly
          </p>
          <h2 className="mt-5 max-w-sm text-3xl font-semibold leading-[1.15] tracking-[-0.03em] text-foreground">
            Know exactly where your money goes.
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Track income and expenses, set budgets that hold, and watch your savings goals close in —
            all from one calm dashboard.
          </p>
        </div>

        <ul className="relative space-y-5 p-12 pb-24">
          <Feature
            icon={Wallet}
            title="Every account in one place"
            detail="Cash, bank, wallet and investments, balanced automatically."
          />
          <Feature
            icon={TrendingUp}
            title="Numbers you can trust"
            detail="Balances and budgets are computed from your transactions, to the kobo."
          />
          <Feature
            icon={ShieldCheck}
            title="Private by default"
            detail="Your financial data is scoped to your account and never shared."
          />
        </ul>
      </aside>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  detail,
}: {
  icon: typeof Wallet;
  title: string;
  detail: string;
}) {
  return (
    <li className="flex gap-4">
      <span
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl border border-border bg-background/70 text-brand"
        aria-hidden="true"
      >
        <Icon className="size-[1.05rem]" strokeWidth={1.9} />
      </span>
      <div className="space-y-0.5">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">{detail}</p>
      </div>
    </li>
  );
}
