import {
  SkeletonAnnounce,
  SkeletonBlockCard,
  SkeletonPageHeader,
  SkeletonTabs,
} from "@/components/ui/Skeleton";

/**
 * 実績タブの骨組み。/records・/records/list・/records/summary を覆う。
 *
 * 3 つで中身の形が違う（登録はフォーム、確認は一覧、集計は表）ので、
 * 共通する「見出し → タブ」までを実物どおりに置き、その下は
 * 高さだけのカードにしている。ここで期間切り替えまで描くと、
 * それを持たない登録タブで切り替わった瞬間に内容が跳ねる。
 */
export default function Loading() {
  return (
    <>
      <SkeletonAnnounce />
      <div aria-hidden>
        <SkeletonPageHeader />
        <SkeletonTabs count={3} />
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }, (_, i) => (
            <SkeletonBlockCard key={i} className="h-24" />
          ))}
        </div>
      </div>
    </>
  );
}
