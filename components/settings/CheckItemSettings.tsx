"use client";

import { useEffect, useState } from "react";
import { CropIcon, IconLock, IconPlus } from "@/components/icons";
import type { CropCheckItemGroup } from "@/lib/crop-checks/types";
import {
  CheckItemEditSheet,
  type CheckItemSheetTarget,
} from "./CheckItemEditSheet";

type Props = {
  groups: CropCheckItemGroup[];
  /** 管理項目を編集できるか（permission = 'all' のみ）。 */
  canEdit: boolean;
};

/**
 * 設定画面の「管理項目」。
 *
 * 作物ごとに、管理タブで毎日確認することを登録する。
 * 全員の作業の基準になるものなので、編集できるのは圃場情報と同じく管理者だけ。
 */
export function CheckItemSettings({ groups, canEdit }: Props) {
  const [openCropId, setOpenCropId] = useState<string | null>(null);
  const [sheet, setSheet] = useState<CheckItemSheetTarget | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  if (groups.length === 0) {
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
          管理項目の登録・編集は管理者のみです。内容の確認はできます。
        </p>
      )}

      <div className="surface-card divide-y divide-separator overflow-hidden !p-0">
        {groups.map((group) => {
          const open = openCropId === group.cropId;
          return (
            <div key={group.cropId}>
              <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpenCropId(open ? null : group.cropId)}
                className="control-focus flex min-h-16 w-full items-center gap-3 px-5 py-3.5 text-left transition-colors active:bg-surface-secondary"
              >
                <CropIcon
                  name={group.cropName}
                  className="h-[18px] w-[18px] shrink-0 text-foreground-secondary"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium text-foreground">
                    {group.cropName}
                  </p>
                  <p className="mt-0.5 text-sm text-foreground-tertiary">
                    {group.items.length > 0
                      ? `${group.items.length}項目`
                      : "項目未登録"}
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
                  {group.items.length === 0 ? (
                    <p className="py-2 text-sm text-foreground-tertiary">
                      毎日確認することを登録すると、管理タブに出ます。
                    </p>
                  ) : (
                    group.items.map((item) => {
                      const body = (
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[15px] font-medium text-foreground">
                            {item.title}
                          </p>
                          {item.description && (
                            <p className="mt-0.5 truncate text-sm text-foreground-tertiary">
                              {item.description}
                            </p>
                          )}
                        </div>
                      );

                      return canEdit ? (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() =>
                            setSheet({
                              mode: "edit",
                              cropName: group.cropName,
                              item,
                            })
                          }
                          className="control-focus flex min-h-14 w-full items-center gap-3 rounded-[10px] bg-surface px-3.5 py-2.5 text-left transition-colors active:bg-surface-secondary"
                        >
                          {body}
                        </button>
                      ) : (
                        <div
                          key={item.id}
                          className="flex min-h-14 w-full items-center gap-3 rounded-[10px] bg-surface px-3.5 py-2.5"
                        >
                          {body}
                        </div>
                      );
                    })
                  )}

                  {canEdit && (
                    <button
                      type="button"
                      onClick={() =>
                        setSheet({
                          mode: "create",
                          cropId: group.cropId,
                          cropName: group.cropName,
                        })
                      }
                      className="control-focus pressable mt-1 flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-dashed border-separator-strong text-sm font-medium text-foreground-secondary transition-colors active:bg-surface-secondary"
                    >
                      <IconPlus className="h-3.5 w-3.5" />
                      項目を追加
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {sheet && (
        <CheckItemEditSheet
          key={
            sheet.mode === "edit"
              ? sheet.item.id
              : `new-check-item-${sheet.cropId}`
          }
          target={sheet}
          onClose={() => setSheet(null)}
          onDone={(message) => {
            setSheet(null);
            setNotice(message);
          }}
        />
      )}
    </div>
  );
}
