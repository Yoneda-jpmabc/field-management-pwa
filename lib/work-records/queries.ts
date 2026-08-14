import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  EditableWorkRecord,
  MasterOption,
  WorkTypeSuggestion,
} from "./types";

/**
 * 入力画面が必要とするマスタ類をまとめて取得する。
 * カードごとに別々に取りに行くとウォーターフォールになるため、ここで並列に投げる。
 */
export type WorkRecordFormData = {
  workers: MasterOption[];
  workTypes: MasterOption[];
  fields: MasterOption[];
  crops: MasterOption[];
  workTypeSuggestions: WorkTypeSuggestion[];
  /** マスタ取得に失敗した場合のメッセージ。null なら成功。 */
  errorMessage: string | null;
};

export async function fetchWorkRecordFormData(): Promise<WorkRecordFormData> {
  const supabase = await createSupabaseServerClient();

  const [
    workersResult,
    workTypesResult,
    fieldsResult,
    cropsResult,
    suggestionsResult,
  ] = await Promise.all([
      supabase
        .from("workers")
        .select("id, name, short_name")
        .is("deleted_at", null)
        .eq("is_active", true)
        .order("display_order")
        .order("name"),
      supabase
        .from("work_type_master")
        .select("id, name")
        .is("deleted_at", null)
        .eq("is_active", true)
        .order("display_order")
        .order("name"),
      supabase
        .from("fields")
        .select("id, name")
        .is("deleted_at", null)
        .eq("is_active", true)
        .order("display_order")
        .order("name"),
      supabase
        .from("crops")
        .select("id, name")
        .is("deleted_at", null)
        .eq("is_active", true)
        .order("display_order")
        .order("name"),
      supabase
        .from("work_type_raw_stats")
        .select("work_type_raw, record_count")
        .order("record_count", { ascending: false })
        .limit(30),
    ]);

  const failure =
    workersResult.error ??
    workTypesResult.error ??
    fieldsResult.error ??
    cropsResult.error ??
    suggestionsResult.error;

  return {
    workers: (workersResult.data ?? []).map((row) => ({
      id: row.id,
      label: row.short_name ?? row.name,
    })),
    workTypes: (workTypesResult.data ?? []).map((row) => ({
      id: row.id,
      label: row.name,
    })),
    fields: (fieldsResult.data ?? []).map((row) => ({
      id: row.id,
      label: row.name,
    })),
    crops: (cropsResult.data ?? []).map((row) => ({
      id: row.id,
      label: row.name,
    })),
    workTypeSuggestions: (suggestionsResult.data ?? []).flatMap((row) =>
      row.work_type_raw
        ? [{ value: row.work_type_raw, count: row.record_count ?? 0 }]
        : [],
    ),
    errorMessage: failure ? `マスタの取得に失敗しました（${failure.message}）。` : null,
  };
}

/** 集計画面が使う 3 断面。単位は分で保持し、時間への変換は表示側で行う。 */
export type WorkSummary = {
  byWorker: {
    workerId: string;
    workerName: string;
    totalMinutes: number;
    recordCount: number;
    untimedCount: number;
  }[];
  byWorkType: {
    workTypeLabel: string;
    totalMinutes: number;
    recordCount: number;
    untimedCount: number;
  }[];
  byWorkerAndType: {
    workerId: string;
    workerName: string;
    workTypeLabel: string;
    totalMinutes: number;
    recordCount: number;
    untimedCount: number;
  }[];
  totalMinutes: number;
  recordCount: number;
  untimedCount: number;
  errorMessage: string | null;
};

/**
 * 指定期間の集計を取得する。
 * 年単位だと生レコードが数千件になりうるため、集約は DB 側の関数に寄せている。
 */
export async function fetchWorkSummary(
  fromDate: string,
  toDate: string,
): Promise<WorkSummary> {
  const supabase = await createSupabaseServerClient();
  const args = { from_date: fromDate, to_date: toDate };

  const [byWorkerResult, byWorkTypeResult, byWorkerAndTypeResult] =
    await Promise.all([
      supabase.rpc("work_summary_by_worker", args),
      supabase.rpc("work_summary_by_work_type", args),
      supabase.rpc("work_summary_by_worker_and_type", args),
    ]);

  const failure =
    byWorkerResult.error ??
    byWorkTypeResult.error ??
    byWorkerAndTypeResult.error;

  const byWorker = (byWorkerResult.data ?? []).map((row) => ({
    workerId: row.worker_id,
    workerName: row.worker_name,
    totalMinutes: Number(row.total_minutes),
    recordCount: Number(row.record_count),
    untimedCount: Number(row.untimed_count),
  }));

  return {
    byWorker,
    byWorkType: (byWorkTypeResult.data ?? []).map((row) => ({
      workTypeLabel: row.work_type_label,
      totalMinutes: Number(row.total_minutes),
      recordCount: Number(row.record_count),
      untimedCount: Number(row.untimed_count),
    })),
    byWorkerAndType: (byWorkerAndTypeResult.data ?? []).map((row) => ({
      workerId: row.worker_id,
      workerName: row.worker_name,
      workTypeLabel: row.work_type_label,
      totalMinutes: Number(row.total_minutes),
      recordCount: Number(row.record_count),
      untimedCount: Number(row.untimed_count),
    })),
    // 全体合計は作業者別の合計から出す（作業種類別と二重に数えないため）
    totalMinutes: byWorker.reduce((sum, row) => sum + row.totalMinutes, 0),
    recordCount: byWorker.reduce((sum, row) => sum + row.recordCount, 0),
    untimedCount: byWorker.reduce((sum, row) => sum + row.untimedCount, 0),
    errorMessage: failure ? `集計の取得に失敗しました（${failure.message}）。` : null,
  };
}

