import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { findCurrentWorker } from "@/lib/auth/session";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "ログイン｜圃場管理アプリ" };

// セッションの有無で出し分けるので、キャッシュさせない。
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  // ログイン済みならアプリへ戻す。
  //
  // ここで見るのは auth のセッションではなく作業者。auth アカウントは生きて
  // いるのに workers 側が無効、という人をアプリへ通すと (app)/layout.tsx に
  // 弾かれてここへ戻され、堂々巡りになる。作業者として無効な人には
  // ログイン画面を出し、もう一度ログインしてもらってエラーを見せる。
  if (await findCurrentWorker()) redirect("/");

  return (
    <main className="flex min-h-dvh flex-col justify-center px-6 py-12">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8">
          <h1 className="text-[28px] font-semibold tracking-tight text-foreground">
            圃場管理アプリ
          </h1>
          <p className="mt-1 text-[15px] text-foreground-secondary">
            配布されたログインIDでログインしてください。
          </p>
        </div>

        <div className="surface-card p-5">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
