"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "./nav-items";
import { IconGrid, IconLeaf, IconNote, IconSettings } from "../icons";
import { SyncStatus } from "../SyncStatus";

const icons = {
  "square.grid.2x2": IconGrid,
  leaf: IconLeaf,
  "note.text": IconNote,
  gearshape: IconSettings,
} as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-separator bg-surface md:flex">
      <div className="flex items-center gap-2.5 px-6 py-6">
        <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-accent text-accent-foreground">
          <IconLeaf className="h-[18px] w-[18px]" />
        </span>
        <span className="text-[17px] font-semibold tracking-tight text-foreground">
          圃場管理
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-3">
        {navItems.map((item) => {
          const Icon = icons[item.icon as keyof typeof icons];
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`control-focus flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[15px] font-medium transition-colors ${
                active
                  ? "bg-accent/10 text-accent"
                  : "text-foreground-secondary hover:bg-surface-secondary hover:text-foreground"
              }`}
            >
              <Icon className="h-[18px] w-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-separator px-4 py-4">
        <SyncStatus />
      </div>
    </aside>
  );
}
