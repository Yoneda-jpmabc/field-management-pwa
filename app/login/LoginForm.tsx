"use client";

import { useActionState } from "react";
import { signInWithLoginId, type LoginState } from "@/lib/auth/actions";

const inputClass =
  "control-focus min-h-12 w-full rounded-[10px] border border-separator-strong bg-surface px-3 text-base text-foreground placeholder:text-foreground-tertiary";

const initialState: LoginState = null;

export function LoginForm() {
  const [state, action, pending] = useActionState(
    signInWithLoginId,
    initialState,
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <div>
        <label
          htmlFor="loginId"
          className="mb-1.5 block text-sm text-foreground-secondary"
        >
          ログインID
        </label>
        <input
          id="loginId"
          name="loginId"
          type="text"
          required
          autoComplete="username"
          // 現場では英数8文字を紙から打つ。勝手に大文字化・補正されると入らない。
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          inputMode="text"
          placeholder="K7X2M9QT"
          className={`${inputClass} font-mono tracking-[0.15em] uppercase`}
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-1.5 block text-sm text-foreground-secondary"
        >
          パスワード
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className={inputClass}
        />
      </div>

      {state && (
        <p
          role="alert"
          className="rounded-[10px] bg-danger-bg px-4 py-3 text-sm text-danger"
        >
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="control-focus mt-1 min-h-12 w-full rounded-full bg-accent text-[15px] font-medium text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-50"
      >
        {pending ? "ログイン中…" : "ログイン"}
      </button>
    </form>
  );
}
