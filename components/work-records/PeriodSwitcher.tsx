"use client";

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
 */
export function PeriodSwitcher({
  unit,
  anchor,
  label,
  basePath = "/records/summary",
}: Props) {
  const router = useRouter();

  const go = (nextUnit: PeriodUnit, nextAnchor: string) => {
    router.push(`${basePath}?unit=${nextUnit}&date=${nextAnchor}`);
  };

  return (
    <div className="mb-4 flex flex-col gap-3">
      <div className="flex gap-1 rounded-full bg-surface-secondary p-1">
        {PERIOD_UNITS.map((candidate) => (
          <button
            key={candidate}
            type="button"
            onClick={() => go(candidate, anchor)}
            className={`control-focus min-h-11 flex-1 rounded-full text-center text-sm font-medium transition-colors ${
              candidate === unit
                ? "bg-surface text-foreground shadow-[var(--shadow-card)]"
                : "text-foreground-secondary hover:text-foreground active:bg-surface/60"
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
          className="control-focus flex min-h-11 min-w-14 items-center justify-center rounded-full border border-separator-strong text-[17px] text-foreground-secondary transition-colors hover:bg-surface-secondary active:bg-surface-secondary"
        >
          ←
        </button>
        <div className="min-w-0 text-center">
          <p className="truncate text-[15px] font-semibold text-foreground">
            {label}
          </p>
          <button
            type="button"
            onClick={() => go(unit, todayInTokyo())}
            className="control-focus -mx-3 -my-1 rounded-full px-3 py-1 text-xs text-accent active:bg-surface-secondary"
          >
            今日に戻す
          </button>
        </div>
        <button
          type="button"
          aria-label="次の期間"
          onClick={() => go(unit, shiftAnchor(unit, anchor, 1))}
          className="control-focus flex min-h-11 min-w-14 items-center justify-center rounded-full border border-separator-strong text-[17px] text-foreground-secondary transition-colors hover:bg-surface-secondary active:bg-surface-secondary"
        >
          →
        </button>
      </div>
    </div>
  );
}
