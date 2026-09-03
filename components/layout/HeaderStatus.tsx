"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { findLocation, useLocationId } from "@/lib/weather/locations";
import {
  STALE_AFTER_MS,
  getServerWeatherSnapshot,
  getWeatherFor,
  refreshWeather,
  subscribeWeather,
} from "@/lib/weather/current";
import { WeatherIcon } from "../icons";

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

/** ヘッダー左側の「今日の日付」。単独の要素にしているのは、右側の天気・同期状態と役割が違うため。 */
export function HeaderDate() {
  return (
    // 日付をまたいだ直後だけサーバーと 1 日ずれうるので、警告は抑える。
    <span
      suppressHydrationWarning
      className="shrink-0 text-[15px] font-semibold tracking-tight text-foreground"
    >
      {dateFormatter.format(new Date())}
    </span>
  );
}

/**
 * ヘッダー右側、同期状態アイコンの左に置く「天気アイコン＋今の気温」。
 *
 * 降水確率もまとめて取ってあるが（lib/weather/current.ts）、ここには出さない。
 * ヘッダーは作業中に一瞬見る場所なので、数字を並べるほど読み取りに時間がかかる。
 * 細かい予報は別の画面で出す。
 */
export function HeaderWeather() {
  const location = findLocation(useLocationId());

  const weather = useSyncExternalStore(
    subscribeWeather,
    useCallback(() => getWeatherFor(location.id), [location.id]),
    getServerWeatherSnapshot,
  );

  useEffect(() => {
    const controller = new AbortController();
    const refresh = () => void refreshWeather(location, controller.signal);
    // 定期更新は見えているときだけ。農作業中は画面を伏せている時間の方が長い。
    const refreshIfVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };

    refresh();
    document.addEventListener("visibilitychange", refreshIfVisible);
    window.addEventListener("online", refresh);
    const timer = setInterval(refreshIfVisible, STALE_AFTER_MS);

    return () => {
      controller.abort();
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refreshIfVisible);
      window.removeEventListener("online", refresh);
    };
  }, [location]);

  if (!weather) {
    // 取得できるまでは幅だけ確保して、値が入ったときに隣の同期アイコンが動かないようにする。
    return <span aria-hidden className="inline-block h-3 w-12 rounded-full bg-surface-secondary" />;
  }

  return (
    <div
      title={`${location.label}の気温`}
      className="flex shrink-0 items-center gap-1 text-[13px] font-medium tabular-nums text-foreground-secondary"
    >
      <WeatherIcon code={weather.weatherCode} isDay={weather.isDay} className="h-4 w-4 shrink-0" />
      {Math.round(weather.celsius * 10) / 10}°C
      <span className="sr-only">（{location.label}の気温）</span>
    </div>
  );
}
