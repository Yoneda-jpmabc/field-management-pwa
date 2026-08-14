"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * 実績タブ内の画面切り替え。
 * 入力・確認・集計はコンポーネントを分けたうえで、この 1 か所だけで行き来させる。
 */
const tabs = [
  { href: "/records", label: "登録" },
  { href: "/records/list", label: "確認" },
  { href: "/records/summary", label: "集計" },
];

export function RecordsTabs() {
  const pathname = usePathname();

  return (
    <div className="mb-5 flex gap-1 rounded-full bg-surface-secondary p-1">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`control-focus flex min-h-11 flex-1 items-center justify-center rounded-full text-sm font-medium transition-colors ${
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
