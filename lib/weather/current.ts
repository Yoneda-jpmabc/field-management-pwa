"use client";

import type { WeatherLocation } from "./locations";

export type CurrentWeather = {
  locationId: string;
  /** 摂氏。Open-Meteo の temperature_2m（地上 2m 気温）。 */
  celsius: number;
  /** WMO 天気コード。表記は wmo.ts の weatherLabel を通す。 */
  weatherCode: number;
  /** 昼夜。快晴・晴れのアイコンを太陽と月で出し分けるのに使う。 */
  isDay: boolean;
  /** これから PRECIPITATION_HOURS 時間のうち、いちばん高い降水確率(%)。取れなければ null。 */
  precipitationChance: number | null;
  /** 取得した時刻（epoch ms）。 */
  fetchedAt: number;
};

/** この時間を過ぎたら取り直す。Open-Meteo 側の更新間隔（15 分）に合わせている。 */
export const STALE_AFTER_MS = 15 * 60 * 1000;

/**
 * 降水確率を見る先の長さ。
 * 今降っているかは天気アイコンで分かるので、知りたいのは「これから降るか」。
 * 半日先まで見ると常に高い値が出て意味を成さないので、
 * ひと仕事の区切りとして 6 時間先までにしている。
 */
export const PRECIPITATION_HOURS = 6;

const CACHE_KEY_PREFIX = "weather-current:";

/**
 * 直近の天気は端末に残しておく。
 * 圃場では電波が届かないことがあるので、オフラインでも
 * 最後に取れた値をそのまま出せるようにする（接続状態はヘッダーの電源マークで分かる）。
 */
function readCache(locationId: string): CurrentWeather | null {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY_PREFIX + locationId);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    if (
      typeof value === "object" &&
      value !== null &&
      typeof (value as CurrentWeather).celsius === "number" &&
      typeof (value as CurrentWeather).weatherCode === "number" &&
      typeof (value as CurrentWeather).fetchedAt === "number"
    ) {
      const cached = value as CurrentWeather;
      return {
        locationId,
        celsius: cached.celsius,
        weatherCode: cached.weatherCode,
        isDay: cached.isDay !== false,
        precipitationChance:
          typeof cached.precipitationChance === "number" ? cached.precipitationChance : null,
        fetchedAt: cached.fetchedAt,
      };
    }
  } catch {
    // 壊れた値・古い形式は無視して取り直せばよい。
  }
  return null;
}

function writeCache(value: CurrentWeather) {
  try {
    window.localStorage.setItem(CACHE_KEY_PREFIX + value.locationId, JSON.stringify(value));
  } catch {
    // 保存できなくても表示自体には影響しない。
  }
}

/**
 * 表示中の値。地点ごとに 1 つだけ持つ。
 *
 * useState ではなくモジュール側に置いているのは、
 * localStorage から読んだ値をそのまま描画に使いたいため。
 * effect で setState すると、キャッシュがあっても一瞬プレースホルダが出る。
 */
const values = new Map<string, CurrentWeather | null>();
const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

/** 同じ値なら同じ参照を返す（useSyncExternalStore の再描画ループを避けるため）。 */
function getFor(locationId: string): CurrentWeather | null {
  if (!values.has(locationId)) values.set(locationId, readCache(locationId));
  return values.get(locationId) ?? null;
}

function getServerSnapshot(): CurrentWeather | null {
  return null;
}

const ENDPOINT = "https://api.open-meteo.com/v1/forecast";

function query(location: WeatherLocation) {
  return `latitude=${location.latitude}&longitude=${location.longitude}&timezone=Asia%2FTokyo`;
}

/**
 * 気温と天気。
 *
 * models=jma_seamless は気象庁 MSM/GSM で、既定の best_match より格子が細かい
 * （天草市内の 3 地点が別々の格子に入る程度）。無料枠のままで使える。
 */
async function fetchConditions(location: WeatherLocation, signal: AbortSignal) {
  const response = await fetch(
    `${ENDPOINT}?${query(location)}&current=temperature_2m,weather_code,is_day&models=jma_seamless`,
    { signal },
  );
  if (!response.ok) throw new Error(`Open-Meteo が ${response.status} を返しました`);

  const data: unknown = await response.json();
  const current = (data as { current?: Record<string, unknown> })?.current;
  const celsius = current?.temperature_2m;
  const code = current?.weather_code;
  if (typeof celsius !== "number" || typeof code !== "number") {
    throw new Error("Open-Meteo の応答に気温・天気が含まれていません");
  }
  return { celsius, weatherCode: code, isDay: current?.is_day !== 0 };
}

/**
 * これから数時間のうち、いちばん高い降水確率。
 *
 * 時間ごとの値を並べても狭いヘッダーには置けないので、最大値だけを出す。
 * 「60%」と出ていれば、その先どこかで降るかもしれない、と読めればよい。
 *
 * 降水確率はアンサンブル予報から作られる値で、jma_seamless からは返ってこない
 * （指定しても null で埋まる）。そのため既定モデルへ別に投げている。
 * forecast_hours は次の正時から数えた時間数を返す。
 */
async function fetchPrecipitationChance(location: WeatherLocation, signal: AbortSignal) {
  const response = await fetch(
    `${ENDPOINT}?${query(location)}&hourly=precipitation_probability&forecast_hours=${PRECIPITATION_HOURS}`,
    { signal },
  );
  if (!response.ok) return null;

  const data: unknown = await response.json();
  const hourly = (data as { hourly?: { precipitation_probability?: unknown } })?.hourly
    ?.precipitation_probability;
  if (!Array.isArray(hourly)) return null;

  const chances = hourly.filter((value): value is number => typeof value === "number");
  return chances.length > 0 ? Math.max(...chances) : null;
}

/**
 * 値が無いか古ければ取り直す。取れなければ何もしない（古い値をそのまま出す）。
 * 取得に失敗しても画面に出さないのは、天気は作業の判断材料であって
 * エラーを見せても利用者にできることが無いため。
 */
export async function refreshWeather(location: WeatherLocation, signal: AbortSignal) {
  const current = getFor(location.id);
  if (current && Date.now() - current.fetchedAt <= STALE_AFTER_MS) return;

  try {
    // 降水確率が取れなくても気温と天気は出したいので、こちらだけ握りつぶす。
    const [conditions, precipitationChance] = await Promise.all([
      fetchConditions(location, signal),
      fetchPrecipitationChance(location, signal).catch(() => null),
    ]);

    const value: CurrentWeather = {
      locationId: location.id,
      ...conditions,
      precipitationChance,
      fetchedAt: Date.now(),
    };
    writeCache(value);
    values.set(location.id, value);
    listeners.forEach((notify) => notify());
  } catch {
    // オフライン・API 障害。次の機会に取り直す。
  }
}

export {
  subscribe as subscribeWeather,
  getFor as getWeatherFor,
  getServerSnapshot as getServerWeatherSnapshot,
};
