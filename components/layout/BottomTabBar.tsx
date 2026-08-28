"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { visibleNavItems } from "./nav-items";
import type { Permission } from "@/lib/auth/permissions";
import {
  IconBasket,
  IconCalendarCheck,
  IconChecklist,
  IconGrid,
  IconSettings,
} from "../icons";

const icons = {
  "square.grid.2x2": IconGrid,
  basket: IconBasket,
  "calendar.check": IconCalendarCheck,
  checklist: IconChecklist,
  gearshape: IconSettings,
} as const;

export function BottomTabBar({ permission }: { permission: Permission }) {
  const pathname = usePathname();
  const items = visibleNavItems(permission);

  return (
    <nav className="z-20 flex shrink-0 border-t border-separator bg-surface pb-[max(env(safe-area-inset-bottom),0.5rem)] md:hidden">
      {items.map((item) => {
        const Icon = icons[item.icon as keyof typeof icons];
        const active =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`control-focus flex flex-1 flex-col items-center gap-1 pt-2 pb-1 text-[11px] font-medium transition-colors ${
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
