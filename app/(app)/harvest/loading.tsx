import {
  SkeletonBlockCard,
  SkeletonPeriodSwitcher,
  SkeletonScreen,
  SkeletonTabs,
} from "@/components/ui/Skeleton";

/**
 * 収穫タブの骨組み。/harvest と /harvest/list の両方を覆う。
 * どちらも「見出し → タブ → 期間切り替え → カードの並び」で同じ構成。
 */
export default function Loading() {
  return (
    <SkeletonScreen>
      <SkeletonTabs count={2} />
      <SkeletonPeriodSwitcher />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }, (_, i) => (
          <SkeletonBlockCard key={i} className="h-24" />
        ))}
      </div>
    </SkeletonScreen>
  );
}
