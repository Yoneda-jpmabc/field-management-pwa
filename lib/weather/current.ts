"use client";

import type { WeatherLocation } from "./locations";

export type CurrentTemperature = {
  locationId: string;
  /** 摂氏。Open-Meteo の temperature_2m（地上 2m 気温）。 */
  celsius: number;
  /** 取得した時刻（epoch ms）。 */
  fetchedAt: number;
};

/** この時間を過ぎたら取り直す。Open-Meteo 側の更新間隔（15 分）に合わせている。 */
export const STALE_AFTER_MS = 15 * 60 * 1000;

const CACHE_KEY_PREFIX = "weather-current:";

/**
 * 直近の気温は端末に残しておく。
 * 圃場では電波が届かないことがあるので、オフラインでも
 * 最後に取れた値をそのまま出せるようにする（接続状態はヘッダーの電源マークで分かる）。
 */
function readCache(locationId: string): CurrentTemperature | null {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY_PREFIX + locationId);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof (parsed as CurrentTemperature).celsius === "number" &&
      typeof (parsed as CurrentTemperature).fetchedAt === "number"
    ) {
      const value = parsed as CurrentTemperature;
      return { locationId, celsius: value.celsius, fetchedAt: value.fetchedAt };
    }
  } catch {
    // 壊れた値は無視して取り直せばよい。
  }
  return null;
}

function writeCache(value: CurrentTemperature) {
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
const values = new Map<string, CurrentTemperature | null>();
const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

/** 同じ値なら同じ参照を返す（useSyncExternalStore の再描画ループを避けるため）。 */
function getFor(locationId: string): CurrentTemperature | null {
  if (!values.has(locationId)) values.set(locationId, readCache(locationId));
  return values.get(locationId) ?? null;
}

function getServerSnapshot(): CurrentTemperature | null {
  return null;
}

/**
 * Open-Meteo から現在の気温を取る。
 * API キー不要・CORS 許可済みなので、サーバーを経由せず端末から直接引く
 * （Vercel の関数を挟むより速く、こちらの実行時間も使わない）。
 */
async function fetchTemperature(
  location: WeatherLocation,
  signal: AbortSignal,
): Promise<CurrentTemperature> {
  const url =
    "https://api.open-meteo.com/v1/forecast" +
    `?latitude=${location.latitude}&longitude=${location.longitude}` +
    "&current=temperature_2m&timezone=Asia%2FTokyo";

  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`Open-Meteo が ${response.status} を返しました`);
  }

  const data: unknown = await response.json();
  const celsius = (data as { current?: { temperature_2m?: unknown } })?.current?.temperature_2m;
  if (typeof celsius !== "number") {
    throw new Error("Open-Meteo の応答に気温が含まれていません");
  }
  return { locationId: location.id, celsius, fetchedAt: Date.now() };
}

/**
 * 値が無いか古ければ取り直す。取れなければ何もしない（古い値をそのまま出す）。
 * 取得に失敗しても画面に出さないのは、気温は作業の判断材料であって
 * エラーを見せても利用者にできることが無いため。
 */
export async function refreshTemperature(location: WeatherLocation, signal: AbortSignal) {
  const current = getFor(location.id);
  if (current && Date.now() - current.fetchedAt <= STALE_AFTER_MS) return;

  try {
    const value = await fetchTemperature(location, signal);
    writeCache(value);
    values.set(location.id, value);
    listeners.forEach((notify) => notify());
  } catch {
    // オフライン・API 障害。次の機会に取り直す。
  }
}

export { subscribe as subscribeTemperature, getFor as getTemperatureFor, getServerSnapshot as getServerTemperatureSnapshot };
