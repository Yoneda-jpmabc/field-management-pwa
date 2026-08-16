"use client";

import { useEffect, useState } from "react";
import { CropIcon, IconChevronRight } from "@/components/icons";
import { formatDayLabel } from "@/lib/work-records/period";
import { formatQuantity, type HarvestListItem } from "@/lib/harvest/types";
import type { WorkerOption } from "@/lib/work-records/types";
import { HarvestSheet } from "./HarvestSheet";

type Props = {
  items: HarvestListItem[];
  workers: WorkerOption[];
  today: string;
  /** 閲覧のみの人はタップしても編集シートを開かない。 */
  canEdit: boolean;
};

function groupByDate(items: HarvestListItem[]) {
  const groups = new Map<string, HarvestListItem[]>();
  for (const item of items) {
    const bucket = groups.get(item.harvestDate) ?? [];
    bucket.push(item);
    groups.set(item.harvestDate, bucket);
  }
  // クエリ側で日付降順に並べてあるので、挿入順がそのまま新しい順になる。
  return [...groups.entries()];
}

/** 同じ日でも単位が混ざりうるので、日ごとの合計は単位別に出す。 */
function sumByUnit(items: HarvestListItem[]): string {
  const totals = new Map<string, number>();
  for (const item of items) {
    totals.set(item.unit, (totals.get(item.unit) ?? 0) + item.quantity);
  }
  return [...totals.entries()]
    .map(([unit, quantity]) => formatQuantity(quantity, unit))
    .join(" ・ ");
}

export function HarvestListPanel({ items, workers, today, canEdit }: Props) {
  const [editing, setEditing] = useState<HarvestListItem | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  const grouped = groupByDate(items);

  return (
    <div className="flex flex-col gap-5 pb-4">
      {notice && (
        <p
          role="status"
          className="rounded-[10px] bg-success-bg px-4 py-3 text-sm text-success"
        >
          {notice}
        </p>
      )}

      {grouped.length === 0 ? (
        <div className="surface-card p-6 text-center">
          <p className="text-sm text-foreground-secondary">
            この期間の収穫記録はありません。
          </p>
          <p className="mt-1.5 text-sm text-foreground-tertiary">
            上の矢印で期間を移動するか、「圃場ごと」タブから記録できます。
          </p>
        </div>
      ) : (
        grouped.map(([date, records]) => (
          <section key={date}>
            <h2 className="mb-2 flex items-baseline justify-between px-1 text-sm font-semibold text-foreground-secondary">
              {formatDayLabel(date)}
              <span className="font-mono text-xs font-normal text-foreground-tertiary">
                {sumByUnit(records)}
              </span>
            </h2>
            <div className="surface-card divide-y divide-separator overflow-hidden">
              {records.map((record) => {
                const subLabel = [record.workerName, record.memo]
                  .filter(Boolean)
                  .join(" ・ ");

                const content = (
                  <>
                    <CropIcon
                      name={record.cropName}
                      className="h-[18px] w-[18px] shrink-0 text-foreground-tertiary"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-medium text-foreground">
                        {record.fieldName}
                        <span className="ml-2 font-normal text-foreground-secondary">
                          {record.cropName}
                        </span>
                      </p>
                      <p className="mt-0.5 truncate text-sm text-foreground-tertiary">
                        {subLabel || "作業者未設定"}
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-[15px] font-medium text-foreground">
                      {formatQuantity(record.quantity, record.unit)}
                    </span>
                  </>
                );

                return canEdit ? (
                  <button
                    key={record.id}
                    type="button"
                    onClick={() => setEditing(record)}
                    className="control-focus flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left transition-colors active:bg-surface-secondary"
                  >
                    {content}
                    <IconChevronRight className="h-4 w-4 shrink-0 text-foreground-tertiary" />
                  </button>
                ) : (
                  <div
                    key={record.id}
                    className="flex min-h-16 w-full items-center gap-3 px-4 py-3"
                  >
                    {content}
                  </div>
                );
              })}
            </div>
          </section>
        ))
      )}

      {editing && (
        <HarvestSheet
          key={editing.id}
          target={{ mode: "edit", record: editing }}
          today={today}
          workers={workers}
          onClose={() => setEditing(null)}
          onDone={(message) => {
            setEditing(null);
            setNotice(message);
          }}
        />
      )}
    </div>
  );
}
