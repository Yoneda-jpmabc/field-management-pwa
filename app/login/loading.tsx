import { SkeletonBar, SkeletonScreen } from "@/components/ui/Skeleton";

/** ログイン画面（見出し＋入力2つ＋ボタン）の骨組み。 */
export default function Loading() {
  return (
    <main className="flex min-h-dvh flex-col justify-center px-6 py-12">
      <div className="mx-auto w-full max-w-sm">
        <SkeletonScreen>
          <div className="mb-8">
            <SkeletonBar className="h-[34px] w-52" />
            <SkeletonBar className="mt-2 h-[19px] w-full max-w-xs" />
          </div>
          <div className="surface-card flex flex-col gap-4 p-5">
            {[0, 1].map((i) => (
              <div key={i}>
                <SkeletonBar className="mb-1.5 h-[17px] w-24" />
                <SkeletonBar className="h-12 w-full" />
              </div>
            ))}
            <SkeletonBar className="mt-1 h-12 w-full !rounded-full" />
          </div>
        </SkeletonScreen>
      </div>
    </main>
  );
}
