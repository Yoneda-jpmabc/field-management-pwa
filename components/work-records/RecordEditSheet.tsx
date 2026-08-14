"use client";

import { useState, useTransition } from "react";
import {
  BottomSheet,
  SheetChip,
  SheetSection,
} from "@/components/ui/BottomSheet";
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

/** 登録済みレコードの編集・削除を行うボトムシート。 */
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

  const footer = confirmingDelete ? (
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
  );

  return (
    <BottomSheet
      title="実績の編集"
      onClose={onClose}
      busy={pending}
      footer={footer}
    >
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
              <SheetChip
                key={worker.id}
                selected={workerId === worker.id}
                onClick={() => setWorkerId(worker.id)}
              >
                {worker.label}
              </SheetChip>
            ))}
          </div>
        </SheetSection>

        <SheetSection title="作業種類">
          {workTypeOptions.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {workTypeOptions.map((type) => (
                <SheetChip
                  key={type.id}
                  selected={workTypeId === type.id}
                  onClick={() =>
                    setWorkTypeId(workTypeId === type.id ? null : type.id)
                  }
                >
                  {type.label}
                </SheetChip>
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
