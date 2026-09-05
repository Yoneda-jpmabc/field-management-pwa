"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "accent";
type Accent = "blue" | "orange" | "green";

// スウォッチに出す代表色。実際に選ばれたときのライトモードの --accent-l と同じ値にする。
const OPTIONS: { value: Accent; label: string; swatch: string }[] = [
  { value: "blue", label: "ブルー", swatch: "#1e51c4" },
  { value: "orange", label: "オレンジ", swatch: "#c2410c" },
  { value: "green", label: "グリーン", swatch: "#0c6b3f" },
];

const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot(): Accent {
  const value = document.documentElement.getAttribute("data-accent");
  return value === "blue" || value === "green" ? value : "orange";
}

/**
 * サーバーでは端末の設定が分からないため orange を返す。
 * 実際の初期値は layout.tsx のインラインスクリプトが localStorage から決めている。
 */
function getServerSnapshot(): Accent {
  return "orange";
}

function setAccent(next: Accent) {
  document.documentElement.setAttribute("data-accent", next);
  window.localStorage.setItem(STORAGE_KEY, next);
  listeners.forEach((notify) => notify());
}

export function AccentPicker() {
  const accent = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <div
      role="radiogroup"
      aria-label="アクセントカラー"
      className="flex items-center gap-2"
    >
      {OPTIONS.map((option) => {
        const selected = option.value === accent;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={option.label}
            title={option.label}
            onClick={() => setAccent(option.value)}
            className={`control-focus pressable flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-[outline] ${
              selected
                ? "outline outline-2 outline-offset-2 outline-foreground"
                : "outline outline-1 outline-offset-2 outline-transparent"
            }`}
            style={{ backgroundColor: option.swatch }}
          >
            {selected && (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 text-white"
              >
                <path d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        );
      })}
    </div>
  );
}
