"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { findLocation, useLocationId } from "@/lib/weather/locations";
import {
  PRECIPITATION_HOURS,
  STALE_AFTER_MS,
  getServerWeatherSnapshot,
  getWeatherFor,
  refreshWeather,
  subscribeWeather,
  type CurrentWeather,
} from "@/lib/weather/current";
import { weatherLabel } from "@/lib/weather/wmo";
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

/**
 * 「6h 38%/0.0mm」＝これから 6 時間の、最大降水確率と合計降水量。
 * 確率と量の両方を出すのは、確率が 0.1mm 超を降ったと数える緩い基準で、
 * 「確率は高いが実際はほとんど降らない」ことがよくあるため。
 */
function rainText(weather: CurrentWeather): string | null {
  if (weather.precipitationChance === null || weather.precipitationMm === null) return null;
  return `${PRECIPITATION_HOURS}h ${weather.precipitationChance}%/${weather.precipitationMm.toFixed(1)}mm`;
}

/** ヘッダーの「今日の日付・今の天気・気温・これからの雨」。 */
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
            rainText(weather)
              ? `、これから${PRECIPITATION_HOURS}時間の降水確率 最大 ${weather.precipitationChance} パーセント、降水量 ${weather.precipitationMm?.toFixed(1)} ミリ`
              : ""
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
          {rainText(weather) && (
            <span className="min-w-0 truncate">
              {/* 画面がごく狭い端末では見出しを畳む。数字が切れるより読める。 */}
              <span className="hidden text-foreground-tertiary min-[360px]:inline">降水確率 </span>
              {/* 「今」ではなく「これから」の値だと分かるように、先の長さを添える。 */}
              <span className="tabular-nums">{rainText(weather)}</span>
            </span>
          )}
        </div>
      ) : (
        // 取得できるまでは幅だけ確保して、値が入ったときに日付がずれないようにする。
        <span aria-hidden className="inline-block h-3 w-20 rounded-full bg-surface-secondary" />
      )}
    </div>
  );
}
