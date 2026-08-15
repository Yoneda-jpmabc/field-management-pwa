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

/**
 * サーバーでは端末の設定が分からないため light を返す。
 * 実際の初期値は layout.tsx のインラインスクリプトが
 * localStorage → OS のダークモード の順で決めている。
 */

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
      className={`control-focus pressable flex shrink-0 items-center justify-center rounded-full border border-separator bg-surface text-foreground-secondary hover:text-foreground ${
        compact ? "h-10 w-10" : "h-11 w-11"
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
