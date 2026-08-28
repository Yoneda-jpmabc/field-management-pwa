"use client";

import { useSyncExternalStore } from "react";

/**
 * ヘッダーに出す気温の観測地点。
 *
 * Open-Meteo は緯度経度でしか引けないので、選べる地点をここに固定で持つ。
 * 増やすときはこの配列に足すだけでよい（設定画面と保存値は id で紐づく）。
 *
 * TODO: 座標は市街地のおおよその位置で入れた暫定値。
 *   正確な座標が分かったら差し替えること。
 *   なお Open-Meteo の予報格子は約 11km 四方なので、
 *   近い地点どうしは同じ気温になることがある。
 */
export type WeatherLocation = {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
};

export const WEATHER_LOCATIONS: readonly WeatherLocation[] = [
  { id: "saitsu", label: "天草市佐伊津町", latitude: 32.479, longitude: 130.172 },
  { id: "honmachi", label: "天草市本町", latitude: 32.438, longitude: 130.238 },
  { id: "goryo", label: "天草市御領", latitude: 32.532, longitude: 130.279 },
];

export const DEFAULT_LOCATION_ID = WEATHER_LOCATIONS[0].id;

export function findLocation(id: string): WeatherLocation {
  return WEATHER_LOCATIONS.find((location) => location.id === id) ?? WEATHER_LOCATIONS[0];
}

const STORAGE_KEY = "weather-location";

/**
 * 選択中の地点。端末ごとの表示設定なので、テーマと同じく localStorage に置く。
 * ヘッダーと設定画面の両方が購読するので、モジュール内のリスナーで同期させる。
 */
const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function getSnapshot(): string {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved && WEATHER_LOCATIONS.some((location) => location.id === saved)) {
      return saved;
    }
  } catch {
    // プライベートブラウジング等で localStorage が読めない場合は既定値でよい。
  }
  return DEFAULT_LOCATION_ID;
}

/** サーバーでは端末の選択が分からないので既定の地点を返す。 */
function getServerSnapshot(): string {
  return DEFAULT_LOCATION_ID;
}

export function setLocationId(id: string) {
  try {
    window.localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // 保存できなくても、この画面が開いている間の表示は切り替える。
  }
  listeners.forEach((notify) => notify());
}

/**
 * 選択中の地点 id。
 * サーバー描画では既定の地点になり、ハイドレーション後に保存値へ切り替わる。
 */
export function useLocationId(): string {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
