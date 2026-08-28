import {
  SkeletonAnnounce,
  SkeletonBar,
  SkeletonBlockCard,
  SkeletonPageHeader,
} from "@/components/ui/Skeleton";

/** 設定タブ（圃場情報・管理項目・単位・表示・同期）の骨組み。 */
export default function Loading() {
  return (
    <>
      <SkeletonAnnounce />
      <div aria-hidden className="flex flex-col gap-6">
        <SkeletonPageHeader />
        {[3, 2, 2, 1, 2].map((cards, section) => (
          <section key={section}>
            <SkeletonBar className="mb-2.5 h-[17px] w-24" />
            <div className="flex flex-col gap-3">
              {Array.from({ length: cards }, (_, i) => (
                <SkeletonBlockCard key={i} className="h-20" />
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
