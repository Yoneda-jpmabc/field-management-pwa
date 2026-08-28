"use client";

import { WEATHER_LOCATIONS, setLocationId, useLocationId } from "@/lib/weather/locations";

/**
 * ヘッダーに出す気温をどの地点で見るか。
 * 端末ごとの表示設定なので、テーマと同じくこの端末にだけ保存する。
 */
export function WeatherLocationSettings() {
  const locationId = useLocationId();

  return (
    <select
      value={locationId}
      onChange={(event) => setLocationId(event.target.value)}
      aria-label="気温を表示する地点"
      className="control-focus min-h-11 rounded-[10px] border border-separator-strong bg-surface px-3 text-[15px] text-foreground"
    >
      {WEATHER_LOCATIONS.map((location) => (
        <option key={location.id} value={location.id}>
          {location.label}
        </option>
      ))}
    </select>
  );
}
