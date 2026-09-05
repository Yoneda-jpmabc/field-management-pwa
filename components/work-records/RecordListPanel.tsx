"use client";

import { useEffect, useState } from "react";
import { IconChevronRight } from "@/components/icons";
import { formatDayLabel } from "@/lib/work-records/period";
import type {
  EditableWorkRecord,
  MasterOption,
  WorkCategoryOption,
  WorkTypeOption,
} from "@/lib/work-records/types";
import { RecordEditSheet } from "./RecordEditSheet";

type Props = {
  items: EditableWorkRecord[];
  workers: MasterOption[];
  workCategories: WorkCategoryOption[];
  workTypes: WorkTypeOption[];
  fields: MasterOption[];
  /** 行をタップして修正できるか。閲覧のみの人は一覧を見るだけ。 */
  canEdit: boolean;
  /** 空のときの案内文。権限によって「登録タブから追加」と言えないため差し替える。 */
  emptyHint: string;
};

/**
 * 登録画面で複数圃場を選ぶと、作業者 × 圃場の数だけ work_records 行に
 * 分かれる（batch_id は共通）。確認タブでは分けて見せず、同じ batchId ＋
 * 同じ作業者の行を 1 グループにまとめて 1 行として見せる・編集する。
 */
type RecordGroup = {
  key: string;
  workDate: string;
  workerName: string;
  workTypeLabel: string | null;
  cropName: string | null;
  fieldNames: string[];
  memo: string;
  startTime: string;
  endTime: string;
  records: EditableWorkRecord[];
};

function groupRecords(items: EditableWorkRecord[]): RecordGroup[] {
  const groups = new Map<string, RecordGroup>();
  const order: string[] = [];
  for (const item of items) {
    // batchId が無い（想定外の）行は他と混ざらないよう自分の id だけで束ねる。
    const key = `${item.batchId ?? item.id}:${item.workerId}`;
    let group = groups.get(key);
    if (!group) {
      group = {
        key,
        workDate: item.workDate,
        workerName: item.workerName,
        workTypeLabel: item.workTypeLabel,
        cropName: item.cropName,
        fieldNames: [],
        memo: item.memo,
        startTime: item.startTime,
        endTime: item.endTime,
        records: [],
      };
      groups.set(key, group);
      order.push(key);
    }
    if (item.fieldName && !group.fieldNames.includes(item.fieldName)) {
      group.fieldNames.push(item.fieldName);
    }
    group.records.push(item);
  }
  return order.map((key) => groups.get(key)!);
}

function groupByDate(groups: RecordGroup[]) {
  const buckets = new Map<string, RecordGroup[]>();
  for (const group of groups) {
    const bucket = buckets.get(group.workDate) ?? [];
    bucket.push(group);
    buckets.set(group.workDate, bucket);
  }
  // クエリ側で日付降順に並べてあるので、挿入順がそのまま新しい順になる。
  return [...buckets.entries()];
}

function buildTimeLabel(record: {
  startTime: string;
  endTime: string;
}): string | null {
  if (record.startTime && record.endTime)
    return `${record.startTime}〜${record.endTime}`;
  if (record.startTime) return `${record.startTime}〜`;
  if (record.endTime) return `〜${record.endTime}`;
  return null;
}

/**
 * 確認タブの一覧本体。
 * 行をタップするとボトムシートが開き、その場で修正・削除できる。
 * 複数圃場ぶんまとまった行も分けずに 1 行のまま、まとめて編集する。
 */
export function RecordListPanel({
  items,
  workers,
  workCategories,
  workTypes,
  fields,
  canEdit,
  emptyHint,
}: Props) {
  const [editing, setEditing] = useState<EditableWorkRecord[] | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // 保存・削除後のトーストは数秒で自然に消す。
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  const grouped = groupByDate(groupRecords(items));

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
          <p className="mt-1.5 text-sm text-foreground-tertiary">{emptyHint}</p>
        </div>
      ) : (
        grouped.map(([date, groups]) => (
          <section key={date}>
            <h2 className="mb-2 flex items-baseline justify-between px-1 text-sm font-semibold text-foreground-secondary">
              {formatDayLabel(date)}
              <span className="text-xs font-normal text-foreground-tertiary">
                {groups.length}件
              </span>
            </h2>
            <div className="surface-card divide-y divide-separator overflow-hidden">
              {groups.map((group) => {
                const timeLabel = buildTimeLabel(group);
                const subLabel = [
                  group.cropName,
                  group.fieldNames.join("、") || null,
                  group.memo,
                ]
                  .filter(Boolean)
                  .join(" ・ ");
                const content = (
                  <>
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-medium text-foreground">
                        {group.workerName}
                        <span className="ml-2 font-normal text-foreground-secondary">
                          {group.workTypeLabel ?? "作業未設定"}
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
                      {canEdit && (
                        <IconChevronRight className="h-4 w-4 text-foreground-tertiary" />
                      )}
                    </div>
                  </>
                );

                return canEdit ? (
                  <button
                    key={group.key}
                    type="button"
                    onClick={() => setEditing(group.records)}
                    className="control-focus flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left transition-colors active:bg-surface-secondary"
                  >
                    {content}
                  </button>
                ) : (
                  <div
                    key={group.key}
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
        <RecordEditSheet
          key={editing.map((record) => record.id).join(",")}
          records={editing}
          workers={workers}
          workCategories={workCategories}
          workTypes={workTypes}
          fields={fields}
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
