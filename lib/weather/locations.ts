"use client";

import { useSyncExternalStore } from "react";

/**
 * ヘッダーに出す天気の観測地点。
 *
 * Open-Meteo は緯度経度でしか引けないので、選べる地点をここに固定で持つ。
 * 増やすときはこの配列に足すだけでよい（設定画面と保存値は id で紐づく）。
 * 座標は度分秒で受け取ったものを十進度へ直した値（コメントに元の値を残す）。
 */
export type WeatherLocation = {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
};

export const WEATHER_LOCATIONS: readonly WeatherLocation[] = [
  // 32°28'54.4"N 130°10'32.3"E
  { id: "saitsu", label: "天草市佐伊津町", latitude: 32.4818, longitude: 130.1756 },
  // 32°28'13.7"N 130°09'55.4"E
  { id: "honmachi", label: "天草市本町", latitude: 32.4705, longitude: 130.1654 },
  // 32°31'09.4"N 130°11'25.3"E
  { id: "goryo", label: "天草市御領", latitude: 32.5193, longitude: 130.1904 },
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
