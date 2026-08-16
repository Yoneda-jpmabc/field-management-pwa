"use client";

import { useState, useTransition } from "react";
import {
  BottomSheet,
  SheetChip,
  SheetSection,
} from "@/components/ui/BottomSheet";
import {
  createHarvestRecord,
  deleteHarvestRecord,
  updateHarvestRecord,
} from "@/lib/harvest/actions";
import type { HarvestListItem } from "@/lib/harvest/types";
import type { WorkerOption } from "@/lib/work-records/types";

/**
 * 収穫入力の対象。
 * 収穫タブの作付カードから開く新規と、履歴から開く編集を 1 つのシートで扱う。
 */
export type HarvestSheetTarget =
  | {
      mode: "create";
      fieldId: string;
      fieldName: string;
      cropId: string;
      cropName: string;
      /** 作付カードから開いた場合はその作付。圃場直下から開いたら null。 */
      plantingId: string | null;
      unit: string;
    }
  | { mode: "edit"; record: HarvestListItem };

type Props = {
  target: HarvestSheetTarget;
  today: string;
  workers: WorkerOption[];
  onClose: () => void;
  onDone: (message: string) => void;
};

const inputClass =
  "control-focus min-h-12 w-full rounded-[10px] border border-separator-strong bg-surface px-3 text-base text-foreground placeholder:text-foreground-tertiary";

export function HarvestSheet({
  target,
  today,
  workers,
  onClose,
  onDone,
}: Props) {
  const existing = target.mode === "edit" ? target.record : null;

  const fieldName =
    target.mode === "edit" ? target.record.fieldName : target.fieldName;
  const cropName =
    target.mode === "edit" ? target.record.cropName : target.cropName;
  const fieldId = target.mode === "edit" ? target.record.fieldId : target.fieldId;
  const cropId = target.mode === "edit" ? target.record.cropId : target.cropId;
  const plantingId =
    target.mode === "edit" ? target.record.plantingId : target.plantingId;

  const [harvestDate, setHarvestDate] = useState(
    existing?.harvestDate ?? today,
  );
  const [quantity, setQuantity] = useState(
    existing ? String(existing.quantity) : "",
  );
  const [unit, setUnit] = useState(
    target.mode === "edit" ? target.record.unit : target.unit,
  );
  const [workerId, setWorkerId] = useState<string | null>(
    existing?.workerId ?? null,
  );
  const [memo, setMemo] = useState(existing?.memo ?? "");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const parsedQuantity = Number(quantity);
  const canSave =
    harvestDate !== "" &&
    quantity.trim() !== "" &&
    Number.isFinite(parsedQuantity) &&
    parsedQuantity >= 0;

  const handleSave = () => {
    setError(null);
    const input = {
      id: existing?.id ?? null,
      harvestDate,
      fieldId,
      cropId,
      plantingId,
      quantity,
      unit,
      workerId,
      memo,
    };

    startTransition(async () => {
      const result = existing
        ? await updateHarvestRecord(input)
        : await createHarvestRecord(input);

      if (result.ok) {
        onDone(existing ? "収穫記録を更新しました。" : "収穫を記録しました。");
      } else {
        setError(result.message);
      }
    });
  };

  const handleDelete = () => {
    if (!existing) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteHarvestRecord(existing.id);
      if (result.ok) {
        onDone("収穫記録を削除しました。");
      } else {
        setConfirmingDelete(false);
        setError(result.message);
      }
    });
  };

  const footer = confirmingDelete ? (
    <div>
      <p className="mb-3 text-center text-sm font-medium text-foreground">
        この収穫記録を削除しますか？
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
        {pending ? "保存中…" : existing ? "変更を保存" : "収穫を記録"}
      </button>
    </div>
  );

  return (
    <BottomSheet
      title={existing ? "収穫記録の編集" : "収穫を記録"}
      onClose={onClose}
      busy={pending}
      footer={footer}
    >
      <div className="flex flex-col gap-5">
        {/* 圃場と作物はカードから開いた時点で決まっているので、確認だけできればよい。 */}
        <div className="rounded-[10px] bg-surface-secondary px-4 py-3">
          <p className="text-[15px] font-medium text-foreground">{fieldName}</p>
          <p className="mt-0.5 text-sm text-foreground-secondary">{cropName}</p>
        </div>

        <SheetSection title="収穫量" required>
          <div className="flex gap-2">
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              placeholder="0"
              autoFocus={!existing}
              className={`${inputClass} flex-1 text-right font-mono`}
            />
            <input
              type="text"
              value={unit}
              onChange={(event) => setUnit(event.target.value)}
              aria-label="単位"
              className={`${inputClass} w-24 text-center`}
            />
          </div>
          <p className="mt-2 text-xs text-foreground-tertiary">
            単位の初期値は作物マスタの設定です。この記録だけ変えることもできます。
          </p>
        </SheetSection>

        <SheetSection title="収穫日" required>
          <input
            type="date"
            value={harvestDate}
            onChange={(event) => setHarvestDate(event.target.value)}
            className={inputClass}
          />
        </SheetSection>

        <SheetSection title="収穫した人">
          {workers.length === 0 ? (
            <p className="text-sm text-foreground-tertiary">
              作業者マスタが空です。
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {workers.map((worker) => (
                <SheetChip
                  key={worker.id}
                  selected={workerId === worker.id}
                  onClick={() =>
                    setWorkerId(workerId === worker.id ? null : worker.id)
                  }
                >
                  {worker.label}
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
            placeholder="任意（等級・出荷先など）"
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
