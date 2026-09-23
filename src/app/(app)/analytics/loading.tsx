import { ChartSkeleton, SectionSkeleton } from "@/components/shared/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function AnalyticsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-9 w-44" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="surface space-y-3 p-5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-20 rounded-full" />
          </div>
        ))}
      </div>

      <SectionSkeleton>
        <ChartSkeleton height={320} />
      </SectionSkeleton>

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionSkeleton>
          <ChartSkeleton height={240} />
        </SectionSkeleton>
        <SectionSkeleton>
          <ChartSkeleton height={240} />
        </SectionSkeleton>
      </div>
    </div>
  );
}
