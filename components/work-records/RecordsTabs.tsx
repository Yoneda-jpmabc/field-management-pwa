"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  canEditRecords,
  canViewEveryone,
  type Permission,
} from "@/lib/auth/permissions";

/**
 * 実績タブ内の画面切り替え。
 *
 * 入力・確認・集計はコンポーネントを分けたうえで、この 1 か所だけで行き来させる。
 * 「確認」はかつての作業記録タブを兼ねるので、閲覧のみの人にも出す。
 * 入力用の「登録」と、全員分を横断して見る「集計」は権限で隠す。
 */
const tabs: {
  href: string;
  label: string;
  isVisible?: (permission: Permission) => boolean;
}[] = [
  { href: "/records", label: "登録", isVisible: canEditRecords },
  { href: "/records/list", label: "確認" },
  { href: "/records/summary", label: "集計", isVisible: canViewEveryone },
];

export function RecordsTabs({ permission }: { permission: Permission }) {
  const pathname = usePathname();
  const visible = tabs.filter((tab) => tab.isVisible?.(permission) ?? true);

  // 行き先が 1 つしか無いなら、切り替えの意味が無いので出さない。
  if (visible.length <= 1) return null;

  return (
    <div className="mb-5 flex gap-1 rounded-full bg-surface-secondary p-1">
      {visible.map((tab) => {
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
