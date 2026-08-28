import {
  SkeletonAnnounce,
  SkeletonBlockCard,
  SkeletonPageHeader,
} from "@/components/ui/Skeleton";

/**
 * 農薬 希釈計算の骨組み。
 * 見出しの下は計算フォームと履歴が入る 1 枚のカードなので、
 * それに合わせて背の高いカードを 1 枚だけ置く。
 */
export default function Loading() {
  return (
    <>
      <SkeletonAnnounce />
      <div aria-hidden>
        <SkeletonPageHeader />
        <SkeletonBlockCard className="h-96" />
      </div>
    </>
  );
}
