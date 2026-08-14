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

  const tone = checking
    ? "text-foreground-secondary"
    : ok
      ? "text-success"
      : "text-warning";
  const dot = checking
    ? "bg-foreground-tertiary"
    : ok
      ? "bg-success"
      : "bg-warning";
  const label = checking ? "確認中" : ok ? "接続OK" : "接続できません";

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-2">
        <div
          className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-separator bg-surface px-3 py-1.5 text-xs font-medium ${tone}`}
          title={state.kind === "done" ? state.result.message : undefined}
        >
          <span className={`h-2 w-2 rounded-full ${dot}`} />
          <span role="status">{label}</span>
        </div>
        <button
          type="button"
          aria-label="接続をもう一度確認する"
          onClick={() => void recheck()}
          disabled={checking}
          className="control-focus flex h-9 w-9 items-center justify-center rounded-full border border-separator bg-surface text-foreground-secondary transition-colors hover:text-foreground disabled:opacity-50"
        >
          <IconSync className={`h-4 w-4 ${checking ? "animate-spin" : ""}`} />
        </button>
      </div>
      {/* 成功しただけの場合は文言を出さない（バッジで足りるため）。 */}
      {state.kind === "done" && (!state.result.ok || state.result.note) && (
        <p className="max-w-xs text-right text-xs text-foreground-tertiary">
          {state.result.message}
        </p>
      )}
    </div>
  );
}
