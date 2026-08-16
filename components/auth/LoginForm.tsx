"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { IconLeaf } from "@/components/icons";
import { signIn, SIGN_IN_INITIAL_STATE } from "@/lib/auth/actions";

const inputClass =
  "control-focus min-h-12 w-full rounded-[10px] border border-separator-strong bg-surface px-3 text-base text-foreground placeholder:text-foreground-tertiary";

function SubmitButton({ label }: { label: string }) {
  // useFormStatus は同じ <form> の中でしか状態を拾えないため、専用の子にしている。
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="control-focus pressable min-h-12 w-full rounded-full bg-accent text-[15px] font-medium text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-50"
    >
      {pending ? "確認中…" : label}
    </button>
  );
}

export function LoginForm({ next }: { next: string }) {
  const [state, formAction] = useActionState(signIn, SIGN_IN_INITIAL_STATE);
  const isSetup = state.stage === "setup";

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-6 py-10">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-[13px] bg-accent text-accent-foreground">
          <IconLeaf className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-foreground">
            圃場管理
          </h1>
          <p className="mt-1 text-sm text-foreground-secondary">
            {isSetup
              ? "初回の暗証番号を設定します。"
              : "ログインIDと暗証番号を入力してください。"}
          </p>
        </div>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="next" value={next} />
        <input type="hidden" name="stage" value={state.stage} />

        <div>
          <label
            htmlFor="loginId"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            ログインID
          </label>
          <input
            id="loginId"
            name="loginId"
            type="text"
            defaultValue={state.loginId}
            autoCapitalize="characters"
            autoComplete="username"
            required
            readOnly={isSetup}
            className={`${inputClass} font-mono ${isSetup ? "text-foreground-secondary" : ""}`}
          />
        </div>

        <div>
          <label
            htmlFor="pin"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            {isSetup ? "新しい暗証番号（数字4〜12桁）" : "暗証番号"}
          </label>
          <input
            id="pin"
            name="pin"
            type="password"
            // 現場ではスマホ入力なので、テンキーが出るようにしておく。
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete={isSetup ? "new-password" : "current-password"}
            required
            className={`${inputClass} tracking-[0.3em]`}
          />
        </div>

        {isSetup && (
          <div>
            <label
              htmlFor="pinConfirm"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              暗証番号（確認）
            </label>
            <input
              id="pinConfirm"
              name="pinConfirm"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="new-password"
              required
              className={`${inputClass} tracking-[0.3em]`}
            />
          </div>
        )}

        {state.message && (
          <p
            role="alert"
            className={`rounded-[10px] px-4 py-3 text-sm ${
              isSetup
                ? "bg-accent/10 text-accent"
                : "bg-danger-bg text-danger"
            }`}
          >
            {state.message}
          </p>
        )}

        <SubmitButton label={isSetup ? "暗証番号を設定して開始" : "ログイン"} />
      </form>

      <p className="mt-6 text-center text-xs text-foreground-tertiary">
        ログインIDが分からないときは管理者に確認してください。
      </p>
    </div>
  );
}
