"use client";

import { useSyncExternalStore } from "react";
import { DEFAULT_WEATHER_LOCATION_ID } from "@/lib/weather";

const STORAGE_KEY = "weather-location";

const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot(): string {
  return window.localStorage.getItem(STORAGE_KEY) ?? DEFAULT_WEATHER_LOCATION_ID;
}

function getServerSnapshot(): string {
  return DEFAULT_WEATHER_LOCATION_ID;
}

export function setWeatherLocation(id: string) {
  window.localStorage.setItem(STORAGE_KEY, id);
  listeners.forEach((notify) => notify());
}

export function useWeatherLocationId(): string {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
