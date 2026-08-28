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
import { weatherLabel } from "@/lib/weather/wmo";
import { IconUmbrella, WeatherIcon } from "../icons";

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

/** ヘッダーの「今日の日付・今の天気・気温・降水確率」。 */
export function HeaderStatus() {
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

  return (
    <div className="flex min-w-0 items-center gap-2.5">
      {/* 日付をまたいだ直後だけサーバーと 1 日ずれうるので、警告は抑える。 */}
      <span
        suppressHydrationWarning
        className="shrink-0 text-[15px] font-semibold tracking-tight text-foreground"
      >
        {dateFormatter.format(new Date())}
      </span>

      {weather ? (
        <div
          // 何の値なのかはアイコンだけだと伝わらないので、まとめて読み上げ文にする。
          aria-label={`${location.label}の天気 ${weatherLabel(weather.weatherCode)}、気温 ${weather.celsius} 度${
            weather.precipitationChance === null
              ? ""
              : `、降水確率 ${weather.precipitationChance} パーセント`
          }`}
          title={`${location.label}｜${weatherLabel(weather.weatherCode)}`}
          className="flex min-w-0 items-center gap-1.5 text-[13px] font-medium text-foreground-secondary"
        >
          <WeatherIcon
            code={weather.weatherCode}
            isDay={weather.isDay}
            className="h-[17px] w-[17px] shrink-0"
          />
          <span className="tabular-nums">{Math.round(weather.celsius * 10) / 10}°C</span>
          {weather.precipitationChance !== null && (
            <>
              <IconUmbrella className="ml-0.5 h-[15px] w-[15px] shrink-0" />
              <span className="tabular-nums">{weather.precipitationChance}%</span>
            </>
          )}
        </div>
      ) : (
        // 取得できるまでは幅だけ確保して、値が入ったときに日付がずれないようにする。
        <span aria-hidden className="inline-block h-3 w-20 rounded-full bg-surface-secondary" />
      )}
    </div>
  );
}
