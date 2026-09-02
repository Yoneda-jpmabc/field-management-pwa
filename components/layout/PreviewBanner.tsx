"use client";

import { useTransition } from "react";
import { setPreviewPermission } from "@/lib/auth/actions";
import { PERMISSION_LABELS, type Permission } from "@/lib/auth/permissions";

/**
 * 権限プレビュー中であることの表示。プレビュー中だけ全画面の上に出す。
 *
 * 確認中は登録・編集のボタンが消えるので、これが無いと「壊れた」と
 * 見分けがつかない。どのタブからでも解除できるよう、設定タブではなく
 * AppShell に置いている。
 */
export function PreviewBanner({ permission }: { permission: Permission }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="z-20 flex shrink-0 items-center justify-center gap-3 bg-warning-bg px-4 py-2 text-warning">
      <p className="min-w-0 truncate text-[13px] font-medium">
        「{PERMISSION_LABELS[permission]}」の見え方を確認中
      </p>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(async () => setPreviewPermission(null))}
        className="control-focus shrink-0 rounded-full border border-warning/40 px-3 py-1 text-[13px] font-medium transition-colors active:opacity-80 disabled:opacity-50"
      >
        {pending ? "解除中…" : "解除"}
      </button>
    </div>
  );
}
