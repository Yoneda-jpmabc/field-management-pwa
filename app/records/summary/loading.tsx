import { SkeletonCard, SkeletonPageHeader, Skeleton } from "@/components/ui/Skeleton";

export default function SummaryLoading() {
  return (
    <>
      <SkeletonPageHeader />
      <Skeleton className="mb-5 h-10 w-full rounded-full" />
      <Skeleton className="mb-3 h-10 w-full rounded-full" />
      <Skeleton className="mb-4 h-12 w-full" />
      <div className="flex flex-col gap-4">
        <SkeletonCard lines={1} />
        <SkeletonCard lines={4} />
        <SkeletonCard lines={3} />
      </div>
    </>
  );
}
