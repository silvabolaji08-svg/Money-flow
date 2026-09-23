import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  ChartPie,
  PiggyBank,
  Receipt,
  ShieldCheck,
  Target,
  Wallet,
} from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { getSessionUser } from "@/server/session";

const FEATURES = [
  {
    icon: Receipt,
    title: "Track every naira",
    detail:
      "Log income and expenses in seconds, categorise them, and search or filter the whole history when you need it.",
  },
  {
    icon: Wallet,
    title: "Accounts that balance themselves",
    detail:
      "Cash, bank, savings, investments and wallets. Balances update the moment a transaction lands.",
  },
  {
    icon: PiggyBank,
    title: "Budgets that hold",
    detail:
      "Set a monthly limit per category and see exactly how much is left, before you overspend.",
  },
  {
    icon: Target,
    title: "Savings goals with a deadline",
    detail:
      "Name what you are saving for, set a target, and watch the gap close as you add to it.",
  },
  {
    icon: ChartPie,
    title: "Analytics that explain",
    detail:
      "Trends, category splits and plain-language insights computed from your own transactions.",
  },
  {
    icon: ShieldCheck,
    title: "Yours alone",
    detail:
      "Passwords are hashed, sessions are signed, and every query is scoped to your account.",
  },
];

export default async function LandingPage() {
  const user = await getSessionUser();

  if (user) redirect("/dashboard");

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
          <Logo />

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border">
          <div className="hero-sheen absolute inset-0" aria-hidden="true" />
          <div
            className="grid-lines absolute inset-0 opacity-30 [mask-image:radial-gradient(90%_70%_at_50%_0%,black,transparent_75%)]"
            aria-hidden="true"
          />

          <div className="relative mx-auto w-full max-w-6xl px-5 py-20 text-center sm:px-8 sm:py-28">
            <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="size-1.5 rounded-full bg-brand" aria-hidden="true" />
              Personal finance, without the spreadsheet
            </p>

            <h1 className="mx-auto mt-6 max-w-3xl text-[2.6rem] font-semibold leading-[1.05] tracking-[-0.04em] text-foreground sm:text-6xl">
              Know exactly where your money goes.
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              MoneyFlow turns your income and spending into one clear picture — balances, budgets,
              savings goals and the trends behind them.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/register">
                  Create your account
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                <Link href="/login">Sign in</Link>
              </Button>
            </div>

            {/* A calm, honest preview of the product's core figures. */}
            <div className="mx-auto mt-16 max-w-3xl rounded-3xl border border-border bg-card p-6 text-left shadow-[var(--shadow-lifted)] sm:p-8">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Total balance
              </p>
              <p className="mt-2 text-4xl font-semibold tracking-[-0.035em] tnum text-foreground sm:text-5xl">
                ₦2,450,000.00
              </p>

              <dl className="mt-8 grid grid-cols-2 gap-6 border-t border-border pt-6 sm:grid-cols-4">
                <PreviewStat label="Income" value="₦980,000" tone="positive" />
                <PreviewStat label="Expenses" value="₦642,500" />
                <PreviewStat label="Net flow" value="+₦337,500" tone="positive" />
                <PreviewStat label="Savings rate" value="34.4%" />
              </dl>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-4xl">
              Everything you need, nothing you do not.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Built around the six questions you actually ask about your money.
            </p>
          </div>

          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;

              return (
                <li key={feature.title} className="surface surface-hover p-6">
                  <span
                    className="inline-flex size-10 items-center justify-center rounded-xl border border-border bg-muted/60 text-brand"
                    aria-hidden="true"
                  >
                    <Icon className="size-[1.15rem]" strokeWidth={1.9} />
                  </span>
                  <h3 className="mt-4 text-[0.95rem] font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {feature.detail}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Closing call to action */}
        <section className="border-t border-border">
          <div className="mx-auto w-full max-w-6xl px-5 py-20 text-center sm:px-8">
            <h2 className="mx-auto max-w-xl text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-4xl">
              Start with your first transaction.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-base text-muted-foreground">
              It takes a minute to set up, and the dashboard fills itself in from there.
            </p>
            <Button asChild size="lg" className="mt-8">
              <Link href="/register">
                Get started free
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row sm:px-8">
          <Logo />
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} MoneyFlow. Built as a complete, open personal finance app.
          </p>
        </div>
      </footer>
    </div>
  );
}

function PreviewStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "positive";
}) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd
        className={`mt-1 text-lg font-semibold tnum ${
          tone === "positive" ? "text-positive" : "text-foreground"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
