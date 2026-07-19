"use client";

import { useEffect, useState } from "react";
import { useWeatherLocationId } from "./weather-location-store";
import { describeWeatherCode, weatherLocations } from "@/lib/weather";
import { IconBolt, IconCloud, IconCloudRain, IconSnowflake, IconSun } from "./icons";

type WeatherData = {
  temperature: number | null;
  weatherCode: number | null;
  precipitationProbability: number | null;
  temperatureMax: number | null;
  temperatureMin: number | null;
};

type Result =
  | { locationId: string; status: "error" }
  | { locationId: string; status: "ready"; data: WeatherData };

const weatherIcons = {
  sun: IconSun,
  cloud: IconCloud,
  rain: IconCloudRain,
  snow: IconSnowflake,
  storm: IconBolt,
} as const;

export function WeatherBanner() {
  const locationId = useWeatherLocationId();
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/weather?location=${locationId}`)
      .then((res) => {
        if (!res.ok) throw new Error("weather_fetch_failed");
        return res.json();
      })
      .then((data: WeatherData) => {
        if (!cancelled) setResult({ locationId, status: "ready", data });
      })
      .catch(() => {
        if (!cancelled) setResult({ locationId, status: "error" });
      });

    return () => {
      cancelled = true;
    };
  }, [locationId]);

  const locationName =
    weatherLocations.find((loc) => loc.id === locationId)?.name ??
    weatherLocations[0].name;

  const isLoading = result === null || result.locationId !== locationId;

  if (isLoading) {
    return (
      <div className="surface-card mb-6 flex items-center gap-3 px-5 py-4 text-sm text-foreground-secondary">
        <IconCloud className="h-5 w-5 shrink-0 animate-pulse" />
        天気情報を取得中…
      </div>
    );
  }

  if (result.status === "error") {
    return (
      <div className="surface-card mb-6 flex items-center gap-3 px-5 py-4 text-sm text-foreground-secondary">
        <IconCloud className="h-5 w-5 shrink-0" />
        天気情報を取得できませんでした。オフラインの可能性があります。
      </div>
    );
  }

  const { label, icon } = describeWeatherCode(result.data.weatherCode);
  const WeatherIcon = weatherIcons[icon];

  return (
    <div className="surface-card mb-6 flex flex-wrap items-center justify-between gap-4 px-5 py-4">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
          <WeatherIcon className="h-6 w-6" />
        </span>
        <div>
          <p className="text-sm font-medium text-foreground-secondary">
            {locationName}の天気
          </p>
          <p className="text-[15px] font-semibold text-foreground">
            {label}
            {result.data.temperature !== null &&
              ` ・ ${Math.round(result.data.temperature)}℃`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-5 text-sm">
        <div className="text-right">
          <p className="text-foreground-tertiary">降水確率</p>
          <p className="font-mono text-[15px] font-semibold text-foreground">
            {result.data.precipitationProbability ?? "—"}%
          </p>
        </div>
        {result.data.temperatureMax !== null && result.data.temperatureMin !== null && (
          <div className="text-right">
            <p className="text-foreground-tertiary">最高 / 最低</p>
            <p className="font-mono text-[15px] font-semibold text-foreground">
              {Math.round(result.data.temperatureMax)}° / {Math.round(result.data.temperatureMin)}°
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
