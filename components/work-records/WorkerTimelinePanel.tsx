"use client";

import { useEffect, useState } from "react";
import { IconAlertTriangle } from "@/components/icons";
import {
  recordDurationMinutes,
  spansLunchBreak,
  timeToMinutes,
} from "@/lib/work-records/time";
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
// 3時間おきの目盛りだけだと、間（7:30 など）がどこか目で追えないため、
// 1時間おきに補助目盛りを足す（定規の大目盛り・小目盛りのイメージ）。
const MAJOR_TICK_HOURS = [6, 9, 12, 15, 18, 21];
const MINOR_TICK_HOURS = Array.from(
  { length: END_HOUR - START_HOUR - 1 },
  (_, i) => START_HOUR + 1 + i,
).filter((hour) => !MAJOR_TICK_HOURS.includes(hour));

function percentFor(minute: number): number {
  const clamped = Math.min(Math.max(minute, START_MIN), END_MIN);
  return ((clamped - START_MIN) / RANGE_MIN) * 100;
}

/** 合計時間の表示用。行の幅を取るので「時間」ではなく短い "h" 表記にする。 */
function formatHoursShort(minutes: number): string {
  if (minutes <= 0) return "―";
  return `${Number((minutes / 60).toFixed(1))}h`;
}

/**
 * 区分の見分け用パレット（dataviz スキルの検証済みカテゴリカル配色から
 * 隣接ペアが CVD 安全な先頭 6 色）。区分マスタの並び順に固定で割り当てる。
 * 7 番目以降・区分が分からない記録は色を増やさず、無彩色の
 * foreground-tertiary（グレー）に畳む。
 */
const CATEGORY_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
];
const OTHER_COLOR = "var(--foreground-tertiary)";
const OTHER_LABEL = "その他";

type CategoryLookup = {
  colorFor: (group: RecordGroup) => string;
  labelFor: (group: RecordGroup) => string;
};

/**
 * 作業種類 → 区分 → 色 の対応表を作る。区分が分かる記録だけ色を持ち、
 * フリー入力など区分不明の記録は「その他」と同じグレーにまとめる。
 */
function buildCategoryLookup(
  workTypes: WorkTypeOption[],
  workCategories: WorkCategoryOption[],
): CategoryLookup {
  const categoryIdByWorkTypeId = new Map(
    workTypes.map((type) => [type.id, type.categoryId]),
  );
  const colorByCategoryId = new Map<string, string>();
  const labelByCategoryId = new Map<string, string>();
  workCategories.forEach((category, index) => {
    labelByCategoryId.set(category.id, category.label);
    if (index < CATEGORY_COLORS.length) {
      colorByCategoryId.set(category.id, CATEGORY_COLORS[index]);
    }
  });

  const categoryIdFor = (group: RecordGroup) =>
    group.workTypeId ? (categoryIdByWorkTypeId.get(group.workTypeId) ?? null) : null;

  return {
    colorFor: (group) => {
      const categoryId = categoryIdFor(group);
      return (categoryId && colorByCategoryId.get(categoryId)) || OTHER_COLOR;
    },
    labelFor: (group) => {
      const categoryId = categoryIdFor(group);
      return (categoryId && labelByCategoryId.get(categoryId)) || OTHER_LABEL;
    },
  };
}

type Segment = {
  group: RecordGroup;
  /** React の key 用。休憩をまたいで前後2本に割ると group.key が重複するため別に持つ。 */
  segmentKey: string;
  leftPct: number;
  widthPct: number;
  timeLabel: string;
  color: string;
  categoryLabel: string;
};

/**
 * 1 記録ぶんのバーを作る。12:00〜13:00 をまるごとまたぐ入力で、かつ
 * 「休憩を含まない」がオフ（＝休憩を取った扱い）のときは、集計と同じく
 * その1時間を差し引いて見せる必要があるため、バーも前後2本に割って
 * 昼休憩ぶんを空白にする。そうしないと、休憩を取ったはずの時間まで
 * 働いているように見えてしまう。
 */
