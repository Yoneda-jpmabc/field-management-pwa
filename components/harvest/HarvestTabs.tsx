"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * 収穫タブ内の画面切り替え。
 * 圃場ごとの現況（作付と累計）と、日付順の収穫履歴を行き来する。
 */
const tabs = [
  { href: "/harvest", label: "圃場ごと" },
  { href: "/harvest/list", label: "収穫履歴" },
];

export function HarvestTabs() {
  const pathname = usePathname();

  return (
    <div className="mb-5 flex gap-1 rounded-full bg-surface-secondary p-1">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`control-focus flex min-h-11 flex-1 items-center justify-center rounded-full text-[15px] font-medium transition-colors ${
              active
                ? "bg-surface text-foreground shadow-[var(--shadow-card)]"
                : "text-foreground-secondary hover:text-foreground active:bg-surface/60"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
