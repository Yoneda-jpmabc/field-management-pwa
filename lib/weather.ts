export type WeatherLocation = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
};

// Coordinates verified against Open-Meteo / OpenStreetMap geocoding (2026-07-19).
export const weatherLocations: WeatherLocation[] = [
  { id: "saitsu", name: "佐伊津町", latitude: 32.4894, longitude: 130.18413 },
  { id: "itsuwa", name: "五和町", latitude: 32.520851, longitude: 130.178144 },
  { id: "honmachi", name: "本町", latitude: 32.467447, longitude: 130.13397 },
];

export const DEFAULT_WEATHER_LOCATION_ID = weatherLocations[0].id;

export function findWeatherLocation(id: string | null | undefined): WeatherLocation {
  return weatherLocations.find((loc) => loc.id === id) ?? weatherLocations[0];
}

export type WeatherIconKind = "sun" | "cloud" | "rain" | "snow" | "storm";

const WMO_RAIN_CODES = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82]);
const WMO_SNOW_CODES = new Set([71, 73, 75, 77, 85, 86]);
const WMO_STORM_CODES = new Set([95, 96, 99]);

export function describeWeatherCode(
  code: number | null,
): { label: string; icon: WeatherIconKind } {
  if (code === null) return { label: "不明", icon: "cloud" };
  if (code === 0) return { label: "快晴", icon: "sun" };
  if (code === 1 || code === 2) return { label: "晴れ", icon: "sun" };
  if (code === 3) return { label: "くもり", icon: "cloud" };
  if (code === 45 || code === 48) return { label: "霧", icon: "cloud" };
  if (WMO_RAIN_CODES.has(code)) return { label: "雨", icon: "rain" };
  if (WMO_SNOW_CODES.has(code)) return { label: "雪", icon: "snow" };
  if (WMO_STORM_CODES.has(code)) return { label: "雷雨", icon: "storm" };
  return { label: "不明", icon: "cloud" };
}
