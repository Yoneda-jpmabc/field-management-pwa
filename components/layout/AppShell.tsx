import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { BottomTabBar } from "./BottomTabBar";
import { SubTabBar } from "./SubTabBar";
import { MobileHeader } from "./MobileHeader";
import { PreviewBanner } from "./PreviewBanner";
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
  previewing = false,
  children,
}: {
  /** 画面が従う権限。権限プレビュー中は、確認したい方の権限が入る。 */
  permission: Permission;
  /** 権限プレビュー中か。true なら本文の上に確認中の帯を出す。 */
  previewing?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar permission={permission} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <MobileHeader />
        {previewing && <PreviewBanner permission={permission} />}
        <main
          id="app-scroll"
          className="app-scroll flex-1 overflow-y-auto overscroll-contain px-4 pt-6 pb-8 md:px-10 md:pt-10 md:pb-10"
        >
          <ScrollReset />
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
        <SubTabBar permission={permission} />
        <BottomTabBar permission={permission} />
      </div>
    </div>
  );
}
