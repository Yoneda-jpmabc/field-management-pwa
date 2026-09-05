"use client";

import { useEffect, useState } from "react";
import { IconAlertTriangle } from "@/components/icons";
import { formatHours } from "@/lib/work-records/period";
import { recordDurationMinutes, timeToMinutes } from "@/lib/work-records/time";
import type {
  EditableWorkRecord,
  MasterOption,
  WorkCategoryOption,
  WorkTypeOption,
} from "@/lib/work-records/types";
import { groupRecords, type RecordGroup } from "./RecordListPanel";
import { RecordEditSheet } from "./RecordEditSheet";

type Props = {
  items: EditableWorkRecord[];
  workers: MasterOption[];
  workCategories: WorkCategoryOption[];
  workTypes: WorkTypeOption[];
  fields: MasterOption[];
  /** 行をタップして修正できるか。閲覧のみの人は見るだけ。 */
  canEdit: boolean;
  /** 空のときの案内文。権限によって「登録タブから追加」と言えないため差し替える。 */
  emptyHint: string;
};

// TimeWheel（実績登録の時刻ホイール）と同じ 5〜22 時の範囲に揃える。
const START_HOUR = 5;
const END_HOUR = 22;
const START_MIN = START_HOUR * 60;
const END_MIN = END_HOUR * 60;
const RANGE_MIN = END_MIN - START_MIN;
const TICK_HOURS = [6, 9, 12, 15, 18, 21];

function percentFor(minute: number): number {
  const clamped = Math.min(Math.max(minute, START_MIN), END_MIN);
  return ((clamped - START_MIN) / RANGE_MIN) * 100;
}

type Segment = {
  group: RecordGroup;
  leftPct: number;
  widthPct: number;
  timeLabel: string;
};

type WorkerRow = {
  workerId: string;
  workerName: string;
  segments: Segment[];
  /** 開始・終了のどちらかが未入力、または終了が開始以前でバーに置けない記録。 */
  untimed: RecordGroup[];
  totalMinutes: number;
};

/**
 * 確認タブの一覧と同じグループ（batchId＋作業者）を、今度は作業者ごとの
 * 行にまとめ直す。時間に置ける記録はバーへ、置けない記録は警告バッジへ回す。
 */
function buildWorkerRows(groups: RecordGroup[]): WorkerRow[] {
  const rows = new Map<string, WorkerRow>();
  const order: string[] = [];
  for (const group of groups) {
    let row = rows.get(group.workerId);
    if (!row) {
      row = {
        workerId: group.workerId,
        workerName: group.workerName,
        segments: [],
        untimed: [],
        totalMinutes: 0,
      };
      rows.set(group.workerId, row);
      order.push(group.workerId);
    }

    const hasValidRange =
      group.startTime !== "" &&
      group.endTime !== "" &&
      group.endTime > group.startTime;

    if (hasValidRange) {
      const leftPct = percentFor(timeToMinutes(group.startTime));
      const rightPct = percentFor(timeToMinutes(group.endTime));
      row.segments.push({
        group,
        leftPct,
        widthPct: Math.max(rightPct - leftPct, 0.6),
        timeLabel: `${group.startTime}〜${group.endTime}`,
      });
      row.totalMinutes +=
        recordDurationMinutes(
          group.startTime,
          group.endTime,
          group.worksThroughLunch,
        ) ?? 0;
    } else {
      row.untimed.push(group);
    }
  }
  return order.map((id) => rows.get(id)!);
}

/**
 * 確認タブ（日ごと）の本体。区分・作業種類ではなく作業者を行にした
 * 簡易ガントチャートで、「誰が何時から何時まで・合計何時間働いたか」と、
 * 時間の抜け（入力ミスの疑い）を一目で見せる。バーをタップすると
 * 一覧と同じ編集シートが開く。
 */
