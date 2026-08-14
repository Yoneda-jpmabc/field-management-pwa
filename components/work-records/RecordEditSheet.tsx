"use client";

import { useEffect, useState, useTransition } from "react";
import type { ReactNode } from "react";
import { deleteWorkRecord, updateWorkRecord } from "@/lib/work-records/actions";
import type { EditableWorkRecord, MasterOption } from "@/lib/work-records/types";

type Props = {
  record: EditableWorkRecord;
  workers: MasterOption[];
  workTypes: MasterOption[];
  fields: MasterOption[];
  crops: MasterOption[];
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
};

/**
 * 無効化などでマスタ一覧から消えた選択値も編集画面では見えるように、
 * 現在の選択を先頭に補って返す。
 */
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

/**
 * 登録済みレコードの編集・削除を行うボトムシート。
 * スマホの片手操作を想定し、操作ボタンは下端に固定している。
 */
export function RecordEditSheet({
  record,
  workers,
  workTypes,
  fields,
  crops,
  onClose,
  onSaved,
  onDeleted,
}: Props) {
  const [workDate, setWorkDate] = useState(record.workDate);
  const [startTime, setStartTime] = useState(record.startTime);
  const [endTime, setEndTime] = useState(record.endTime);
  const [workTypeId, setWorkTypeId] = useState(record.workTypeId);
  const [workTypeRaw, setWorkTypeRaw] = useState(record.workTypeRaw);
  const [fieldId, setFieldId] = useState(record.fieldId);
  const [cropId, setCropId] = useState(record.cropId);
  const [workerId, setWorkerId] = useState(record.workerId);
  const [memo, setMemo] = useState(record.memo);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // シート表示中は背面のスクロールを止める（iOS Safari のスクロール抜け対策）。
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const workerOptions = withCurrentOption(
    workers,
    record.workerId,
    record.workerName,
  );
  const workTypeOptions = withCurrentOption(
    workTypes,
    record.workTypeId,
    record.workTypeLabel,
  );
  const fieldOptions = withCurrentOption(fields, record.fieldId, record.fieldName);
  const cropOptions = withCurrentOption(crops, record.cropId, record.cropName);

  const timeOrderWarning =
    startTime !== "" && endTime !== "" && endTime <= startTime;

  const canSave = workDate !== "" && workerId !== "";

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      const result = await updateWorkRecord({
        id: record.id,
        workDate,
        startTime,
        endTime,
        workTypeId,
        workTypeRaw,
        fieldId,
        cropId,
        workerId,
        memo,
      });
      if (result.ok) {
        onSaved();
      } else {
        setError(result.message);
      }
    });
  };

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteWorkRecord(record.id);
      if (result.ok) {
        onDeleted();
      } else {
        setConfirmingDelete(false);
        setError(result.message);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        type="button"
        aria-label="閉じる"
        onClick={() => !pending && onClose()}
        className="absolute inset-0 animate-[backdrop-in_0.2s_ease-out] bg-black/40"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="実績の編集"
        className="relative flex max-h-[88dvh] w-full max-w-lg animate-[sheet-in_0.25s_ease-out] flex-col rounded-t-[20px] bg-surface shadow-[var(--shadow-elevated)]"
      >
        <div className="flex shrink-0 items-center justify-between px-5 pt-3 pb-2">
          <div
            aria-hidden
            className="absolute left-1/2 top-2 h-1 w-9 -translate-x-1/2 rounded-full bg-separator-strong"
          />
          <h2 className="pt-2 text-[17px] font-semibold text-foreground">
            実績の編集
          </h2>
          <button
            type="button"
            onClick={() => !pending && onClose()}
            className="control-focus -mr-2 flex min-h-11 min-w-11 items-center justify-center rounded-full text-sm text-foreground-secondary active:bg-surface-secondary"
          >
            閉じる
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-5">
          <div className="flex flex-col gap-5">
            <SheetSection title="日時">
              <label className="block">
                <span className="mb-1.5 block text-sm text-foreground-secondary">
                  作業日
                </span>
                <input
                  type="date"
                  value={workDate}
                  onChange={(event) => setWorkDate(event.target.value)}
                  className="control-focus min-h-12 w-full rounded-[10px] border border-separator-strong bg-surface px-3 text-base text-foreground"
                />
              </label>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1.5 block text-sm text-foreground-secondary">
                    開始
                  </span>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(event) => setStartTime(event.target.value)}
                    className="control-focus min-h-12 w-full rounded-[10px] border border-separator-strong bg-surface px-3 text-base text-foreground"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm text-foreground-secondary">
                    終了
                  </span>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(event) => setEndTime(event.target.value)}
                    className="control-focus min-h-12 w-full rounded-[10px] border border-separator-strong bg-surface px-3 text-base text-foreground"
                  />
                </label>
              </div>
              {timeOrderWarning && (
                <p className="mt-2 text-sm text-warning">
                  終了が開始以前のため、集計では時間に計上されません。
                </p>
              )}
            </SheetSection>

            <SheetSection title="作業者" required>
              <div className="flex flex-wrap gap-2">
                {workerOptions.map((worker) => (
                  <Chip
                    key={worker.id}
                    selected={workerId === worker.id}
                    onClick={() => setWorkerId(worker.id)}
                  >
                    {worker.label}
                  </Chip>
                ))}
              </div>
            </SheetSection>

            <SheetSection title="作業種類">
              {workTypeOptions.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {workTypeOptions.map((type) => (
                    <Chip
                      key={type.id}
                      selected={workTypeId === type.id}
                      onClick={() =>
                        setWorkTypeId(workTypeId === type.id ? null : type.id)
                      }
                    >
                      {type.label}
                    </Chip>
                  ))}
                </div>
              )}
              <input
                type="text"
                value={workTypeRaw}
                onChange={(event) => setWorkTypeRaw(event.target.value)}
                placeholder="その他（自由入力）"
                className="control-focus min-h-12 w-full rounded-[10px] border border-separator-strong bg-surface px-3 text-base text-foreground placeholder:text-foreground-tertiary"
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
                    <Chip
                      key={crop.id}
                      selected={cropId === crop.id}
                      onClick={() =>
                        setCropId(cropId === crop.id ? null : crop.id)
                      }
                    >
                      {crop.label}
                    </Chip>
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
                    <Chip
                      key={field.id}
                      selected={fieldId === field.id}
                      onClick={() =>
                        setFieldId(fieldId === field.id ? null : field.id)
                      }
                    >
                      {field.label}
                    </Chip>
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

            {error && (
              <p
                role="alert"
                className="rounded-[10px] bg-danger-bg px-4 py-3 text-sm text-danger"
              >
                {error}
              </p>
            )}
          </div>
        </div>

        <div className="shrink-0 border-t border-separator px-5 pt-3 pb-[max(env(safe-area-inset-bottom),1rem)]">
          {confirmingDelete ? (
            <div>
              <p className="mb-3 text-center text-sm font-medium text-foreground">
                この実績を削除しますか？
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
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                disabled={pending}
                className="control-focus min-h-12 rounded-full border border-danger/40 px-5 text-[15px] font-medium text-danger transition-colors active:bg-danger-bg disabled:opacity-50"
              >
                削除
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={pending || !canSave}
                className="control-focus min-h-12 flex-1 rounded-full bg-accent text-[15px] font-medium text-accent-foreground transition-colors hover:bg-accent-hover active:bg-accent-hover disabled:opacity-50"
              >
                {pending ? "保存中…" : "変更を保存"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SheetSection({
  title,
  required,
  children,
}: {
  title: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold text-foreground">
        {title}
        {required && <span className="ml-1.5 text-xs text-danger">必須</span>}
      </h3>
      {children}
    </section>
  );
}

function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`control-focus min-h-11 rounded-full border px-4 text-[15px] transition-colors ${
        selected
          ? "border-accent bg-accent text-accent-foreground"
          : "border-separator-strong text-foreground active:bg-surface-secondary"
      }`}
    >
      {children}
    </button>
  );
}