export type WorkRecordListItem = {
  id: string;
  workDate: string;
  workerName: string;
  fieldName: string | null;
  cropName: string | null;
  workTypeLabel: string;
  timeLabel: string | null;
  memo: string | null;
};

export type WorkRecordList = {
  items: WorkRecordListItem[];
  errorMessage: string | null;
};

/** "08:00:00" → "08:00"。秒は入力していないので落とす。 */
function trimSeconds(time: string | null): string | null {
  return time ? time.slice(0, 5) : null;
}

function buildTimeLabel(start: string | null, end: string | null): string | null {
  const from = trimSeconds(start);
  const to = trimSeconds(end);
  if (from && to) return `${from} 〜 ${to}`;
  if (from) return `${from} 〜`;
  if (to) return `〜 ${to}`;
  return null;
}

/** 一覧表示用に、作業者・圃場・作業種類の名前を引き当てて返す。 */
export async function fetchWorkRecords(limit = 100): Promise<WorkRecordList> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("work_records")
    .select(
      "id, work_date, start_time, end_time, memo, work_type_raw, workers(name, short_name), fields(name), crops(name), work_type_master(name)",
    )
    .is("deleted_at", null)
    .order("work_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  return {
    items: (data ?? []).map((row) => ({
      id: row.id,
      workDate: row.work_date,
      workerName: row.workers?.short_name ?? row.workers?.name ?? "不明",
      fieldName: row.fields?.name ?? null,
      cropName: row.crops?.name ?? null,
      workTypeLabel:
        row.work_type_master?.name ?? row.work_type_raw?.trim() ?? "未設定",
      timeLabel: buildTimeLabel(row.start_time, row.end_time),
      memo: row.memo,
    })),
    errorMessage: error
      ? `作業記録の取得に失敗しました（${error.message}）。`
      : null,
  };
}

export type EditableWorkRecordList = {
  items: EditableWorkRecord[];
  errorMessage: string | null;
};

/**
 * 確認タブ用に、指定期間の登録済みレコードを編集可能な形で取得する。
 * ID と表示名の両方を返すので、一覧表示とボトムシートでの編集の両方に使える。
 */
export async function fetchEditableWorkRecords(
  fromDate: string,
  toDate: string,
): Promise<EditableWorkRecordList> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("work_records")
    .select(
      "id, work_date, start_time, end_time, work_type_id, work_type_raw, field_id, crop_id, worker_id, memo, workers(name, short_name), fields(name), crops(name), work_type_master(name)",
    )
    .is("deleted_at", null)
    .gte("work_date", fromDate)
    .lte("work_date", toDate)
    .order("work_date", { ascending: false })
    .order("start_time", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  return {
    items: (data ?? []).map((row) => ({
      id: row.id,
      workDate: row.work_date,
      startTime: trimSeconds(row.start_time) ?? "",
      endTime: trimSeconds(row.end_time) ?? "",
      workTypeId: row.work_type_id,
      workTypeRaw: row.work_type_raw ?? "",
      fieldId: row.field_id,
      cropId: row.crop_id,
      workerId: row.worker_id,
      memo: row.memo ?? "",
      workerName: row.workers?.short_name ?? row.workers?.name ?? "不明",
      workTypeLabel:
        row.work_type_master?.name ?? row.work_type_raw?.trim() ?? null,
      fieldName: row.fields?.name ?? null,
      cropName: row.crops?.name ?? null,
    })),
    errorMessage: error
      ? `作業実績の取得に失敗しました（${error.message}）。`
      : null,
  };
}

/** ダッシュボード用の件数。ヘッダーだけ取れば十分なので head: true で数える。 */
export async function countWorkRecordsOn(workDate: string): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const { count } = await supabase
    .from("work_records")
    .select("id", { count: "exact", head: true })
    .is("deleted_at", null)
    .eq("work_date", workDate);
  return count ?? 0;
}

export async function countWorkers(): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const { count } = await supabase
    .from("workers")
    .select("id", { count: "exact", head: true })
    .is("deleted_at", null)
    .eq("is_active", true);
  return count ?? 0;
}