function buildSegments(
  group: RecordGroup,
  color: string,
  categoryLabel: string,
): Segment[] {
  const toSegment = (segmentKey: string, from: string, to: string): Segment => {
    const leftPct = percentFor(timeToMinutes(from));
    const rightPct = percentFor(timeToMinutes(to));
    return {
      group,
      segmentKey,
      leftPct,
      widthPct: Math.max(rightPct - leftPct, 0.6),
      // バーごとの実際の見た目の区間を読み上げる（休憩で割った側は前後半だけ）。
      timeLabel: `${from}〜${to}`,
      color,
      categoryLabel,
    };
  };

  if (
    spansLunchBreak(group.startTime, group.endTime) &&
    !group.worksThroughLunch
  ) {
    return [
      toSegment(`${group.key}:am`, group.startTime, "12:00"),
      toSegment(`${group.key}:pm`, "13:00", group.endTime),
    ];
  }
  return [toSegment(group.key, group.startTime, group.endTime)];
}

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
function buildWorkerRows(
  groups: RecordGroup[],
  category: CategoryLookup,
): WorkerRow[] {
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
      row.segments.push(
        ...buildSegments(
          group,
          category.colorFor(group),
          category.labelFor(group),
        ),
      );
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

/** その日実際に使われた区分だけを、マスタの並び順で凡例に出す。 */
function buildLegend(
  rows: WorkerRow[],
  workCategories: WorkCategoryOption[],
): { label: string; color: string }[] {
  const used = new Set<string>();
  for (const row of rows) {
    for (const segment of row.segments) used.add(segment.categoryLabel);
  }
  const legend: { label: string; color: string }[] = [];
  workCategories.forEach((category, index) => {
    if (index < CATEGORY_COLORS.length && used.has(category.label)) {
      legend.push({ label: category.label, color: CATEGORY_COLORS[index] });
    }
  });
  if (used.has(OTHER_LABEL) || used.size > legend.length) {
    legend.push({ label: OTHER_LABEL, color: OTHER_COLOR });
  }
  return legend;
}

/**
 * 確認タブ（日ごと）の本体。区分・作業種類ではなく作業者を行にした
 * 簡易ガントチャートで、「誰が何時から何時まで・合計何時間働いたか」と、
 * 時間の抜け（入力ミスの疑い）を一目で見せる。バーの色は作業区分を表し、
 * タップすると一覧と同じ編集シートが開く。
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

  const category = buildCategoryLookup(workTypes, workCategories);
  const rows = buildWorkerRows(groupRecords(items), category);
  const legend = buildLegend(rows, workCategories);

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
        <div className="surface-card p-3.5">
          {legend.length > 1 && (
            <div className="mb-3 flex flex-wrap gap-x-3 gap-y-1.5 border-b border-separator pb-3">
              {legend.map((entry) => (
                <span
                  key={entry.label}
                  className="flex items-center gap-1.5 text-xs text-foreground-secondary"
                >
                  <span
                    aria-hidden
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  {entry.label}
                </span>
              ))}
            </div>
          )}

          {/* 時刻の目盛り。下の行と同じ列幅で揃えることで、バーの位置と一致させる。 */}
          <div className="flex items-center gap-1">
            <div className="w-14 shrink-0" />
            <div className="relative h-4 flex-1">
              {MAJOR_TICK_HOURS.map((hour) => (
                <span
                  key={hour}
                  className="absolute -translate-x-1/2 text-[10px] tabular-nums text-foreground-tertiary"
                  style={{ left: `${percentFor(hour * 60)}%` }}
                >
                  {hour}
                </span>
              ))}
            </div>
            <div className="w-14 shrink-0" />
          </div>

          <div className="mt-2 flex flex-col gap-2">
            {rows.map((row) => (
              <div key={row.workerId} className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                  <span className="w-14 shrink-0 truncate text-[15px] font-bold text-foreground">
                    {row.workerName}
                  </span>

                  <div className="relative h-8 flex-1 overflow-hidden rounded-[8px] bg-surface-secondary">
                    {/* 大目盛り（3時間おき・数字あり）は縦いっぱい、小目盛り（1時間おき）は短く。 */}
                    {MAJOR_TICK_HOURS.map((hour) => (
                      <div
                        key={hour}
                        aria-hidden
                        className="absolute inset-y-0 w-px bg-separator-strong"
                        style={{ left: `${percentFor(hour * 60)}%` }}
                      />
                    ))}
                    {MINOR_TICK_HOURS.map((hour) => (
                      <div
                        key={hour}
                        aria-hidden
                        className="absolute inset-y-2 w-px bg-separator-strong"
                        style={{ left: `${percentFor(hour * 60)}%` }}
                      />
                    ))}
                    {row.segments.map((segment) =>
                      canEdit ? (
                        <button
                          key={segment.segmentKey}
                          type="button"
                          aria-label={`${row.workerName} ${segment.timeLabel} ${segment.categoryLabel}・${
                            segment.group.workTypeLabel ?? "作業未設定"
                          }`}
                          onClick={() => setEditing(segment.group.records)}
                          className="control-focus pressable absolute inset-y-1 rounded-[4px]"
                          style={{
                            left: `calc(${segment.leftPct}% + 1px)`,
                            width: `calc(${segment.widthPct}% - 2px)`,
                            backgroundColor: segment.color,
                          }}
                        />
                      ) : (
                        <div
                          key={segment.segmentKey}
                          className="absolute inset-y-1 rounded-[4px]"
                          style={{
                            left: `calc(${segment.leftPct}% + 1px)`,
                            width: `calc(${segment.widthPct}% - 2px)`,
                            backgroundColor: segment.color,
                          }}
                        />
                      ),
                    )}
                  </div>

                  <span className="w-14 shrink-0 text-right text-[13px] tabular-nums text-foreground-secondary">
                    {formatHoursShort(row.totalMinutes)}
                  </span>
                </div>

                {row.untimed.length > 0 && (
                  <div className="ml-[60px] flex flex-wrap gap-2">
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
