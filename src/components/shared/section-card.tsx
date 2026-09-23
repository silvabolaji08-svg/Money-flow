import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type SectionCardProps = {
  title: string;
  description?: string;
  /** Secondary action rendered top-right. */
  href?: string;
  linkLabel?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
};

export function SectionCard({
  title,
  description,
  href,
  linkLabel = "View all",
  action,
  children,
  className,
  bodyClassName,
}: SectionCardProps) {
  return (
    <section className={cn("surface flex flex-col overflow-hidden", className)}>
      <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
        <div className="min-w-0 space-y-0.5">
          <h2 className="text-[0.95rem] font-semibold tracking-[-0.01em] text-foreground">
            {title}
          </h2>
          {description ? (
            <p className="truncate text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>

        {action ??
          (href ? (
            <Link
              href={href}
              className="group inline-flex shrink-0 items-center gap-1 rounded-md text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {linkLabel}
              <ArrowRight
                className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          ) : null)}
      </header>

      <div className={cn("flex-1 p-5 sm:p-6", bodyClassName)}>{children}</div>
    </section>
  );
}
