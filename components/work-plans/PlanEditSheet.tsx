"use client";

import { useState, useTransition } from "react";
import {
  BottomSheet,
  SheetChip,
  SheetSection,
} from "@/components/ui/BottomSheet";
import {
  createWorkPlan,
  deleteWorkPlan,
  updateWorkPlan,
} from "@/lib/work-plans/actions";
import type { WorkPlan } from "@/lib/work-plans/types";
import type { MasterOption } from "@/lib/work-records/types";

/**
 * 編集対象。既存の予定なら plan を、新規なら日付だけを持つ。
 * どちらも同じシートで扱う（項目が同じで、分けても UI が増えるだけのため）。
 */
export type PlanSheetTarget =
  | { mode: "create"; planDate: string }
  | { mode: "edit"; plan: WorkPlan };

type Props = {
  target: PlanSheetTarget;
  crops: MasterOption[];
  fields: MasterOption[];
  /** よく使う予定名。過去に入力したものを頻度順で渡す。 */
  titleSuggestions: string[];
  onClose: () => void;
  onDone: (message: string) => void;
};

function withCurrentOption(
  options: MasterOption[],
  currentId: string | null,
  currentLabel: string | null,
): MasterOption[] {
  if (!currentId || options.some((option) => option.id === currentId)) {
    return options;
  }
  return [{ id: currentId, label: currentLabel ?? "（マスタ外）" }, ...options];
}

