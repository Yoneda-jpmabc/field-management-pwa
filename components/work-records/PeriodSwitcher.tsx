"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  PERIOD_UNITS,
  PERIOD_UNIT_LABELS,
  shiftAnchor,
  todayInTokyo,
  type PeriodUnit,
} from "@/lib/work-records/period";

type Props = {
  unit: PeriodUnit;
  anchor: string;
  label: string;
  /** 期間クエリを付けて遷移する先。確認タブと集計タブで共用する。 */
  basePath?: string;
};

/**
 * 期間の単位切り替えと前後移動。
 * 状態は URL のクエリに持たせるので、リロードや共有でも同じ期間が開く。
 * 遷移は useTransition で包み、待ちの間は前の内容を出したまま
 * パネル全体を薄くして「反応した」ことを指に返す。
 */
export function PeriodSwitcher({
  unit,
  anchor,
  label,
  basePath = "/records/summary",
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const go = (nextUnit: PeriodUnit, nextAnchor: string) => {
    startTransition(() => {
      router.push(`${basePath}?unit=${nextUnit}&date=${nextAnchor}`);
    });
  };

  return (
    <div
      className={`mb-4 flex flex-col gap-3 transition-opacity ${
        pending ? "opacity-50" : ""
      }`}
      aria-busy={pending}
    >
      <div className="flex gap-1 rounded-full bg-surface-secondary p-1">
        {PERIOD_UNITS.map((candidate) => (
          <button
            key={candidate}
            type="button"
            onClick={() => go(candidate, anchor)}
            className={`control-focus pressable min-h-11 flex-1 rounded-full text-center text-[15px] font-medium ${
              candidate === unit
                ? "bg-surface text-foreground shadow-[var(--shadow-card)]"
                : "text-foreground-secondary hover:text-foreground"
            }`}
          >
            {PERIOD_UNIT_LABELS[candidate]}ごと
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          aria-label="前の期間"
          onClick={() => go(unit, shiftAnchor(unit, anchor, -1))}
          className="control-focus pressable flex min-h-11 min-w-14 items-center justify-center rounded-full border border-separator-strong text-[17px] text-foreground-secondary hover:bg-surface-secondary"
        >
          ←
        </button>
        {/* 期間名とリセットを縦に積む。押せる高さを確保するため余白は削らない */}
        <div className="flex min-w-0 flex-1 flex-col items-center">
          <p className="w-full truncate text-center text-[15px] font-semibold text-foreground">
            {label}
          </p>
          <button
            type="button"
            onClick={() => go(unit, todayInTokyo())}
            className="control-focus pressable rounded-full px-4 py-3.5 text-xs text-accent"
          >
            今日に戻す
          </button>
        </div>
        <button
          type="button"
          aria-label="次の期間"
          onClick={() => go(unit, shiftAnchor(unit, anchor, 1))}
          className="control-focus pressable flex min-h-11 min-w-14 items-center justify-center rounded-full border border-separator-strong text-[17px] text-foreground-secondary hover:bg-surface-secondary"
        >
          →
        </button>
      </div>
    </div>
  );
}
