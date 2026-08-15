import {
  Skeleton,
  SkeletonCard,
  SkeletonPageHeader,
} from "@/components/ui/Skeleton";

export default function DashboardLoading() {
  return (
    <>
      <SkeletonPageHeader />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <SkeletonCard lines={4} />
        </div>
        <div className="lg:col-span-2">
          <SkeletonCard lines={3} />
        </div>
      </div>
    </>
  );
}
