import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
  /** Tighter variant for inside a card. */
  compact?: boolean;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 text-center",
        compact ? "gap-3 px-6 py-10" : "gap-4 px-6 py-16",
        className,
      )}
    >
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-2xl border border-border bg-muted/60 text-muted-foreground",
          compact ? "size-10 [&>svg]:size-[1.1rem]" : "size-12 [&>svg]:size-5",
        )}
        aria-hidden="true"
      >
        <Icon strokeWidth={1.75} />
      </span>

      <div className="space-y-1.5">
        <h3
          className={cn(
            "font-semibold tracking-[-0.01em] text-foreground",
            compact ? "text-sm" : "text-base",
          )}
        >
          {title}
        </h3>
        <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>

      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}
