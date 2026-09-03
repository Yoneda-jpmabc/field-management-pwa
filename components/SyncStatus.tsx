"use client";

import { useSyncExternalStore } from "react";
import { IconPower } from "./icons";

function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getSnapshot() {
  return navigator.onLine;
}

function getServerSnapshot() {
  return true;
}

const SIZES = {
  // モバイルヘッダーは天気アイコンと横並びにするので一回り小さく。押せるボタンではないので
  // 44px 下限（タップ領域のルール）の対象外。
  sm: { circle: "h-6 w-6", icon: "h-3.5 w-3.5" },
  md: { circle: "h-9 w-9", icon: "h-[18px] w-[18px]" },
} as const;

/**
 * 同期の接続状態。
 * 状態は電源マークの色で示す（オンライン=緑／オフライン=グレー）。
 * 文言を出すと狭い場所で折り返して読みにくくなるため、
 * 既定はアイコンだけにして、幅に余裕のあるサイドバーだけ showLabel でラベルを添える。
 */
export function SyncStatus({
  showLabel = false,
  size = "md",
}: {
  showLabel?: boolean;
  size?: keyof typeof SIZES;
}) {
  const online = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const label = online
    ? "オンライン: データは同期されています"
    : "オフライン: 変更はこの端末に保存されます";

  return (
    <div className="flex shrink-0 items-center gap-2" title={label}>
      <span
        aria-hidden
        className={`flex shrink-0 items-center justify-center rounded-full border transition-colors ${SIZES[size].circle} ${
          online
            ? "border-success/40 bg-success-bg text-success"
            : "border-separator-strong bg-surface-secondary text-foreground-tertiary"
        }`}
      >
        <IconPower className={SIZES[size].icon} />
      </span>
      {showLabel && (
        <span
          className={`whitespace-nowrap text-xs font-medium ${
            online ? "text-success" : "text-foreground-tertiary"
          }`}
        >
          {online ? "オンライン" : "オフライン"}
        </span>
      )}
      {/* 色だけでは伝わらないので、読み上げ用の文言も持たせる。 */}
      <span className="sr-only" role="status">
        {label}
      </span>
    </div>
  );
}
