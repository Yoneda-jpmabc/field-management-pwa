import {
  SkeletonBlockCard,
  SkeletonPeriodSwitcher,
  SkeletonScreen,
} from "@/components/ui/Skeleton";

/**
 * 収穫タブの骨組み。/harvest と /harvest/list の両方を覆う。
 * どちらも「期間切り替え → カードの並び」で同じ構成。
 * 圃場ごと／収穫履歴の切り替えは SubTabBar（AppShell 側）にあり、
 * 切り替え中も消えないので、ここには描かない。
 */
export default function Loading() {
  return (
    <SkeletonScreen>
      <SkeletonPeriodSwitcher />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }, (_, i) => (
          <SkeletonBlockCard key={i} className="h-24" />
        ))}
      </div>
    </SkeletonScreen>
  );
}
