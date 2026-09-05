"use client";

import { useRouter } from "next/navigation";
import { RoundArrowButton } from "@/components/ui/RoundArrowButton";
import {
  formatDayLabel,
  shiftAnchor,
  todayInTokyo,
} from "@/lib/work-records/period";

/**
 * 日単位の前後移動。
 * 管理タブは「今日の分を確認する」画面なので、期間の単位切り替えは持たない。
 * 状態は URL のクエリに持たせるので、リロードや共有でも同じ日が開く。
 */
export function DaySwitcher({ date }: { date: string }) {
  const router = useRouter();
  const today = todayInTokyo();

  const go = (next: string) => {
    router.push(next === today ? "/care" : `/care?date=${next}`);
  };

  return (
    <div className="mb-5 flex items-center justify-between gap-2">
      <RoundArrowButton
        direction="prev"
        label="前の日"
        onClick={() => go(shiftAnchor("day", date, -1))}
      />

      <div className="flex min-w-0 flex-1 flex-col items-center">
        <p className="w-full truncate text-center text-[15px] font-semibold text-foreground">
          {formatDayLabel(date)}
          {date === today && (
            <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-accent-foreground">
              今日
            </span>
          )}
        </p>
        {date !== today && (
          <button
            type="button"
            onClick={() => go(today)}
            className="control-focus rounded-full px-4 py-3.5 text-xs text-accent transition-colors active:bg-surface-secondary"
          >
            今日に戻す
          </button>
        )}
      </div>

      <RoundArrowButton
        direction="next"
        label="次の日"
        onClick={() => go(shiftAnchor("day", date, 1))}
      />
    </div>
  );
}
