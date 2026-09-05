"use client";

import { useEffect, useState } from "react";
import { CropIcon, IconLock } from "@/components/icons";
import type { CropUnitItem } from "@/lib/fields/queries";
import { CropUnitEditSheet } from "./CropUnitEditSheet";

type Props = {
  crops: CropUnitItem[];
  canEdit: boolean;
};

/**
 * 設定画面の「収穫量の単位」。
 *
 * kg で量るもの、パック・ケースで数えるものが混ざるため、作物マスタに持たせている。
 * 収穫入力の初期値になるだけで、過去の記録は記録時点の単位を持ったまま変わらない。
 */
export function CropUnitSettings({ crops, canEdit }: Props) {
  const [sheetCrop, setSheetCrop] = useState<CropUnitItem | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  if (crops.length === 0) {
    return (
      <div className="surface-card p-6 text-center text-sm text-foreground-secondary">
        作物が登録されていません。
      </div>
    );
  }

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
          単位の変更は管理者のみです。
        </p>
      )}

      <div className="surface-card divide-y divide-separator overflow-hidden !p-0">
        {crops.map((crop) => {
          const body = (
            <>
              <CropIcon
                name={crop.name}
                className="h-[18px] w-[18px] shrink-0 text-foreground-secondary"
              />
              <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-foreground">
                {crop.name}
              </span>
              <span className="shrink-0 font-mono text-sm text-foreground-tertiary">
                {crop.unit}
              </span>
            </>
          );

          return canEdit ? (
            <button
              key={crop.id}
              type="button"
              onClick={() => setSheetCrop(crop)}
              className="control-focus flex min-h-16 w-full items-center gap-3 px-5 py-3.5 text-left transition-colors active:bg-surface-secondary"
            >
              {body}
            </button>
          ) : (
            <div
              key={crop.id}
              className="flex min-h-16 w-full items-center gap-3 px-5 py-3.5"
            >
              {body}
            </div>
          );
        })}
      </div>

      {sheetCrop && (
        <CropUnitEditSheet
          key={sheetCrop.id}
          crop={sheetCrop}
          onClose={() => setSheetCrop(null)}
          onDone={(message) => {
            setSheetCrop(null);
            setNotice(message);
          }}
        />
      )}
    </div>
  );
}
