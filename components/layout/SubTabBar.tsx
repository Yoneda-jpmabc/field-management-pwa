"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  canEditRecords,
  canViewEveryone,
  type Permission,
} from "@/lib/auth/permissions";

/**
 * タブの中をさらに切り替える帯。下部タブバーのすぐ上に固定で出す。
 *
 * 画面の一番上に置いていたが、片手で持つと親指が届かない。ここは
 * 「登録↔確認↔集計」のように何度も往復する場所なので、下部タブバーと
 * 同じ、指が自然に届く高さに置いている。
 *
 * AppShell（<main> の外）に置くことで、本文のスクロールとは無関係に
 * 1 ピクセルも動かない。本文側の sticky なボタンとも重ならない。
 */
type SubTab = {
  href: string;
  label: string;
  isVisible?: (permission: Permission) => boolean;
};

/**
 * 実績タブ内の画面切り替え。
 *
 * 「確認」はかつての作業記録タブを兼ねるので、閲覧のみの人にも出す。
 * 入力用の「登録」と、全員分を横断して見る「集計」は権限で隠す。
 */
const recordsTabs: SubTab[] = [
  { href: "/records", label: "登録", isVisible: canEditRecords },
  { href: "/records/list", label: "確認" },
  { href: "/records/summary", label: "集計", isVisible: canViewEveryone },
];

/** 収穫タブ内の画面切り替え。圃場ごとの現況と、日付順の履歴を行き来する。 */
const harvestTabs: SubTab[] = [
  { href: "/harvest", label: "圃場ごと" },
  { href: "/harvest/list", label: "収穫履歴" },
];

function tabsFor(pathname: string): SubTab[] {
  if (pathname.startsWith("/records")) return recordsTabs;
  if (pathname.startsWith("/harvest")) return harvestTabs;
  return [];
}

export function SubTabBar({ permission }: { permission: Permission }) {
  const pathname = usePathname();
  const visible = tabsFor(pathname).filter(
    (tab) => tab.isVisible?.(permission) ?? true,
  );

  // 行き先が 1 つしか無いなら、切り替えの意味が無いので帯ごと出さない。
  if (visible.length <= 1) return null;

  return (
    <nav className="z-20 shrink-0 bg-background px-4 py-2 md:px-10">
      <div className="mx-auto flex w-full max-w-5xl gap-1 rounded-full bg-surface-secondary p-1">
        {visible.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`control-focus flex min-h-11 flex-1 items-center justify-center rounded-full text-[15px] font-medium transition-colors ${
                active
                  ? "bg-surface text-foreground"
                  : "text-foreground-secondary hover:text-foreground active:bg-surface/60"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
