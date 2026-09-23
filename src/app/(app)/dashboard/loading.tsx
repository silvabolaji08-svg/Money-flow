import {
  CardGridSkeleton,
  ChartSkeleton,
  HeroSkeleton,
  ListSkeleton,
  ProgressListSkeleton,
  SectionSkeleton,
} from "@/components/shared/skeletons";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <HeroSkeleton />
      <CardGridSkeleton />

      <div className="grid gap-5 xl:grid-cols-3">
        <SectionSkeleton className="xl:col-span-2">
          <ChartSkeleton />
        </SectionSkeleton>
        <SectionSkeleton>
          <ChartSkeleton height={220} />
        </SectionSkeleton>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <SectionSkeleton className="xl:col-span-2">
          <ListSkeleton />
        </SectionSkeleton>
        <SectionSkeleton>
          <ChartSkeleton height={220} />
        </SectionSkeleton>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionSkeleton>
          <ProgressListSkeleton />
        </SectionSkeleton>
        <SectionSkeleton>
          <ProgressListSkeleton />
        </SectionSkeleton>
      </div>
    </div>
  );
}
