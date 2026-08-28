import {
  SkeletonAnnounce,
  SkeletonBlockCard,
  SkeletonDaySwitcher,
  SkeletonPageHeader,
} from "@/components/ui/Skeleton";

/** 管理タブ（日付切り替え＋作物ごとのチェックリスト）の骨組み。 */
export default function Loading() {
  return (
    <>
      <SkeletonAnnounce />
      <div aria-hidden>
        <SkeletonPageHeader />
        <SkeletonDaySwitcher />
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }, (_, i) => (
            <SkeletonBlockCard key={i} className="h-20" />
          ))}
        </div>
      </div>
    </>
  );
}
