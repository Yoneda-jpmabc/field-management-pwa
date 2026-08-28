"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";

type Props = {
  title: string;
  onClose: () => void;
  /** 通信中は背景タップと「閉じる」を無効化して、二重操作を防ぐ。 */
  busy?: boolean;
  /** 下端に固定する操作ボタン群。 */
  footer: ReactNode;
  children: ReactNode;
};

/**
 * スマホの片手操作を前提にしたボトムシート。
 * 実績の編集と作業予定の編集で共用する。
 */
export function BottomSheet({
  title,
  onClose,
  busy = false,
  footer,
  children,
}: Props) {
  // シート表示中は背面のスクロールを止める（iOS Safari のスクロール抜け対策）。
  useEffect(() => {
    const scroller = document.getElementById("app-scroll");
    if (!scroller) return;
    const previous = scroller.style.overflow;
    scroller.style.overflow = "hidden";
    return () => {
      scroller.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, busy]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        type="button"
        aria-label="閉じる"
        onClick={() => !busy && onClose()}
        className="absolute inset-0 animate-[backdrop-in_0.2s_ease-out] bg-black/40"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative flex max-h-[88dvh] w-full max-w-lg animate-[sheet-in_0.25s_ease-out] flex-col rounded-t-[20px] bg-surface shadow-[var(--shadow-elevated)]"
      >
        <div className="relative flex shrink-0 items-center justify-between px-5 pt-3 pb-2">
          <div
            aria-hidden
            className="absolute left-1/2 top-2 h-1 w-9 -translate-x-1/2 rounded-full bg-separator-strong"
          />
          <h2 className="pt-2 text-[17px] font-semibold text-foreground">
            {title}
          </h2>
          <button
            type="button"
            onClick={() => !busy && onClose()}
            className="control-focus -mr-2 flex min-h-11 min-w-11 items-center justify-center rounded-full text-sm text-foreground-secondary active:bg-surface-secondary"
          >
            閉じる
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-5">
          {children}
        </div>

        <div className="shrink-0 border-t border-separator px-5 pt-3 pb-[max(env(safe-area-inset-bottom),1rem)]">
          {footer}
        </div>
      </div>
    </div>
  );
}

/** シート内の見出し付きブロック。 */
export function SheetSection({
  title,
  required,
  children,
}: {
  title: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold text-foreground">
        {title}
        {required && <span className="ml-1.5 text-xs text-danger">必須</span>}
      </h3>
      {children}
    </section>
  );
}

/** シート内の選択チップ。タップ領域は 44px 以上を確保する。 */
export function SheetChip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`control-focus min-h-11 rounded-full border px-4 text-[15px] transition-colors ${
        selected
          ? "border-accent bg-accent text-accent-foreground"
          : "border-separator-strong text-foreground active:bg-surface-secondary"
      }`}
    >
      {children}
    </button>
  );
}
