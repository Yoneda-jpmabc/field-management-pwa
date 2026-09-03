import { type Permission } from "@/lib/auth/permissions";

export type NavItem = {
  href: string;
  label: string;
  icon: string;
  /**
   * 権限による出し分け。省略した項目は全員に出す。
   * ここで隠してもURLを直接叩けば到達できるため、ページ側でも必ず権限を見ること。
   *
   * 今はどの項目も全員に出している。閲覧のみの人に見せたくないのは
   * タブ単位ではなくタブの中身（実績の登録・集計）なので、絞り込みは
   * RecordsTabs とページ側で行っている。
   */
  isVisible?: (permission: Permission) => boolean;
};

export const navItems: NavItem[] = [
  { href: "/", label: "ホーム", icon: "square.grid.2x2" },
  { href: "/harvest", label: "収穫", icon: "basket" },
  { href: "/care", label: "管理", icon: "calendar.check" },
  // 作業記録は実績タブの「確認」に統合した（同じ work_records を見ていたため）。
  { href: "/records", label: "実績", icon: "report" },
  { href: "/settings", label: "設定", icon: "gearshape" },
];

export function visibleNavItems(permission: Permission): NavItem[] {
  return navItems.filter((item) => item.isVisible?.(permission) ?? true);
}
