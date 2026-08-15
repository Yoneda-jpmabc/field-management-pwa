/**
 * loading.tsx 用のスケルトン部品。
 * ページ遷移した瞬間にレイアウトの骨組みを出し、「タップが効いていない」と
 * 感じさせないためのもの。実データの描画面積に近い形にしておくと、
 * 差し替わったときのガタつき（レイアウトシフト）が小さくなる。
 */

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden />;
}

export function SkeletonPageHeader() {
  return (
    <div className="mb-6">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="mt-2 h-4 w-64 max-w-full" />
    </div>
  );
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="surface-card flex flex-col gap-3 p-5">
      <Skeleton className="h-5 w-24" />
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}
