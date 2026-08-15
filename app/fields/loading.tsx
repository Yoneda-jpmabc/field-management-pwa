import { SkeletonCard, SkeletonPageHeader, Skeleton } from "@/components/ui/Skeleton";

export default function FieldsLoading() {
  return (
    <>
      <SkeletonPageHeader />
      <Skeleton className="mb-5 h-11 w-full max-w-sm" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SkeletonCard lines={2} />
        <SkeletonCard lines={2} />
        <SkeletonCard lines={2} />
      </div>
    </>
  );
}
