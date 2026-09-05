import {
  SkeletonBar,
  SkeletonListCard,
  SkeletonScreen,
} from "@/components/ui/Skeleton";

/** ホーム（週カレンダー＋直近の記録＋圃場）の骨組み。 */
export default function Loading() {
  return (
    <SkeletonScreen>
      {/* WeekCalendar: 週の前後移動 → 7 日ぶんのカード */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <SkeletonBar className="h-11 w-14 !rounded-full" />
        <SkeletonBar className="h-[19px] w-44" />
        <SkeletonBar className="h-11 w-14 !rounded-full" />
      </div>
      <div className="grid grid-cols-1 gap-2 lg:grid-cols-7 lg:gap-2.5">
        {Array.from({ length: 7 }, (_, i) => (
          <div
            key={i}
            className="rounded-[10px] border border-separator bg-surface-secondary/40 p-2.5 lg:flex lg:min-h-44 lg:flex-col"
          >
            <SkeletonBar className="h-[17px] w-20" />
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
        <SkeletonListCard rows={4} className="lg:col-span-3" />
        <SkeletonListCard rows={3} className="lg:col-span-2" />
      </div>
    </SkeletonScreen>
  );
}
