import {
  SkeletonBlockCard,
  SkeletonScreen,
} from "@/components/ui/Skeleton";

/**
 * 実績タブの骨組み。/records・/records/list・/records/summary を覆う。
 *
 * 登録・確認・集計の切り替えは SubTabBar（AppShell 側）に移したので、
 * 切り替え中もあれは消えない。ここで描くのは本文だけ。
 * 3 つで中身の形が違う（登録はフォーム、確認は一覧、集計は表）ため、
 * 高さだけのカードを並べている。ここで期間切り替えまで描くと、
 * それを持たない登録タブで切り替わった瞬間に内容が跳ねる。
 */
export default function Loading() {
  return (
    <SkeletonScreen>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }, (_, i) => (
          <SkeletonBlockCard key={i} className="h-24" />
        ))}
      </div>
    </SkeletonScreen>
  );
}
