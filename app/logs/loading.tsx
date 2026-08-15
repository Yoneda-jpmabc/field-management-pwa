import { SkeletonCard, SkeletonPageHeader, Skeleton } from "@/components/ui/Skeleton";

export default function LogsLoading() {
  return (
    <>
      <SkeletonPageHeader />
      <div className="flex flex-col gap-6">
        <div>
          <Skeleton className="mb-2.5 h-4 w-40" />
          <SkeletonCard lines={3} />
        </div>
        <div>
          <Skeleton className="mb-2.5 h-4 w-40" />
          <SkeletonCard lines={2} />
        </div>
      </div>
    </>
  );
}