export function WorkerTimelinePanel({
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

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  const rows = buildWorkerRows(groupRecords(items));

  return (
    <div className="flex flex-col gap-4 pb-4">
      {notice && (
        <p
          role="status"
          className="rounded-[10px] bg-success-bg px-4 py-3 text-sm text-success"
        >
          {notice}
        </p>
      )}

      {rows.length === 0 ? (
        <div className="surface-card p-6 text-center">
          <p className="text-sm text-foreground-secondary">
            この期間に登録された実績はありません。
          </p>
          <p className="mt-1.5 text-sm text-foreground-tertiary">
            {emptyHint}
          </p>
        </div>
      ) : (
        <div className="surface-card p-4">
          {/* 時刻の目盛り。下の行と同じ列幅で揃えることで、バーの位置と一致させる。 */}
          <div className="flex items-center gap-2">
            <div className="w-16 shrink-0" />
            <div className="relative h-4 flex-1">
              {TICK_HOURS.map((hour) => (
                <span
                  key={hour}
                  className="absolute -translate-x-1/2 text-[10px] tabular-nums text-foreground-tertiary"
                  style={{ left: `${percentFor(hour * 60)}%` }}
                >
                  {hour}
                </span>
              ))}
            </div>
            <div className="w-20 shrink-0" />
          </div>

          <div className="mt-2 flex flex-col gap-3">
            {rows.map((row) => (
              <div key={row.workerId} className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-16 shrink-0 truncate text-[15px] font-bold text-foreground">
                    {row.workerName}
                  </span>

                  <div className="relative h-11 flex-1 overflow-hidden rounded-[8px] bg-surface-secondary">
                    {TICK_HOURS.map((hour) => (
                      <div
                        key={hour}
                        aria-hidden
                        className="absolute inset-y-0 w-px bg-separator"
                        style={{ left: `${percentFor(hour * 60)}%` }}
                      />
                    ))}
                    {row.segments.map((segment) =>
                      canEdit ? (
                        <button
                          key={segment.group.key}
                          type="button"
                          aria-label={`${row.workerName} ${segment.timeLabel} ${
                            segment.group.workTypeLabel ?? "作業未設定"
                          }`}
                          onClick={() => setEditing(segment.group.records)}
                          className="control-focus absolute inset-y-[10px]"
                          style={{
                            left: `calc(${segment.leftPct}% + 1px)`,
                            width: `calc(${segment.widthPct}% - 2px)`,
                          }}
                        >
                          <span className="block h-full w-full rounded-[4px] bg-accent active:bg-accent-hover" />
                        </button>
                      ) : (
                        <div
                          key={segment.group.key}
                          className="absolute inset-y-[10px] rounded-[4px] bg-accent"
                          style={{
                            left: `calc(${segment.leftPct}% + 1px)`,
                            width: `calc(${segment.widthPct}% - 2px)`,
                          }}
                        />
                      ),
                    )}
                  </div>

                  <span className="w-20 shrink-0 text-right text-[13px] tabular-nums text-foreground-secondary">
                    {row.totalMinutes > 0 ? formatHours(row.totalMinutes) : "―"}
                  </span>
                </div>

                {row.untimed.length > 0 && (
                  <div className="ml-[72px] flex flex-wrap gap-2">
                    {row.untimed.map((group) => {
                      const label = `${group.workTypeLabel ?? "作業未設定"}・時間未設定`;
                      return canEdit ? (
                        <button
                          key={group.key}
                          type="button"
                          onClick={() => setEditing(group.records)}
                          className="control-focus pressable flex min-h-11 items-center gap-1 rounded-full bg-warning-bg px-3 text-[13px] font-medium text-warning"
                        >
                          <IconAlertTriangle className="h-3.5 w-3.5 shrink-0" />
                          {label}
                        </button>
                      ) : (
                        <span
                          key={group.key}
                          className="flex min-h-11 items-center gap-1 rounded-full bg-warning-bg px-3 text-[13px] font-medium text-warning"
                        >
                          <IconAlertTriangle className="h-3.5 w-3.5 shrink-0" />
                          {label}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
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
