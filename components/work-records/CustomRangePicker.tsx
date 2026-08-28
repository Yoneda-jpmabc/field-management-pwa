"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  basePath: string;
  defaultFrom: string;
  defaultTo: string;
  /** from/to をクエリに持つ状態で開かれたか。プリセットに戻すボタンの表示に使う。 */
  active: boolean;
};

/**
 * 日/週/月/年のプリセットに加えて、任意の開始日〜終了日で集計を確認するための入力欄。
 * 状態は URL クエリ（from/to）に持たせるので、他の期間切り替えと同じくリロード・共有できる。
 */
export function CustomRangePicker({
  basePath,
  defaultFrom,
  defaultTo,
  active,
}: Props) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(active);
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="control-focus mb-4 min-h-11 rounded-full px-1 text-sm font-medium text-accent transition-colors active:opacity-70"
      >
        期間を指定して確認する
      </button>
    );
  }

  const apply = () => {
    if (!from || !to) return;
    router.push(`${basePath}?from=${from}&to=${to}`);
  };

  const closeOrReset = () => {
    if (active) {
      router.push(basePath);
    } else {
      setExpanded(false);
    }
  };

  return (
    <div className="surface-card mb-4 p-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="mb-1.5 block text-sm text-foreground-secondary">
            開始日
          </span>
          <input
            type="date"
            value={from}
            max={to || undefined}
            onChange={(event) => setFrom(event.target.value)}
            className="control-focus min-h-12 rounded-[10px] border border-separator-strong bg-surface px-3 text-base text-foreground"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm text-foreground-secondary">
            終了日
          </span>
          <input
            type="date"
            value={to}
            min={from || undefined}
            onChange={(event) => setTo(event.target.value)}
            className="control-focus min-h-12 rounded-[10px] border border-separator-strong bg-surface px-3 text-base text-foreground"
          />
        </label>
        <button
          type="button"
          onClick={apply}
          disabled={!from || !to}
          className="control-focus min-h-12 rounded-full bg-accent px-5 text-[15px] font-medium text-accent-foreground transition-colors hover:bg-accent-hover active:bg-accent-hover disabled:opacity-50"
        >
          適用
        </button>
        <button
          type="button"
          onClick={closeOrReset}
          className="control-focus min-h-12 rounded-full border border-separator-strong px-5 text-[15px] font-medium text-foreground-secondary transition-colors active:bg-surface-secondary"
        >
          {active ? "プリセットに戻す" : "閉じる"}
        </button>
      </div>
    </div>
  );
}
