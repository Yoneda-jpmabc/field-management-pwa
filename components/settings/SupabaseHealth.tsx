"use client";

import { useState } from "react";
import { IconSync } from "@/components/icons";

type HealthResult = {
  ok: boolean;
  message: string;
};

type State =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "done"; result: HealthResult };

export function SupabaseHealth() {
  const [state, setState] = useState<State>({ kind: "idle" });

  async function check() {
    setState({ kind: "checking" });
    try {
      const response = await fetch("/api/supabase/health", { cache: "no-store" });
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
  }

  const tone =
    state.kind === "done"
      ? state.result.ok
        ? "text-success"
        : "text-warning"
      : "text-foreground-secondary";
  const dot =
    state.kind === "done"
      ? state.result.ok
        ? "bg-success"
        : "bg-warning"
      : "bg-foreground-tertiary";
  const label =
    state.kind === "idle"
      ? "未確認"
      : state.kind === "checking"
        ? "確認中"
        : state.result.ok
          ? "接続OK"
          : "接続できません";

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-2">
        <div
          className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-separator bg-surface px-3 py-1.5 text-xs font-medium ${tone}`}
          title={state.kind === "done" ? state.result.message : undefined}
        >
          <span className={`h-2 w-2 rounded-full ${dot}`} />
          <span>{label}</span>
        </div>
        <button
          type="button"
          onClick={check}
          disabled={state.kind === "checking"}
          className="control-focus flex items-center gap-1.5 whitespace-nowrap rounded-full border border-separator bg-surface px-3 py-1.5 text-xs font-medium text-foreground-secondary transition-colors hover:text-foreground disabled:opacity-50"
        >
          <IconSync className="h-3.5 w-3.5" />
          確認する
        </button>
      </div>
      {state.kind === "done" && (
        <p className="max-w-xs text-right text-xs text-foreground-tertiary">
          {state.result.message}
        </p>
      )}
    </div>
  );
}
