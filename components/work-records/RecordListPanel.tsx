"use client";

import { useEffect, useState } from "react";
import { IconChevronRight } from "@/components/icons";
import { formatDayLabel } from "@/lib/work-records/period";
import type { EditableWorkRecord, MasterOption } from "@/lib/work-records/types";
import { RecordEditSheet } from "./RecordEditSheet";

type Props = {
  items: EditableWorkRecord[];
  workers: MasterOption[];
  workTypes: MasterOption[];
  fields: MasterOption[];
  crops: MasterOption[];
};

function groupByDate(items: EditableWorkRecord[]) {
  const groups = new Map<string, EditableWorkRecord[]>();
  for (const item of items) {
    const bucket = groups.get(item.workDate) ?? [];
    bucket.push(item);
    groups.set(item.workDate, bucket);
  }
  // クエリ側で日付降順に並べてあるので、挿入順がそのまま新しい順になる。
  return [...groups.entries()];
}

function buildTimeLabel(record: EditableWorkRecord): string | null {
  if (record.startTime && record.endTime)
    return `${record.startTime}〜${record.endTime}`;
  if (record.startTime) return `${record.startTime}〜`;
  if (record.endTime) return `〜${record.endTime}`;
  return null;
}

/**
 * 確認タブの一覧本体。
 * 行をタップするとボトムシートが開き、その場で修正・削除できる。
 */
export function RecordListPanel({
  items,
  workers,
  workTypes,
  fields,
  crops,
}: Props) {
  const [editing, setEditing] = useState<EditableWorkRecord | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // 保存・削除後のトーストは数秒で自然に消す。
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
            この期間に登録された実績はありません。
          </p>
          <p className="mt-1.5 text-sm text-foreground-tertiary">
            上の矢印で期間を移動するか、「登録」タブから追加できます。
          </p>
        </div>
      ) : (
        grouped.map(([date, records]) => (
          <section key={date}>
            <h2 className="mb-2 flex items-baseline justify-between px-1 text-sm font-semibold text-foreground-secondary">
              {formatDayLabel(date)}
              <span className="text-xs font-normal text-foreground-tertiary">
                {records.length}件
              </span>
            </h2>
            <div className="surface-card divide-y divide-separator overflow-hidden">
              {records.map((record) => {
                const timeLabel = buildTimeLabel(record);
                const subLabel = [
                  record.cropName,
                  record.fieldName,
                  record.memo,
                ]
                  .filter(Boolean)
                  .join(" ・ ");
                return (
                  <button
                    key={record.id}
                    type="button"
                    onClick={() => setEditing(record)}
                    className="control-focus flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left transition-colors active:bg-surface-secondary"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-medium text-foreground">
                        {record.workerName}
                        <span className="ml-2 font-normal text-foreground-secondary">
                          {record.workTypeLabel ?? "作業未設定"}
                        </span>
                      </p>
                      <p className="mt-0.5 truncate text-sm text-foreground-tertiary">
                        {subLabel || "詳細未設定"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {timeLabel ? (
                        <span className="font-mono text-[13px] text-foreground-secondary">
                          {timeLabel}
                        </span>
                      ) : (
                        <span className="text-[13px] text-foreground-tertiary">
                          時間未設定
                        </span>
                      )}
                      <IconChevronRight className="h-4 w-4 text-foreground-tertiary" />
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        ))
      )}

      {editing && (
        <RecordEditSheet
          key={editing.id}
          record={editing}
          workers={workers}
          workTypes={workTypes}
          fields={fields}
          crops={crops}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            setNotice("変更を保存しました。");
          }}
          onDeleted={() => {
            setEditing(null);
            setNotice("実績を削除しました。");
          }}
        />
      )}
    </div>
  );
}
