"use client";

import { useSyncExternalStore } from "react";
import { IconMoon, IconSun } from "./icons";

const STORAGE_KEY = "theme";
type Theme = "light" | "dark";

const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot(): Theme {
  return document.documentElement.getAttribute("data-theme") === "dark"
    ? "dark"
    : "light";
}

function getServerSnapshot(): Theme {
  return "light";
}

function setTheme(next: Theme) {
  document.documentElement.setAttribute("data-theme", next);
  window.localStorage.setItem(STORAGE_KEY, next);
  listeners.forEach((notify) => notify());
}

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const label = theme === "light" ? "ダークモードに切り替え" : "ライトモードに切り替え";

  return (
    <button
      type="button"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      aria-label={label}
      title={label}
      className={`control-focus flex items-center justify-center rounded-full border border-separator bg-surface text-foreground-secondary transition-colors hover:text-foreground ${
        compact ? "h-8 w-8" : "h-9 w-9"
      }`}
    >
      {theme === "light" ? (
        <IconMoon className="h-4 w-4" />
      ) : (
        <IconSun className="h-4 w-4" />
      )}
    </button>
  );
}
