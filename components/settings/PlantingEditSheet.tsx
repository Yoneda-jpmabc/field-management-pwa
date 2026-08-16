"use client";

import { useState, useTransition } from "react";
import {
  BottomSheet,
  SheetChip,
  SheetSection,
} from "@/components/ui/BottomSheet";
import { deletePlanting, savePlanting } from "@/lib/fields/actions";
import type { CropUnitItem, EditablePlanting } from "@/lib/fields/queries";
import {
  PLANTING_STATUSES,
  PLANTING_STATUS_LABELS,
  type PlantingStatus,
} from "@/lib/harvest/types";

/**
 * 編集対象。
 * 新規は所属する圃場だけが決まっている状態、編集は既存の作付。
 */
export type PlantingSheetTarget =
  | { mode: "create"; fieldId: string; fieldName: string }
  | { mode: "edit"; fieldName: string; planting: EditablePlanting };

type Props = {
  target: PlantingSheetTarget;
  crops: CropUnitItem[];
  onClose: () => void;
  onDone: (message: string) => void;
};

const inputClass =
  "control-focus min-h-12 w-full rounded-[10px] border border-separator-strong bg-surface px-3 text-base text-foreground placeholder:text-foreground-tertiary";

function numberToInput(value: number | null): string {
  return value === null ? "" : String(value);
}

export function PlantingEditSheet({ target, crops, onClose, onDone }: Props) {
  const existing = target.mode === "edit" ? target.planting : null;
  const fieldId = target.mode === "edit" ? target.planting.fieldId : target.fieldId;

  const [cropId, setCropId] = useState<string | null>(existing?.cropId ?? null);
  const [plantedOn, setPlantedOn] = useState(existing?.plantedOn ?? "");
  const [plantCount, setPlantCount] = useState(
    numberToInput(existing?.plantCount ?? null),
  );
  const [areaA, setAreaA] = useState(numberToInput(existing?.areaA ?? null));
  const [expectedQuantity, setExpectedQuantity] = useState(
    numberToInput(existing?.expectedQuantity ?? null),
  );
  const [status, setStatus] = useState<PlantingStatus>(
    existing?.status ?? "growing",
  );
  const [memo, setMemo] = useState(existing?.memo ?? "");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // 見込み量の単位を添えるため、選択中の作物の単位を引く。
  const selectedUnit =
    crops.find((crop) => crop.id === cropId)?.unit ?? existing?.unit ?? "";

  const canSave = cropId !== null;

  const handleSave = () => {
    if (!cropId) return;
    setError(null);
    startTransition(async () => {
      const result = await savePlanting({
        id: existing?.id ?? null,
        fieldId,
        cropId,
        plantedOn,
        plantCount,
        areaA,
        expectedQuantity,
        status,
        memo,
      });
      if (result.ok) {
        onDone(existing ? "作付を更新しました。" : "作付を登録しました。");
      } else {
        setError(result.message);
      }
    });
  };

  const handleDelete = () => {
    if (!existing) return;
    setError(null);
    startTransition(async () => {
      const result = await deletePlanting(existing.id);
      if (result.ok) {
        onDone("作付を削除しました。");
      } else {
        setConfirmingDelete(false);
        setError(result.message);
      }
    });
  };

  const footer = confirmingDelete ? (
    <div>
      <p className="mb-3 text-center text-sm font-medium text-foreground">
        この作付を削除しますか？
      </p>
      <p className="mb-3 text-center text-xs text-foreground-tertiary">
        収穫の記録は残り、「作付の登録が無い収穫」として表示されます。
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
        className="control-focus min-h-12 flex-1 rounded-full bg-accent text-[15px] font-medium text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-50"
      >
        {pending ? "保存中…" : existing ? "変更を保存" : "作付を登録"}
      </button>
    </div>
  );

  return (
    <BottomSheet
      title={existing ? "作付の編集" : "作付を登録"}
      onClose={onClose}
      busy={pending}
      footer={footer}
    >
      <div className="flex flex-col gap-5">
        <div className="rounded-[10px] bg-surface-secondary px-4 py-3">
          <p className="text-[15px] font-medium text-foreground">
            {target.fieldName}
          </p>
        </div>

        <SheetSection title="作物" required>
          {crops.length === 0 ? (
            <p className="text-sm text-foreground-tertiary">
              作物マスタが空です。
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {crops.map((crop) => (
                <SheetChip
                  key={crop.id}
                  selected={cropId === crop.id}
                  onClick={() => setCropId(cropId === crop.id ? null : crop.id)}
                >
                  {crop.name}
                </SheetChip>
              ))}
            </div>
          )}
        </SheetSection>

        <SheetSection title="状態">
          <div className="flex flex-wrap gap-2">
            {PLANTING_STATUSES.map((candidate) => (
              <SheetChip
                key={candidate}
                selected={status === candidate}
                onClick={() => setStatus(candidate)}
              >
                {PLANTING_STATUS_LABELS[candidate]}
              </SheetChip>
            ))}
          </div>
        </SheetSection>

        {/* 「どれくらいあるか」の実数。作物によって数え方が違うので両方任意にしてある。 */}
        <SheetSection title="株数">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            step="1"
            value={plantCount}
            onChange={(event) => setPlantCount(event.target.value)}
            placeholder="未入力可"
            className={`${inputClass} text-right font-mono`}
          />
        </SheetSection>

        <SheetSection title="作付面積（アール）">
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={areaA}
            onChange={(event) => setAreaA(event.target.value)}
            placeholder="未入力可"
            className={`${inputClass} text-right font-mono`}
          />
        </SheetSection>

        <SheetSection title="定植日">
          <input
            type="date"
            value={plantedOn}
            onChange={(event) => setPlantedOn(event.target.value)}
            className={inputClass}
          />
        </SheetSection>

        <SheetSection title={`収穫見込み量${selectedUnit ? `（${selectedUnit}）` : ""}`}>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={expectedQuantity}
            onChange={(event) => setExpectedQuantity(event.target.value)}
            placeholder="未入力可"
            className={`${inputClass} text-right font-mono`}
          />
          <p className="mt-2 text-xs text-foreground-tertiary">
            入れておくと、収穫画面で「見込みに対してどれだけ採れたか」のバーが出ます。
          </p>
        </SheetSection>

        <SheetSection title="メモ">
          <textarea
            value={memo}
            onChange={(event) => setMemo(event.target.value)}
            rows={3}
            placeholder="任意（品種・ハウス番号など）"
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
