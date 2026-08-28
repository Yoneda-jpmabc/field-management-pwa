import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { BottomTabBar } from "./BottomTabBar";
import { MobileHeader } from "./MobileHeader";
import { ScrollReset } from "./ScrollReset";
import type { Permission } from "@/lib/auth/permissions";

/**
 * 画面全体は絶対にスクロールさせず、本文の <main> だけをスクロールさせる。
 *
 * ページごとスクロールさせると、モバイルブラウザの URL バーが伸縮するたびに
 * ビューポートの高さが変わり、position:fixed の下部タブバーがスクロール中に
 * ずり上がって見える。本文だけを動かせば URL バーは開いたまま動かないので、
 * タブバーはレイアウト上の一要素として1ピクセルも動かない。
 */
export function AppShell({
  permission,
  children,
}: {
  permission: Permission;
  children: ReactNode;
}) {
  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar permission={permission} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <MobileHeader />
        <main
          id="app-scroll"
          className="app-scroll flex-1 overflow-y-auto overscroll-contain px-4 pt-6 pb-8 md:px-10 md:pt-10 md:pb-10"
        >
          <ScrollReset />
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
        <BottomTabBar permission={permission} />
      </div>
    </div>
  );
}
