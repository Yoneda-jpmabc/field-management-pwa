"use client";

import { useEffect, useState, useTransition } from "react";
import { CropIcon, IconLock } from "@/components/icons";
import { updateCropUnit } from "@/lib/fields/actions";
import type { CropUnitItem } from "@/lib/fields/queries";

type Props = {
  crops: CropUnitItem[];
  canEdit: boolean;
};

/**
 * 作物ごとの収穫量の単位。
 *
 * kg で量るもの、パック・ケースで数えるものが混ざるため、作物マスタに持たせている。
 * 収穫入力の初期値になるだけで、過去の記録は記録時点の単位を持ったまま変わらない。
 */
export function CropUnitSettings({ crops, canEdit }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  const save = (cropId: string) => {
    setError(null);
    startTransition(async () => {
      const result = await updateCropUnit(cropId, draft);
      if (result.ok) {
        setEditingId(null);
        setNotice("単位を変更しました。");
      } else {
        setError(result.message);
      }
    });
  };

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
      {error && (
        <p
          role="alert"
          className="rounded-[10px] bg-danger-bg px-4 py-3 text-sm text-danger"
        >
          {error}
        </p>
      )}

      {!canEdit && (
        <p className="flex items-start gap-2 rounded-[10px] bg-surface-secondary px-4 py-3 text-sm text-foreground-secondary">
          <IconLock className="mt-0.5 h-4 w-4 shrink-0 text-foreground-tertiary" />
          単位の変更は管理者のみです。
        </p>
      )}

      <div className="surface-card divide-y divide-separator overflow-hidden !p-0">
        {crops.map((crop) => (
          <div
            key={crop.id}
            className="flex min-h-14 items-center gap-3 px-5 py-3"
          >
            <CropIcon
              name={crop.name}
              className="h-[18px] w-[18px] shrink-0 text-foreground-secondary"
            />
            <span className="min-w-0 flex-1 truncate text-[15px] text-foreground">
              {crop.name}
            </span>

            {editingId === crop.id ? (
              <div className="flex shrink-0 items-center gap-2">
                <input
                  type="text"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  maxLength={10}
                  aria-label={`${crop.name}の単位`}
                  autoFocus
                  className="control-focus min-h-11 w-24 rounded-[10px] border border-separator-strong bg-surface px-3 text-center text-base text-foreground"
                />
                <button
                  type="button"
                  onClick={() => save(crop.id)}
                  disabled={pending || draft.trim() === ""}
                  className="control-focus min-h-11 rounded-full bg-accent px-4 text-sm font-medium text-accent-foreground disabled:opacity-50"
                >
                  {pending ? "保存中…" : "保存"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setError(null);
                  }}
                  disabled={pending}
                  className="control-focus min-h-11 rounded-full px-3 text-sm text-foreground-secondary disabled:opacity-50"
                >
                  やめる
                </button>
              </div>
            ) : canEdit ? (
              <button
                type="button"
                onClick={() => {
                  setEditingId(crop.id);
                  setDraft(crop.unit);
                  setError(null);
                }}
                className="control-focus min-h-11 shrink-0 rounded-full border border-separator-strong px-4 font-mono text-sm text-foreground transition-colors active:bg-surface-secondary"
              >
                {crop.unit}
              </button>
            ) : (
              <span className="shrink-0 font-mono text-sm text-foreground-secondary">
                {crop.unit}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