export function PlanEditSheet({
  target,
  crops,
  fields,
  titleSuggestions,
  onClose,
  onDone,
}: Props) {
  const existing = target.mode === "edit" ? target.plan : null;

  const [planDate, setPlanDate] = useState(
    existing ? existing.planDate : target.mode === "create" ? target.planDate : "",
  );
  const [title, setTitle] = useState(existing?.title ?? "");
  const [cropId, setCropId] = useState(existing?.cropId ?? null);
  const [fieldId, setFieldId] = useState(existing?.fieldId ?? null);
  const [memo, setMemo] = useState(existing?.memo ?? "");
  const [isDone, setIsDone] = useState(existing?.isDone ?? false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const cropOptions = withCurrentOption(
    crops,
    existing?.cropId ?? null,
    existing?.cropName ?? null,
  );
  const fieldOptions = withCurrentOption(
    fields,
    existing?.fieldId ?? null,
    existing?.fieldName ?? null,
  );

  const canSave = planDate !== "" && title.trim() !== "";

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      const result = existing
        ? await updateWorkPlan({
            id: existing.id,
            planDate,
            title,
            cropId,
            fieldId,
            memo,
            isDone,
          })
        : await createWorkPlan({ planDate, title, cropId, fieldId, memo });

      if (result.ok) {
        onDone(existing ? "予定を更新しました。" : "予定を追加しました。");
      } else {
        setError(result.message);
      }
    });
  };

  const handleDelete = () => {
    if (!existing) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteWorkPlan(existing.id);
      if (result.ok) {
        onDone("予定を削除しました。");
      } else {
        setConfirmingDelete(false);
        setError(result.message);
      }
    });
  };

  const footer = confirmingDelete ? (
    <div>
      <p className="mb-3 text-center text-sm font-medium text-foreground">
        この予定を削除しますか？
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setConfirmingDelete(false)}
          disabled={pending}
          className="control-focus min-h-12 flex-1 rounded-full border border-separator-strong text-[15px] font-medium text-foreground-secondary transition-colors active:bg-surface-secondary disabled:opacity-50"
        >
          やめる
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={pending}
          className="control-focus min-h-12 flex-1 rounded-full bg-danger text-[15px] font-medium text-white transition-colors active:opacity-80 disabled:opacity-50"
        >
          {pending ? "削除中…" : "削除する"}
        </button>
      </div>
    </div>
  ) : (
    <div className="flex gap-2">
      {existing && (
        <button
          type="button"
          onClick={() => setConfirmingDelete(true)}
          disabled={pending}
          className="control-focus min-h-12 rounded-full border border-danger/40 px-5 text-[15px] font-medium text-danger transition-colors active:bg-danger-bg disabled:opacity-50"
        >
          削除
        </button>
      )}
      <button
        type="button"
        onClick={handleSave}
        disabled={pending || !canSave}
        className="control-focus min-h-12 flex-1 rounded-full bg-accent text-[15px] font-medium text-accent-foreground transition-colors hover:bg-accent-hover active:bg-accent-hover disabled:opacity-50"
      >
        {pending ? "保存中…" : existing ? "変更を保存" : "予定を追加"}
      </button>
    </div>
  );

  return (
    <BottomSheet
      title={existing ? "予定の編集" : "予定を追加"}
      onClose={onClose}
      busy={pending}
      footer={footer}
    >
      <div className="flex flex-col gap-5">
        <SheetSection title="内容" required>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="例: イチゴ 定植 / ハウス片付け"
            autoFocus={!existing}
            className="control-focus min-h-12 w-full rounded-[10px] border border-separator-strong bg-surface px-3 text-base text-foreground placeholder:text-foreground-tertiary"
          />
          {titleSuggestions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {titleSuggestions.map((suggestion) => (
                <SheetChip
                  key={suggestion}
                  selected={title === suggestion}
                  onClick={() =>
                    setTitle(title === suggestion ? "" : suggestion)
                  }
                >
                  {suggestion}
                </SheetChip>
              ))}
            </div>
          )}
        </SheetSection>

        <SheetSection title="日付" required>
          <input
            type="date"
            value={planDate}
            onChange={(event) => setPlanDate(event.target.value)}
            className="control-focus min-h-12 w-full rounded-[10px] border border-separator-strong bg-surface px-3 text-base text-foreground"
          />
        </SheetSection>

        <SheetSection title="作物">
          {cropOptions.length === 0 ? (
            <p className="text-sm text-foreground-tertiary">
              作物マスタが空です。
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {cropOptions.map((crop) => (
                <SheetChip
                  key={crop.id}
                  selected={cropId === crop.id}
                  onClick={() => setCropId(cropId === crop.id ? null : crop.id)}
                >
                  {crop.label}
                </SheetChip>
              ))}
            </div>
          )}
        </SheetSection>

        <SheetSection title="圃場">
          {fieldOptions.length === 0 ? (
            <p className="text-sm text-foreground-tertiary">
              圃場マスタが空です。
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {fieldOptions.map((field) => (
                <SheetChip
                  key={field.id}
                  selected={fieldId === field.id}
                  onClick={() =>
                    setFieldId(fieldId === field.id ? null : field.id)
                  }
                >
                  {field.label}
                </SheetChip>
              ))}
            </div>
          )}
        </SheetSection>

        <SheetSection title="メモ">
          <textarea
            value={memo}
            onChange={(event) => setMemo(event.target.value)}
            rows={3}
            placeholder="任意"
            className="control-focus w-full resize-y rounded-[10px] border border-separator-strong bg-surface px-3 py-2.5 text-base text-foreground placeholder:text-foreground-tertiary"
          />
        </SheetSection>

        {existing && (
          <SheetSection title="状態">
            <button
              type="button"
              aria-pressed={isDone}
              onClick={() => setIsDone(!isDone)}
              className={`control-focus flex min-h-12 w-full items-center justify-between rounded-[10px] border px-4 text-[15px] transition-colors ${
                isDone
                  ? "border-success bg-success-bg text-success"
                  : "border-separator-strong text-foreground active:bg-surface-secondary"
              }`}
            >
              {isDone ? "完了にする" : "未完了のまま"}
              <span aria-hidden>{isDone ? "✓" : "—"}</span>
            </button>
          </SheetSection>
        )}

        {error && (
          <p
            role="alert"
            className="rounded-[10px] bg-danger-bg px-4 py-3 text-sm text-danger"
          >
            {error}
          </p>
        )}
      </div>
    </BottomSheet>
  );
}
