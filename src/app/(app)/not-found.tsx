import Link from "next/link";
import { Compass } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function AppNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 text-center">
      <span
        className="inline-flex size-12 items-center justify-center rounded-2xl border border-border bg-muted/60 text-muted-foreground"
        aria-hidden="true"
      >
        <Compass className="size-5" strokeWidth={1.8} />
      </span>

      <div className="space-y-2">
        <h1 className="text-xl font-semibold tracking-[-0.02em] text-foreground">
          We could not find that
        </h1>
        <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
          The page or record you are looking for does not exist, or it belongs to another account.
        </p>
      </div>

      <Button asChild>
        <Link href="/dashboard">Back to dashboard</Link>
      </Button>
    </div>
  );
}
