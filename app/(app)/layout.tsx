import { AppShell } from "@/components/layout/AppShell";
import { getCurrentWorker } from "@/lib/auth/session";

/**
 * ログインが要る画面すべての親。
 *
 * ここで getCurrentWorker() を呼ぶことが、この配下を守る本体になっている。
 * proxy.ts のリダイレクトはリクエストを早く弾くためのもので、Cookie を
 * 見ているだけなので、それだけを頼りにはしない（作業者が無効化された、
 * workers の行が消えた、といった判定はここでしかできない）。
 *
 * ログインしていなければ getCurrentWorker() の中で /login へ飛ぶ。
 */
export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // ナビゲーションの出し分けに権限が要るので、ここで引く。
  // 同じリクエスト内の各ページからの呼び出しは React の cache で共有される。
  const { permission } = await getCurrentWorker();

  return <AppShell permission={permission}>{children}</AppShell>;
}
