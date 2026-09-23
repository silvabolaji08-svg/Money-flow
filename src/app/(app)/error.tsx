"use client";

import { useEffect } from "react";
import { RefreshCw, TriangleAlert } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

/**
 * Catches anything that throws while rendering an authenticated page. The raw
 * error is logged for us, never shown to the person using the app.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[moneyflow] render error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 text-center">
      <span
        className="inline-flex size-12 items-center justify-center rounded-2xl border border-border bg-muted/60 text-warning"
        aria-hidden="true"
      >
        <TriangleAlert className="size-5" strokeWidth={1.8} />
      </span>

      <div className="space-y-2">
        <h1 className="text-xl font-semibold tracking-[-0.02em] text-foreground">
          Something went wrong
        </h1>
        <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
          We could not load this page. Your data is safe — trying again usually sorts it out.
        </p>
        {error.digest ? (
          <p className="text-xs text-muted-foreground">Reference: {error.digest}</p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button onClick={reset}>
          <RefreshCw className="size-4" aria-hidden="true" />
          Try again
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
