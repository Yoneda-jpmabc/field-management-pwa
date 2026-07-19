export type NavItem = {
  href: string;
  label: string;
  icon: string;
};

export const navItems: NavItem[] = [
  { href: "/", label: "ダッシュボード", icon: "square.grid.2x2" },
  { href: "/fields", label: "圃場", icon: "leaf" },
  { href: "/logs", label: "作業記録", icon: "note.text" },
  { href: "/settings", label: "設定", icon: "gearshape" },
];
