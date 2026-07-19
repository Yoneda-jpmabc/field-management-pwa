"use client";

import { weatherLocations } from "@/lib/weather";
import { setWeatherLocation, useWeatherLocationId } from "../weather-location-store";

export function LocationPicker() {
  const current = useWeatherLocationId();

  return (
    <div className="flex flex-wrap gap-2">
      {weatherLocations.map((loc) => {
        const active = loc.id === current;
        return (
          <button
            key={loc.id}
            type="button"
            onClick={() => setWeatherLocation(loc.id)}
            aria-pressed={active}
            className={`control-focus rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
              active
                ? "border-accent bg-accent text-accent-foreground"
                : "border-separator bg-surface text-foreground-secondary hover:text-foreground"
            }`}
          >
            {loc.name}
          </button>
        );
      })}
    </div>
  );
}
