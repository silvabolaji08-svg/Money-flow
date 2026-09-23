import { cn } from "@/lib/utils";

type LogoMarkProps = {
  className?: string;
};

/**
 * The MoneyFlow mark: two offset currents forming an upward flow inside a
 * rounded square. Simple enough to read at 20px in the sidebar.
 */
export function LogoMark({ className }: LogoMarkProps) {
  return (
    <span
      className={cn(
        "relative inline-flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-[0.6rem]",
        "bg-[linear-gradient(140deg,var(--brand),color-mix(in_oklab,var(--savings)_70%,var(--brand)))]",
        "shadow-[0_1px_2px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.28)]",
        className,
      )}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="size-[62%] text-white"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d="M4 16.5c3.2 0 4.2-4.2 7.4-4.2S15.6 16 19 16"
          stroke="currentColor"
          strokeWidth="2.1"
          opacity="0.55"
        />
        <path
          d="M4 11.5c3.2 0 4.2-4.2 7.4-4.2S15.6 11 19 11"
          stroke="currentColor"
          strokeWidth="2.1"
        />
      </svg>
    </span>
  );
}

type LogoProps = {
  className?: string;
  /** Hide the wordmark, e.g. in a collapsed sidebar. */
  markOnly?: boolean;
};

export function Logo({ className, markOnly = false }: LogoProps) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      {!markOnly ? (
        <span className="text-[0.975rem] font-semibold tracking-[-0.02em] text-foreground">
          MoneyFlow
        </span>
      ) : null}
    </span>
  );
}
