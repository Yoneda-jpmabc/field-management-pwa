import { SkeletonCard, SkeletonPageHeader, Skeleton } from "@/components/ui/Skeleton";

export default function RecordsLoading() {
  return (
    <>
      <SkeletonPageHeader />
      <Skeleton className="mb-5 h-10 w-full rounded-full" />
      <div className="flex flex-col gap-4">
        <SkeletonCard lines={2} />
        <SkeletonCard lines={1} />
        <SkeletonCard lines={2} />
        <SkeletonCard lines={3} />
      </div>
    </>
  );
}
