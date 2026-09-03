"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 端末ごとに姿が変わるネイティブの `<input type="time">` の代わりに使う、
 * 自前のドラムロール式ピッカー。iOS/Android/PC で同じ見た目・同じ操作になる。
 *
 * - 時は 24 時間表記で 5〜22 時。先頭に「—」を置き、そこに合わせると未設定。
 * - 分は 00 / 30 のみ（実績は 30 分刻みで運用しているため）。
 *
 * 値は "HH:MM"（未設定は空文字）。よく使う時刻チップから値を差し込むと、
 * こちら側もその行までスクロールして揃う。
 */

const ROW = 44; // px。1 行の高さ＝タップ領域。globals の高さ規約に合わせる。
const VISIBLE_ROWS = 3;
const MIN_HOUR = 5;
const MAX_HOUR = 22;
const MINUTE_ITEMS = ["00", "30"] as const;

const HOUR_ITEMS: string[] = [
  "—",
  ...Array.from({ length: MAX_HOUR - MIN_HOUR + 1 }, (_, i) =>
    String(MIN_HOUR + i),
  ),
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/** "HH:MM" → 各ホイールの行番号。空文字・範囲外は未設定(0)。 */
function toIndices(value: string): { hour: number; minute: number } {
  const matched = /^(\d{2}):(\d{2})$/.exec(value);
  if (!matched) return { hour: 0, minute: 0 };
  const hour = Number(matched[1]);
  const hourIndex =
    hour >= MIN_HOUR && hour <= MAX_HOUR ? hour - MIN_HOUR + 1 : 0;
  const minuteIndex = matched[2] === "30" ? 1 : 0;
  return { hour: hourIndex, minute: minuteIndex };
}

/** 行番号 → "HH:MM"。時が未設定(0)なら空文字。 */
function toValue(hourIndex: number, minuteIndex: number): string {
  if (hourIndex <= 0) return "";
  return `${pad2(MIN_HOUR + hourIndex - 1)}:${MINUTE_ITEMS[minuteIndex] ?? "00"}`;
}

type ColumnProps = {
  items: readonly string[];
  index: number;
  onSettle: (index: number) => void;
  ariaLabel: string;
};

/** ホイール 1 列ぶん。スクロールが止まった位置の行を確定する。 */
function Column({ items, index, onSettle, ariaLabel }: ColumnProps) {
  const ref = useRef<HTMLDivElement>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstRun = useRef(true);
  const [active, setActive] = useState(index);

  // 外から index が変わったら（チップ選択・初期化など）その行へ寄せる。
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setActive(index);
    const target = index * ROW;
    if (Math.abs(el.scrollTop - target) > 1) {
      el.scrollTo({ top: target, behavior: firstRun.current ? "auto" : "smooth" });
    }
    firstRun.current = false;
  }, [index]);

  useEffect(
    () => () => {
      if (settleTimer.current) clearTimeout(settleTimer.current);
    },
    [],
  );

  const handleScroll = () => {
    const el = ref.current;
    if (!el) return;
    const next = clamp(Math.round(el.scrollTop / ROW), 0, items.length - 1);
    setActive(next);

    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      const settled = ref.current;
      if (!settled) return;
      const idx = clamp(
        Math.round(settled.scrollTop / ROW),
        0,
        items.length - 1,
      );
      // 慣性で半端に止まることがあるので、行にぴったり合わせ直す。
      if (Math.abs(settled.scrollTop - idx * ROW) > 1) {
        settled.scrollTo({ top: idx * ROW, behavior: "smooth" });
      }
      onSettle(idx);
    }, 140);
  };

  const nudge = (delta: number) => {
    const el = ref.current;
    if (!el) return;
    const idx = clamp(active + delta, 0, items.length - 1);
    el.scrollTo({ top: idx * ROW, behavior: "smooth" }); // 確定は scroll 経由。
  };

  return (
    <div
      ref={ref}
      role="listbox"
      aria-label={ariaLabel}
      tabIndex={0}
      onScroll={handleScroll}
      onKeyDown={(event) => {
        if (event.key === "ArrowUp") {
          event.preventDefault();
          nudge(-1);
        } else if (event.key === "ArrowDown") {
          event.preventDefault();
          nudge(1);
        }
      }}
      className="no-scrollbar snap-y snap-mandatory flex-1 overflow-y-auto overscroll-contain scroll-smooth outline-none focus-visible:bg-surface-secondary"
      style={{ height: ROW * VISIBLE_ROWS }}
    >
      {/* 上下 1 行ぶんの余白で、端の項目も中央に来られるようにする。 */}
      <ul style={{ paddingBlock: ROW }}>
        {items.map((item, itemIndex) => (
          <li
            key={item}
            role="option"
            aria-selected={itemIndex === active}
            className={`flex snap-center items-center justify-center text-[17px] tabular-nums transition-colors ${
              itemIndex === active
                ? "font-bold text-accent"
                : "text-foreground-tertiary"
            }`}
            style={{ height: ROW }}
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

type Props = {
  /** "HH:MM"。未設定は空文字。 */
  value: string;
  onChange: (value: string) => void;
};

export function TimeWheel({ value, onChange }: Props) {
  const { hour, minute } = toIndices(value);

  return (
    <div
      className="relative flex max-w-[240px] overflow-hidden rounded-[10px] border border-separator-strong bg-surface"
      style={{ height: ROW * VISIBLE_ROWS }}
    >
      {/* 中央の選択行を囲む枠。数字は上下の罫線の間に来るので隠れない。 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 z-20 border-y border-separator-strong"
        style={{ top: ROW, height: ROW }}
      />
      <Column
        items={HOUR_ITEMS}
        index={hour}
        onSettle={(next) => onChange(toValue(next, minute))}
        ariaLabel="時"
      />
      <div
        aria-hidden
        className="z-20 flex w-3 items-center justify-center text-[17px] text-foreground-tertiary"
      >
        :
      </div>
      <Column
        items={MINUTE_ITEMS}
        index={minute}
        onSettle={(next) => onChange(toValue(hour, next))}
        ariaLabel="分"
      />
    </div>
  );
}
