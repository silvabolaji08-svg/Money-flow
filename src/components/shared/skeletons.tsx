import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function HeroSkeleton() {
  return (
    <div className="surface grid gap-8 rounded-3xl p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
      <div className="space-y-4">
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="grid grid-cols-2 gap-x-10 gap-y-5 lg:border-l lg:border-border lg:pl-10">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-4 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardGridSkeleton({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid gap-3 sm:grid-cols-2 xl:grid-cols-4", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="surface flex items-center gap-3 p-4">
          <Skeleton className="size-10 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton({ height = 288 }: { height?: number }) {
  return (
    <div className="space-y-4">
      <div className="flex items-end gap-2" style={{ height }}>
        {[58, 74, 45, 88, 63, 96, 52, 80, 70, 92, 61, 84].map((value, index) => (
          <Skeleton key={index} className="flex-1 rounded-md" style={{ height: `${value}%` }} />
        ))}
      </div>
      <div className="flex gap-4">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <ul className="divide-y divide-border/70">
      {Array.from({ length: rows }).map((_, index) => (
        <li key={index} className="flex items-center gap-4 px-3 py-3">
          <Skeleton className="size-10 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="h-4 w-20" />
        </li>
      ))}
    </ul>
  );
}

export function SectionSkeleton({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("surface overflow-hidden", className)}>
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

export function ProgressListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <ul className="space-y-5">
      {Array.from({ length: rows }).map((_, index) => (
        <li key={index} className="space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="size-8 rounded-[0.55rem]" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="ml-auto h-4 w-28" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
          <div className="flex justify-between">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        </li>
      ))}
    </ul>
  );
}
