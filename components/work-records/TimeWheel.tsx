"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 端末ごとに姿が変わるネイティブの `<input type="time">` の代わりに使う、
 * 自前の時刻ピッカー。iOS/Android/PC で同じ見た目・同じ操作になる。
 *
 * - 見た目はドラムロール。中央の枠が選択行。
 * - 操作は「見えている行をタップ」が主。スワイプでも動く。
 *   （iOS のホイールを回して合わせるのが面倒、という声への対応。）
 * - 時は 24 時間表記で 5〜22 時。先頭の「—」に合わせると未設定。
 * - 分は 00 / 30 のみ（実績は 30 分刻みで運用しているため）。
 *
 * 値は "HH:MM"（未設定は空文字）。
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

/** "HH:MM" → 各列の行番号。空文字・範囲外は未設定(0)。 */
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
  onPick: (index: number) => void;
  ariaLabel: string;
};

/**
 * ピッカー 1 列ぶん。行タップ（主）か、スワイプ後にスナップした位置で確定する。
 */
function Column({ items, index, onPick, ariaLabel }: ColumnProps) {
  const ref = useRef<HTMLDivElement>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // スワイプ中の見た目用。確定値（index）とは別に、指の位置に追従させる。
  const [active, setActive] = useState(index);

  const scrollToRow = (rowIndex: number) => {
    const el = ref.current;
    if (!el) return;
    const target = rowIndex * ROW;
    if (Math.abs(el.scrollTop - target) > 1) {
      el.scrollTo({ top: target });
    }
  };

  // 外から index が変わったら（行タップ・チップ・サイド切替・初期化）合わせる。
  useEffect(() => {
    setActive(index);
    scrollToRow(index);
  }, [index]);

  useEffect(
    () => () => {
      if (settleTimer.current) clearTimeout(settleTimer.current);
    },
    [],
  );

  // スワイプ用。止まった行を確定する。行タップのときは onClick 側で確定済み。
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
      if (Math.abs(settled.scrollTop - idx * ROW) > 1) {
        settled.scrollTo({ top: idx * ROW });
      }
      if (idx !== index) onPick(idx);
    }, 140);
  };

  return (
    <div
      ref={ref}
      role="listbox"
      aria-label={ariaLabel}
      onScroll={handleScroll}
      className="no-scrollbar snap-y snap-mandatory flex-1 overflow-y-auto overscroll-contain"
      style={{ height: ROW * VISIBLE_ROWS }}
    >
      {/* 上下 1 行ぶんの余白で、端の項目も中央に来られるようにする。 */}
      <ul style={{ paddingBlock: ROW }}>
        {items.map((item, itemIndex) => (
          <li key={item} role="option" aria-selected={itemIndex === index}>
            <button
              type="button"
              tabIndex={-1}
              onClick={() => onPick(itemIndex)}
              className={`flex w-full snap-center items-center justify-center text-[17px] tabular-nums transition-colors active:bg-surface-secondary ${
                itemIndex === active
                  ? "font-bold text-accent"
                  : "text-foreground-tertiary"
              }`}
              style={{ height: ROW }}
            >
              {item}
            </button>
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
  // 時・分は内部で持つ。片方を変えたとき、もう片方の最新値と組み直して
  // onChange する。value から都度計算すると、続けて操作したとき
  // 前の再レンダー前の値で上書きしてしまう。
  const [hour, setHour] = useState(() => toIndices(value).hour);
  const [minute, setMinute] = useState(() => toIndices(value).minute);
  const hourRef = useRef(hour);
  const minuteRef = useRef(minute);
  hourRef.current = hour;
  minuteRef.current = minute;

  // 自分が出した値以外で value が変わったら取り込む（チップ選択・サイド切替）。
  const lastEmitted = useRef(value);
  useEffect(() => {
    if (value === lastEmitted.current) return;
    lastEmitted.current = value;
    const next = toIndices(value);
    setHour(next.hour);
    setMinute(next.minute);
  }, [value]);

  const commit = () => {
    const next = toValue(hourRef.current, minuteRef.current);
    lastEmitted.current = next;
    onChange(next);
  };

  const pickHour = (next: number) => {
    hourRef.current = next;
    setHour(next);
    commit();
  };
  const pickMinute = (next: number) => {
    minuteRef.current = next;
    setMinute(next);
    commit();
  };

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
        onPick={pickHour}
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
        onPick={pickMinute}
        ariaLabel="分"
      />
    </div>
  );
}
