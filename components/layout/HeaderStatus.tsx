"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { findLocation, useLocationId } from "@/lib/weather/locations";
import {
  STALE_AFTER_MS,
  getServerTemperatureSnapshot,
  getTemperatureFor,
  refreshTemperature,
  subscribeTemperature,
} from "@/lib/weather/current";

/**
 * 日付は必ず日本時間で出す。
 * サーバー（Vercel）の時刻は UTC なので、タイムゾーンを明示しないと
 * サーバー描画とハイドレーションで日付がずれる。
 */
const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  month: "long",
  day: "numeric",
  weekday: "short",
});

/** ヘッダーの「今日の日付・今の気温」。 */
export function HeaderStatus() {
  const location = findLocation(useLocationId());

  const temperature = useSyncExternalStore(
    subscribeTemperature,
    useCallback(() => getTemperatureFor(location.id), [location.id]),
    getServerTemperatureSnapshot,
  );

  useEffect(() => {
    const controller = new AbortController();
    const refresh = () => {
      // 画面を伏せている間は取りに行かない。農作業中はその時間の方が長い。
      if (document.visibilityState !== "visible") return;
      void refreshTemperature(location, controller.signal);
    };

    refresh();
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("online", refresh);
    const timer = setInterval(refresh, STALE_AFTER_MS);

    return () => {
      controller.abort();
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("online", refresh);
    };
  }, [location]);

  return (
    <div className="flex min-w-0 items-baseline gap-2">
      {/* 日付をまたいだ直後だけサーバーと 1 日ずれうるので、警告は抑える。 */}
      <span
        suppressHydrationWarning
        className="text-[15px] font-semibold tracking-tight text-foreground"
      >
        {dateFormatter.format(new Date())}
      </span>

      {temperature ? (
        <span
          title={`${location.label}の気温`}
          className="truncate text-[13px] font-medium tabular-nums text-foreground-secondary"
        >
          {Math.round(temperature.celsius * 10) / 10}°C
          <span className="sr-only">（{location.label}の気温）</span>
        </span>
      ) : (
        // 取得できるまでは幅だけ確保して、値が入ったときに日付がずれないようにする。
        <span aria-hidden className="inline-block h-3 w-10 rounded-full bg-surface-secondary" />
      )}
    </div>
  );
}
