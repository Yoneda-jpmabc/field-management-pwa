"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
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
// これだけ動いたら、指が横向き・縦向きどちらの操作かを一度だけ決める。
const DIRECTION_LOCK_DISTANCE = 10;

/**
 * 確認・集計タブの本文を横スワイプで包み、左右スワイプで前後の期間へ
 * 移動できるようにする。
 *
 * Pointer Events + touch-action で試したところ、実機では指がわずかに
 * 縦へブレただけでブラウザがスクロールとしてジェスチャーを丸ごと奪い、
 * pointermove がほぼ届かないまま pointercancel になることがあった。
 * そのため、ここでは素の touchstart/touchmove/touchend を
 * addEventListener（passive:false）で直接つかみ、最初の 10px の動きで
 * 「これは横スワイプか、縦スクロールか」を自分で決める。横と決めたら
 * 以降の touchmove で preventDefault し、ブラウザに奪われる前に
 * ジェスチャーを確保する。縦と決めたら何もせず、ネイティブのスクロールに
 * そのまま任せる。
 *
 * React の合成タッチイベントは既定で passive のため、その onTouchMove
 * からは preventDefault が効かない（Chrome/Safari とも黙って無視される）。
 * だから ref 経由でネイティブに addEventListener している。
 */
export function SwipeableDateArea({ unit, anchor, basePath, children }: Props) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  // 前回描画時の anchor と比べて、新しい日付が「先」か「前」かを見る。
  // スワイプに限らず矢印タップや「今日に戻す」でも、新しい中身が来た側から
  // 軽くスライドインさせて、パキッと切り替わる感じを和らげる。
  const prevAnchor = useRef(anchor);
  const enterFrom =
    anchor === prevAnchor.current
      ? null
      : anchor > prevAnchor.current
        ? "right"
        : "left";
  useEffect(() => {
    prevAnchor.current = anchor;
  }, [anchor]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let direction: "horizontal" | "vertical" | null = null;

    const onTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      startX = lastX = touch.clientX;
      startY = touch.clientY;
      direction = null;
    };

    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      lastX = touch.clientX;
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;

      if (direction === null) {
        if (
          Math.abs(dx) < DIRECTION_LOCK_DISTANCE &&
          Math.abs(dy) < DIRECTION_LOCK_DISTANCE
        ) {
          return; // まだ判定できるほど動いていない。
        }
        direction = Math.abs(dx) > Math.abs(dy) ? "horizontal" : "vertical";
      }

      if (direction === "horizontal") {
        // 横スワイプと決まった後は、ブラウザに奪われる前に既定動作を止める。
        event.preventDefault();
      }
    };

    const onTouchEnd = () => {
      if (direction === "horizontal") {
        const dx = lastX - startX;
        if (Math.abs(dx) >= SWIPE_THRESHOLD) {
          // 左スワイプ＝次の期間へ、右スワイプ＝前の期間へ（カレンダーの慣習）。
          const delta = dx < 0 ? 1 : -1;
          router.push(
            `${basePath}?unit=${unit}&date=${shiftAnchor(unit, anchor, delta)}`,
          );
        }
      }
      direction = null;
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [router, unit, anchor, basePath]);

  return (
    // min-h: 中身が短い（実績なし等）ときもスワイプできる余地を画面下側に残す。
    // カードの外側の空白をタップしても反応しないという指摘への対応。
    <div ref={containerRef} className="min-h-[60dvh]">
      <div
        key={anchor}
        className={
          enterFrom === "right"
            ? "animate-[date-slide-in-from-right_0.22s_ease-out]"
            : enterFrom === "left"
              ? "animate-[date-slide-in-from-left_0.22s_ease-out]"
              : ""
        }
      >
        {children}
      </div>
    </div>
  );
}
