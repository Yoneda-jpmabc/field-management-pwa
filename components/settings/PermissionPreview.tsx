"use client";

import { useTransition } from "react";
import { setPreviewPermission } from "@/lib/auth/actions";
import {
  PERMISSIONS,
  PERMISSION_LABELS,
  type Permission,
} from "@/lib/auth/permissions";

/**
 * 権限の見え方を切り替えて確認する。全権限の人にだけ出す。
 *
 * 変わるのは画面の出し分けと Server Action の権限確認まで。
 * 実際のデータの許可（RLS）は本人のままなので、確認中に書き込みが
 * 通ってしまうことはあっても、権限が増えることはない。
 */
export function PermissionPreview({ current }: { current: Permission }) {
  const [pending, startTransition] = useTransition();

  return (
    <div
      role="group"
      aria-label="権限の見え方"
      className="flex gap-1 rounded-full bg-surface-secondary p-1"
    >
      {PERMISSIONS.map((permission) => {
        const active = permission === current;
        return (
          <button
            key={permission}
            type="button"
            disabled={pending}
            aria-pressed={active}
            onClick={() =>
              startTransition(async () => {
                await setPreviewPermission(
                  permission === "all" ? null : permission,
                );
              })
            }
            className={`control-focus flex min-h-11 flex-1 items-center justify-center rounded-full px-3 text-[15px] font-medium whitespace-nowrap transition-colors disabled:opacity-50 ${
              active
                ? "bg-surface text-foreground"
                : "text-foreground-secondary hover:text-foreground active:bg-surface/60"
            }`}
          >
            {PERMISSION_LABELS[permission]}
          </button>
        );
      })}
    </div>
  );
}
