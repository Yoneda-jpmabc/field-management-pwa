"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "./nav-items";
import {
  IconChecklist,
  IconGrid,
  IconLeaf,
  IconNote,
  IconSettings,
} from "../icons";

const icons = {
  "square.grid.2x2": IconGrid,
  leaf: IconLeaf,
  checklist: IconChecklist,
  "note.text": IconNote,
  gearshape: IconSettings,
} as const;

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-separator bg-surface/90 pb-[max(env(safe-area-inset-bottom),0.5rem)] backdrop-blur-lg md:hidden">
      {navItems.map((item) => {
        const Icon = icons[item.icon as keyof typeof icons];
        const active =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`control-focus flex flex-1 flex-col items-center gap-1 pt-2 pb-1 text-[11px] font-medium ${
              active ? "text-accent" : "text-foreground-tertiary"
            }`}
          >
            <Icon className="h-[22px] w-[22px]" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
