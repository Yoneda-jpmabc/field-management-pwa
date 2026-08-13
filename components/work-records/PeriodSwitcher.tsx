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
};

/**
 * 期間の単位切り替えと前後移動。
 * 状態は URL のクエリに持たせるので、リロードや共有でも同じ期間が開く。
 */
export function PeriodSwitcher({ unit, anchor, label }: Props) {
  const router = useRouter();

  const go = (nextUnit: PeriodUnit, nextAnchor: string) => {
    router.push(`/records/summary?unit=${nextUnit}&date=${nextAnchor}`);
  };

  return (
    <div className="mb-4 flex flex-col gap-3">
      <div className="flex gap-1 rounded-full bg-surface-secondary p-1">
        {PERIOD_UNITS.map((candidate) => (
          <button
            key={candidate}
            type="button"
            onClick={() => go(candidate, anchor)}
            className={`control-focus flex-1 rounded-full py-2 text-center text-sm font-medium transition-colors ${
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
          className="control-focus rounded-full border border-separator-strong px-3.5 py-2 text-[15px] text-foreground-secondary transition-colors hover:bg-surface-secondary"
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
            className="control-focus text-xs text-accent"
          >
            今日に戻す
          </button>
        </div>
        <button
          type="button"
          aria-label="次の期間"
          onClick={() => go(unit, shiftAnchor(unit, anchor, 1))}
          className="control-focus rounded-full border border-separator-strong px-3.5 py-2 text-[15px] text-foreground-secondary transition-colors hover:bg-surface-secondary"
        >
          →
        </button>
      </div>
    </div>
  );
}
