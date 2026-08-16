"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Badge } from "@/components/ui/Badge";
import {
  changePin,
  signOut,
  CHANGE_PIN_INITIAL_STATE,
} from "@/lib/auth/actions";
import {
  PERMISSION_DESCRIPTIONS,
  PERMISSION_LABELS,
  type Permission,
} from "@/lib/auth/permissions";

type Props = {
  name: string;
  loginId: string | null;
  permission: Permission;
};

const inputClass =
  "control-focus min-h-12 w-full rounded-[10px] border border-separator-strong bg-surface px-3 text-base text-foreground placeholder:text-foreground-tertiary";

function PinSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="control-focus pressable min-h-12 w-full rounded-full bg-accent text-[15px] font-medium text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-50"
    >
      {pending ? "変更中…" : "暗証番号を変更"}
    </button>
  );
}

function SignOutButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="control-focus pressable min-h-11 rounded-full border border-separator-strong px-5 text-sm font-medium text-foreground-secondary transition-colors active:bg-surface-secondary disabled:opacity-50"
    >
      {pending ? "ログアウト中…" : "ログアウト"}
    </button>
  );
}

/**
 * 誰でログインしているか・何ができるかを示し、暗証番号の変更とログアウトを行う。
 * 共用端末での入力を想定しているので、名前と権限は常に見える位置に出す。
 */
export function AccountPanel({ name, loginId, permission }: Props) {
  const [state, formAction] = useActionState(
    changePin,
    CHANGE_PIN_INITIAL_STATE,
  );
  const [showPinForm, setShowPinForm] = useState(false);

  return (
    <div className="flex flex-col gap-4 px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[17px] font-semibold text-foreground">{name}</p>
            <Badge tone={permission === "all" ? "accent" : "neutral"}>
              {PERMISSION_LABELS[permission]}
            </Badge>
          </div>
          <p className="mt-0.5 font-mono text-sm text-foreground-tertiary">
            {loginId ?? "ログインID未設定"}
          </p>
        </div>
        <form action={signOut}>
          <SignOutButton />
        </form>
      </div>

      <p className="text-sm text-foreground-secondary">
        {PERMISSION_DESCRIPTIONS[permission]}
      </p>

      {showPinForm ? (
        <form action={formAction} className="flex flex-col gap-3">
          <div>
            <label
              htmlFor="currentPin"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              今の暗証番号
            </label>
            <input
              id="currentPin"
              name="currentPin"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="current-password"
              required
              className={`${inputClass} tracking-[0.3em]`}
            />
          </div>
          <div>
            <label
              htmlFor="newPin"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              新しい暗証番号（数字4〜12桁）
            </label>
            <input
              id="newPin"
              name="newPin"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="new-password"
              required
              className={`${inputClass} tracking-[0.3em]`}
            />
          </div>
          <div>
            <label
              htmlFor="newPinConfirm"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              新しい暗証番号（確認）
            </label>
            <input
              id="newPinConfirm"
              name="newPinConfirm"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="new-password"
              required
              className={`${inputClass} tracking-[0.3em]`}
            />
          </div>

          {state.message && (
            <p
              role="alert"
              className={`rounded-[10px] px-4 py-3 text-sm ${
                state.ok
                  ? "bg-success-bg text-success"
                  : "bg-danger-bg text-danger"
              }`}
            >
              {state.message}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowPinForm(false)}
              className="control-focus min-h-12 rounded-full border border-separator-strong px-5 text-[15px] font-medium text-foreground-secondary transition-colors active:bg-surface-secondary"
            >
              閉じる
            </button>
            <div className="flex-1">
              <PinSubmitButton />
            </div>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowPinForm(true)}
          className="control-focus self-start rounded-full px-1 py-2 text-sm font-medium text-accent"
        >
          暗証番号を変更する
        </button>
      )}
    </div>
  );
}
