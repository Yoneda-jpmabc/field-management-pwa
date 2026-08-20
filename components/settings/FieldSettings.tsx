"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { CropIcon, IconLock, IconPlus } from "@/components/icons";
import { formatDayLabel } from "@/lib/work-records/period";
import type { CropUnitItem, EditableField, EditablePlanting } from "@/lib/fields/queries";
import { PLANTING_STATUS_LABELS, type PlantingStatus } from "@/lib/harvest/types";
import { FieldEditSheet, type FieldSheetTarget } from "./FieldEditSheet";
import {
  PlantingEditSheet,
  type PlantingSheetTarget,
} from "./PlantingEditSheet";

type Props = {
  fields: EditableField[];
  crops: CropUnitItem[];
  /** 圃場情報を編集できるか（permission = 'all' のみ）。 */
  canEdit: boolean;
};

const STATUS_TONES: Record<
  PlantingStatus,
  "neutral" | "accent" | "success" | "warning"
> = {
  planned: "neutral",
  growing: "accent",
  harvesting: "success",
  finished: "neutral",
};

/** 「2,000株 ・ 30a ・ 12/5(金)定植」のように、作付の中身を 1 行にまとめる。 */
function describePlanting(planting: EditablePlanting): string {
  const parts: string[] = [];
  if (planting.plantCount !== null) {
    parts.push(`${planting.plantCount.toLocaleString("ja-JP")}株`);
  }
  if (planting.areaA !== null) parts.push(`${planting.areaA}a`);
  if (planting.expectedQuantity !== null) {
    parts.push(`見込み ${planting.expectedQuantity}${planting.unit}`);
  }
  if (planting.plantedOn) parts.push(`${formatDayLabel(planting.plantedOn)}定植`);
  return parts.join(" ・ ");
}

/**
 * 設定画面の「圃場情報」。
 *
 * 圃場そのものと、圃場ごとの作付（何がどれくらい植わっているか）を管理する。
 * 編集できるのは permission = 'all' の人だけで、それ以外は同じ内容を読むだけ。
 */
