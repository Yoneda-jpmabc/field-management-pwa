import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { BottomTabBar } from "./BottomTabBar";
import { MobileHeader } from "./MobileHeader";
import type { SessionWorker } from "@/lib/auth/session";

export function AppShell({
  worker,
  children,
}: {
  worker: SessionWorker | null;
  children: ReactNode;
}) {
  // 未ログイン（ログイン画面）ではナビゲーションを出さない。
  // どこへも行けない状態でタブだけ並んでいても意味がないため。
  if (!worker) return <>{children}</>;

  return (
    <div className="flex min-h-dvh">
      <Sidebar worker={worker} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileHeader worker={worker} />
        {/* 下余白は pb-tabbar が持つので py-* は使わない（utilities が components に勝ち、上書きされるため） */}
        <main className="pb-tabbar flex-1 px-4 pt-6 md:px-10 md:pt-10">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
        <BottomTabBar permission={worker.permission} />
      </div>
    </div>
  );
}
