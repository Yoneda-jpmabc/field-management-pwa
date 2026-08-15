"use client";

import { useCallback, useEffect, useState } from "react";
import { IconSync } from "@/components/icons";
import type { SupabaseHealth as HealthResult } from "@/lib/supabase/health";

type State = { kind: "checking" } | { kind: "done"; result: HealthResult };

/**
 * Supabase への疎通状態。
 * 初回の結果はページ側（Server Component）で確認済みのものを受け取るので、
 * 開いた時点ですでに答えが出ている。ここで引き直すのは、
 * 手動の再確認とオフラインからの復帰時だけ。
 */
export function SupabaseHealth({ initial }: { initial: HealthResult }) {
  const [state, setState] = useState<State>({ kind: "done", result: initial });

  const recheck = useCallback(async () => {
    setState({ kind: "checking" });
    try {
      const response = await fetch("/api/supabase/health", {
        cache: "no-store",
      });
      const result: HealthResult = await response.json();
      setState({ kind: "done", result });
    } catch {
      setState({
        kind: "done",
        result: {
          ok: false,
          message: "確認リクエストに失敗しました。オフラインの可能性があります。",
        },
      });
    }
  }, []);

  useEffect(() => {
    // オフラインから復帰したときは状態が変わっているので、その場で取り直す。
    const handleOnline = () => void recheck();
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [recheck]);

  const checking = state.kind === "checking";
  const ok = state.kind === "done" && state.result.ok;

  // 接続状態の行と同じ丸アイコンで揃える。緑=接続OK、オレンジ=接続できない。
  const badgeTone = checking
    ? "border-separator-strong bg-surface-secondary text-foreground-tertiary"
    : ok
      ? "border-success/40 bg-success-bg text-success"
      : "border-warning/40 bg-warning-bg text-warning";
  const label = checking ? "確認中" : ok ? "接続OK" : "接続できません";

  return (
    <div className="flex flex-col items-start gap-1.5 sm:items-end">
      {/* アイコン自体が再確認ボタンを兼ねる（押さなくても開いた時点で結果は出ている）。 */}
      <button
        type="button"
        aria-label={`データベース接続: ${label}。タップで再確認します。`}
        title={state.kind === "done" ? state.result.message : label}
        onClick={() => void recheck()}
        disabled={checking}
        className={`control-focus pressable flex h-11 w-11 shrink-0 items-center justify-center rounded-full border ${badgeTone}`}
      >
        <IconSync className={`h-[18px] w-[18px] ${checking ? "animate-spin" : ""}`} />
      </button>
      {/* 色だけでは伝わらないので、読み上げ用の文言も持たせる。 */}
      <span className="sr-only" role="status">
        {label}
      </span>
      {/* 成功しただけの場合は文言を出さない（アイコンで足りるため）。 */}
      {state.kind === "done" && (!state.result.ok || state.result.note) && (
        <p className="max-w-xs text-xs text-foreground-tertiary sm:text-right">
          {state.result.message}
        </p>
      )}
    </div>
  );
}
