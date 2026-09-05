"use client";

import { useRef } from "react";
import type { PointerEvent, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { shiftAnchor, type PeriodUnit } from "@/lib/work-records/period";

type Props = {
  unit: PeriodUnit;
  anchor: string;
  /** 期間クエリを付けて遷移する先。確認タブと集計タブで共用する。 */
  basePath: string;
  children: ReactNode;
};

// これ未満の横移動は指が少し動いただけとみなし、スワイプ扱いしない。
const SWIPE_THRESHOLD = 60;
// 縦方向にこれ以上動いていたら、リストのスクロール操作とみなして無視する。
const VERTICAL_TOLERANCE = 50;

/**
 * 確認・集計タブの本文を横スワイプで包み、左右スワイプで前後の期間へ
 * 移動できるようにする。指の動きを見た目で追わせるカルーセルではなく、
 * しきい値を超えたスワイプを検知したら PeriodSwitcher の矢印と同じ
 * 遷移を起こすだけの、軽量なジェスチャー入口。
 */
export function SwipeableDateArea({ unit, anchor, basePath, children }: Props) {
  const router = useRouter();
  const start = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    // マウスは左ボタンのドラッグだけ拾う（右クリックや中クリックは無視）。
    if (event.pointerType === "mouse" && event.button !== 0) return;
    start.current = { x: event.clientX, y: event.clientY };
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const origin = start.current;
    start.current = null;
    if (!origin) return;

    const dx = event.clientX - origin.x;
    const dy = event.clientY - origin.y;
    if (Math.abs(dy) > VERTICAL_TOLERANCE) return; // 縦スクロール中は無視。
    if (Math.abs(dx) < SWIPE_THRESHOLD) return;

    // 左スワイプ＝次の期間へ、右スワイプ＝前の期間へ（カレンダーの慣習に合わせる）。
    const delta = dx < 0 ? 1 : -1;
    router.push(
      `${basePath}?unit=${unit}&date=${shiftAnchor(unit, anchor, delta)}`,
    );
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        start.current = null;
      }}
      // pan-y: 縦スクロールはブラウザに任せたまま、横方向の指の動きだけ拾う。
      className="touch-pan-y"
    >
      {children}
    </div>
  );
}
