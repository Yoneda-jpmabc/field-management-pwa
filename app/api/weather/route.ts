import { NextRequest, NextResponse } from "next/server";
import { findWeatherLocation } from "@/lib/weather";

type OpenMeteoResponse = {
  current_weather?: {
    temperature: number;
    weathercode: number;
    time: string;
  };
  daily?: {
    precipitation_probability_max?: number[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
  };
};

export async function GET(request: NextRequest) {
  const location = findWeatherLocation(request.nextUrl.searchParams.get("location"));

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(location.latitude));
  url.searchParams.set("longitude", String(location.longitude));
  url.searchParams.set("current_weather", "true");
  url.searchParams.set(
    "daily",
    "precipitation_probability_max,temperature_2m_max,temperature_2m_min",
  );
  url.searchParams.set("timezone", "Asia/Tokyo");
  url.searchParams.set("forecast_days", "1");

  let response: Response;
  try {
    response = await fetch(url, { cache: "no-store" });
  } catch {
    return NextResponse.json({ error: "weather_fetch_failed" }, { status: 502 });
  }

  if (!response.ok) {
    return NextResponse.json({ error: "weather_fetch_failed" }, { status: 502 });
  }

  const data: OpenMeteoResponse = await response.json();

  return NextResponse.json({
    locationId: location.id,
    locationName: location.name,
    temperature: data.current_weather?.temperature ?? null,
    weatherCode: data.current_weather?.weathercode ?? null,
    precipitationProbability: data.daily?.precipitation_probability_max?.[0] ?? null,
    temperatureMax: data.daily?.temperature_2m_max?.[0] ?? null,
    temperatureMin: data.daily?.temperature_2m_min?.[0] ?? null,
    observedAt: data.current_weather?.time ?? null,
  });
}