export function FieldSettings({ fields, crops, canEdit }: Props) {
  const [openFieldId, setOpenFieldId] = useState<string | null>(null);
  const [fieldSheet, setFieldSheet] = useState<
    { open: true; target: FieldSheetTarget } | null
  >(null);
  const [plantingSheet, setPlantingSheet] =
    useState<PlantingSheetTarget | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  return (
    <div className="flex flex-col gap-3">
      {notice && (
        <p
          role="status"
          className="rounded-[10px] bg-success-bg px-4 py-3 text-sm text-success"
        >
          {notice}
        </p>
      )}

      {!canEdit && (
        <p className="flex items-start gap-2 rounded-[10px] bg-surface-secondary px-4 py-3 text-sm text-foreground-secondary">
          <IconLock className="mt-0.5 h-4 w-4 shrink-0 text-foreground-tertiary" />
          圃場情報の登録・編集は管理者のみです。内容の確認はできます。
        </p>
      )}

      {fields.length === 0 ? (
        <div className="surface-card p-6 text-center">
          <p className="text-sm text-foreground-secondary">
            圃場がまだ登録されていません。
          </p>
        </div>
      ) : (
        <div className="surface-card divide-y divide-separator overflow-hidden !p-0">
          {fields.map((field) => {
            const open = openFieldId === field.id;
            return (
              <div key={field.id}>
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenFieldId(open ? null : field.id)}
                  className="control-focus flex min-h-16 w-full items-center gap-3 px-5 py-3.5 text-left transition-colors active:bg-surface-secondary"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium text-foreground">
                      {field.name}
                    </p>
                    <p className="mt-0.5 truncate text-sm text-foreground-tertiary">
                      {[
                        field.areaA === null ? null : `${field.areaA}a`,
                        field.plantings.length > 0
                          ? `作付${field.plantings.length}件`
                          : "作付なし",
                        field.crop || null,
                      ]
                        .filter(Boolean)
                        .join(" ・ ")}
                    </p>
                  </div>
                  <span
                    aria-hidden
                    className={`shrink-0 text-foreground-tertiary transition-transform ${
                      open ? "rotate-90" : ""
                    }`}
                  >
                    ›
                  </span>
                </button>

                {open && (
                  <div className="flex flex-col gap-2.5 border-t border-separator bg-surface-secondary/40 px-5 py-4">
                    {field.memo && (
                      <p className="text-sm text-foreground-secondary">
                        {field.memo}
                      </p>
                    )}

                    {field.plantings.length === 0 ? (
                      <p className="py-2 text-sm text-foreground-tertiary">
                        作付が登録されていません。
                      </p>
                    ) : (
                      field.plantings.map((planting) => {
                        const body = (
                          <>
                            <CropIcon
                              name={planting.cropName}
                              className="h-[18px] w-[18px] shrink-0 text-foreground-secondary"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[15px] font-medium text-foreground">
                                {planting.cropName}
                              </p>
                              {describePlanting(planting) && (
                                <p className="mt-0.5 truncate text-sm text-foreground-tertiary">
                                  {describePlanting(planting)}
                                </p>
                              )}
                            </div>
                            <Badge tone={STATUS_TONES[planting.status]}>
                              {PLANTING_STATUS_LABELS[planting.status]}
                            </Badge>
                          </>
                        );

                        return canEdit ? (
                          <button
                            key={planting.id}
                            type="button"
                            onClick={() =>
                              setPlantingSheet({
                                mode: "edit",
                                fieldName: field.name,
                                planting,
                              })
                            }
                            className="control-focus flex min-h-14 w-full items-center gap-3 rounded-[10px] bg-surface px-3.5 py-2.5 text-left transition-colors active:bg-surface-secondary"
                          >
                            {body}
                          </button>
                        ) : (
                          <div
                            key={planting.id}
                            className="flex min-h-14 w-full items-center gap-3 rounded-[10px] bg-surface px-3.5 py-2.5"
                          >
                            {body}
                          </div>
                        );
                      })
                    )}

                    {canEdit && (
                      <div className="mt-1 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setPlantingSheet({
                              mode: "create",
                              fieldId: field.id,
                              fieldName: field.name,
                            })
                          }
                          className="control-focus pressable flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full border border-dashed border-separator-strong text-sm font-medium text-foreground-secondary transition-colors active:bg-surface-secondary"
                        >
                          <IconPlus className="h-3.5 w-3.5" />
                          作付を追加
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setFieldSheet({ open: true, target: field })
                          }
                          className="control-focus pressable min-h-11 rounded-full border border-separator-strong px-5 text-sm font-medium text-foreground-secondary transition-colors active:bg-surface-secondary"
                        >
                          圃場を編集
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {canEdit && (
        <button
          type="button"
          onClick={() => setFieldSheet({ open: true, target: null })}
          className="control-focus pressable flex min-h-12 items-center justify-center gap-1.5 rounded-full bg-accent text-[15px] font-medium text-accent-foreground transition-colors hover:bg-accent-hover"
        >
          <IconPlus className="h-4 w-4" />
          圃場を登録
        </button>
      )}

      {fieldSheet && (
        <FieldEditSheet
          key={fieldSheet.target?.id ?? "new-field"}
          target={fieldSheet.target}
          onClose={() => setFieldSheet(null)}
          onDone={(message) => {
            setFieldSheet(null);
            setNotice(message);
          }}
        />
      )}

      {plantingSheet && (
        <PlantingEditSheet
          key={
            plantingSheet.mode === "edit"
              ? plantingSheet.planting.id
              : `new-planting-${plantingSheet.fieldId}`
          }
          target={plantingSheet}
          crops={crops}
          onClose={() => setPlantingSheet(null)}
          onDone={(message) => {
            setPlantingSheet(null);
            setNotice(message);
          }}
        />
      )}
    </div>
  );
}
