import { canViewEveryone, type Permission } from "@/lib/auth/permissions";

export type NavItem = {
  href: string;
  label: string;
  icon: string;
  /**
   * 権限による出し分け。省略した項目は全員に出す。
   * ここで隠しても直接URLを叩けば到達できるため、ページ側でも必ず権限を見ること。
   */
  isVisible?: (permission: Permission) => boolean;
};

export const navItems: NavItem[] = [
  { href: "/", label: "ダッシュボード", icon: "square.grid.2x2" },
  { href: "/harvest", label: "収穫", icon: "basket" },
  { href: "/care", label: "管理", icon: "calendar.check" },
  // 実績は全員分の入力・集計を扱う画面なので、閲覧のみの人には出さない。
  {
    href: "/records",
    label: "実績",
    icon: "checklist",
    isVisible: canViewEveryone,
  },
  { href: "/logs", label: "作業記録", icon: "note.text" },
  { href: "/settings", label: "設定", icon: "gearshape" },
];

export function visibleNavItems(permission: Permission): NavItem[] {
  return navItems.filter((item) => item.isVisible?.(permission) ?? true);
}
