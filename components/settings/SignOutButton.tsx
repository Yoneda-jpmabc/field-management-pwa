"use client";

import { useState, useTransition } from "react";
import { signOut } from "@/lib/auth/actions";

/**
 * ログアウト。共用端末で人が入れ替わる想定なので、設定タブから常に押せるところに置く。
 * 押し間違いで別の人の記録を書き始めてしまわないよう、一度確認を挟む
 * （確認の出し方はシート類の削除ボタンに合わせて、その場で文言を差し替える形）。
 */
export function SignOutButton() {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="control-focus min-h-11 rounded-full border border-danger/40 px-5 text-[15px] font-medium text-danger transition-colors active:bg-danger-bg"
      >
        ログアウト
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setConfirming(false)}
        disabled={pending}
        className="control-focus min-h-11 rounded-full border border-separator-strong px-5 text-[15px] font-medium text-foreground transition-colors disabled:opacity-50"
      >
        やめる
      </button>
      <button
        type="button"
        onClick={() => startTransition(async () => void (await signOut()))}
        disabled={pending}
        className="control-focus min-h-11 rounded-full bg-danger px-5 text-[15px] font-medium text-white transition-colors active:opacity-80 disabled:opacity-50"
      >
        {pending ? "ログアウト中…" : "ログアウトする"}
      </button>
    </div>
  );
}
