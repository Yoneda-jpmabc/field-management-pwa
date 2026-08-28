/**
 * loading.tsx が使う骨組み。
 *
 * 目的は「読み込みを綺麗に見せる」ことではなく、タップした瞬間に画面を
 * 差し替えて反応を返すこと。全ページが force-dynamic なので、loading.tsx が
 * 無いと Next.js はプリフェッチもクライアントキャッシュも行わず、
 * タップから描画までのあいだ前の画面が固まったままになる
 * （node_modules/next/dist/docs/01-app/02-guides/prefetching.md の
 *   「Prefetching static vs. dynamic routes」の表を参照）。
 *
 * 実画面と同じ余白・角丸・高さで置くこと。ずれると切り替わった瞬間に
 * 内容が飛び跳ねて、かえって遅く感じる。
 * すべて Server Component のまま（クライアント JS を増やさない）。
 */

import type { ReactNode } from "react";
import { PERIOD_UNITS } from "@/lib/work-records/period";

/**
 * loading.tsx の外枠。各 loading.tsx はこれで中身を包むこと。
 *
 * ・骨組み全体を 0.6 秒遅らせて出す（.skeleton-screen / globals.css）。
 *   応答が速いときは一度も見えないので、ちらつかない。
 * ・骨組みは装飾なので aria-hidden にし、読み上げ用の文言を 1 つだけ添える。
 */
export function SkeletonScreen({ children }: { children: ReactNode }) {
  return (
    <>
      <span className="sr-only" role="status">
        読み込み中
      </span>
      <div aria-hidden className="skeleton-screen">
        {children}
      </div>
    </>
  );
}

/** 単色の板。幅は呼び出し側が className で決める。 */
export function SkeletonBar({
  className = "",
}: {
  className?: string;
}) {
  return <div className={`skeleton ${className}`} />;
}

/** PageHeader（見出し＋説明文）と同じ高さ・余白の骨組み。 */
export function SkeletonPageHeader() {
  return (
    <div className="mb-6">
      <SkeletonBar className="h-[34px] w-40" />
      <SkeletonBar className="mt-2 h-[19px] w-full max-w-md" />
    </div>
  );
}

/** RecordsTabs / HarvestTabs と同じピル型タブの骨組み。 */
export function SkeletonTabs({ count }: { count: number }) {
  return (
    <div className="mb-5 flex gap-1 rounded-full bg-surface-secondary p-1">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="min-h-11 flex-1 rounded-full" />
      ))}
    </div>
  );
}

/**
 * PeriodSwitcher（単位ピル＋前後の矢印）と同じ骨組み。
 *
 * ピルの数は PERIOD_UNITS から取るので、単位を増減しても勝手に追従する。
 * 中央は期間名と「今日に戻す」の 2 段。片方だけにすると本文が届いた瞬間に
 * 高さが変わって画面が飛ぶ。
 */
export function SkeletonPeriodSwitcher() {
  return (
    <div className="mb-4 flex flex-col gap-3">
      <div className="flex gap-1 rounded-full bg-surface-secondary p-1">
        {PERIOD_UNITS.map((unit) => (
          <div key={unit} className="min-h-11 flex-1 rounded-full" />
        ))}
      </div>
      <div className="flex items-center justify-between gap-2">
        <SkeletonBar className="h-11 w-14 !rounded-full" />
        <div className="flex min-w-0 flex-1 flex-col items-center">
          <SkeletonBar className="h-[19px] w-32" />
          <SkeletonBar className="my-3.5 h-[15px] w-20" />
        </div>
        <SkeletonBar className="h-11 w-14 !rounded-full" />
      </div>
    </div>
  );
}

/** DaySwitcher（日付＋前後の矢印）と同じ骨組み。 */
export function SkeletonDaySwitcher() {
  return (
    <div className="mb-5 flex items-center justify-between gap-2">
      <SkeletonBar className="h-11 w-14 !rounded-full" />
      <SkeletonBar className="h-[19px] w-40" />
      <SkeletonBar className="h-11 w-14 !rounded-full" />
    </div>
  );
}

/** Card と同じ枠に、一覧の行を rows 本ぶん並べた骨組み。 */
export function SkeletonListCard({
  rows,
  className = "",
}: {
  rows: number;
  className?: string;
}) {
  return (
    <div className={`surface-card p-5 ${className}`}>
      <SkeletonBar className="mb-3 h-[21px] w-32" />
      <div className="flex flex-col divide-y divide-separator">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center justify-between gap-4 py-3">
            <div className="min-w-0 flex-1">
              <SkeletonBar className="h-[19px] w-2/5" />
              <SkeletonBar className="mt-1.5 h-[17px] w-3/5" />
            </div>
            <SkeletonBar className="h-[17px] w-16 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** 中身の形が決まっていない領域用の、のっぺりしたカード。 */
export function SkeletonBlockCard({ className = "" }: { className?: string }) {
  return <div className={`surface-card ${className}`} />;
}
