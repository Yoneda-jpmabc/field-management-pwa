import { createSupabaseServerClient } from "@/lib/supabase/server";
import { snapTimeToStep } from "./time";
import type {
  EditableWorkRecord,
  MasterOption,
  WorkCategoryOption,
  WorkerOption,
  WorkTypeOption,
  WorkTypeSuggestion,
} from "./types";

/**
 * 入力画面が必要とするマスタ類をまとめて取得する。
 * カードごとに別々に取りに行くとウォーターフォールになるため、ここで並列に投げる。
 */
export type WorkRecordFormData = {
  workers: WorkerOption[];
  workCategories: WorkCategoryOption[];
  workTypes: WorkTypeOption[];
  fields: MasterOption[];
  /**
   * 圃場ごとに、いま作付け中（finished 以外）の作物 id。
   * 区分を選んだときに該当する圃場だけへ絞り込むために使う。
   */
  fieldCropIds: Record<string, string[]>;
  /** 作業予定（work-plans）側の作物ピッカーがそのまま使うので残してある。 */
  crops: MasterOption[];
  workTypeSuggestions: WorkTypeSuggestion[];
  /**
   * 開始・終了時刻の候補（"HH:MM"、最大 8 件、表示は時間の早い順）。
   * 「よく使う」＋「最近使った」を混ぜて選ぶ。
   */
  startTimeSuggestions: string[];
  endTimeSuggestions: string[];
  /** マスタ取得に失敗した場合のメッセージ。null なら成功。 */
  errorMessage: string | null;
};

/**
 * 新しい順に並んだ時刻文字列の配列から、候補を上位 limit 件選ぶ。
 * スコア = 使用回数（頻度）＋ 直近ぶんの加点（新しい記録ほど大きい）。
 * これで「多く使われている時刻」と「最近使った時刻」の両方が上位に来る。
 * 表示は時間の早い順に並べ、旧 10 分刻みの記録は 30 分グリッドに丸める。
 */
const RECENCY_WINDOW = 120; // この件数までの新しさに応じて加点する。
const RECENCY_WEIGHT = 4; // 最新の 1 件が持つ加点の最大値。

function rankTimes(values: (string | null)[], limit = 8): string[] {
  const scores = new Map<string, number>();
  values.forEach((value, index) => {
    if (!value) return;
    const snapped = snapTimeToStep(value.slice(0, 5));
    if (!/^\d{2}:\d{2}$/.test(snapped)) return;
    const recency =
      Math.max(0, (RECENCY_WINDOW - index) / RECENCY_WINDOW) * RECENCY_WEIGHT;
    scores.set(snapped, (scores.get(snapped) ?? 0) + 1 + recency);
  });
  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([time]) => time)
    .sort((a, b) => a.localeCompare(b));
}

export async function fetchWorkRecordFormData(): Promise<WorkRecordFormData> {
  const supabase = await createSupabaseServerClient();

  const [
    workersResult,
    workCategoriesResult,
    workTypesResult,
    fieldsResult,
    cropsResult,
    suggestionsResult,
    timeRowsResult,
    plantingsResult,
  ] = await Promise.all([
      supabase
        .from("workers")
        .select("id, name, short_name, employment_type")
        .is("deleted_at", null)
        .eq("is_active", true)
        .order("display_order")
        .order("name"),
      supabase
        .from("work_category_master")
        .select("id, name, crop_id")
        .is("deleted_at", null)
        .eq("is_active", true)
        .order("display_order")
        .order("name"),
      supabase
        .from("work_type_master")
        .select("id, name, category_id")
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
      // 開始・終了時刻の候補は集計ビューを用意せず、直近の記録から JS 側で数える。
      // 新しい順（登録日時まで見る）で取り、頻度＋直近で重み付けする。
      // 件数が増えても頭打ちになるよう直近 1000 件に絞る。
      supabase
        .from("work_records")
        .select("start_time, end_time")
        .is("deleted_at", null)
        .order("work_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1000),
      // 区分→圃場の絞り込み用。終わった作付け（finished）は対象から外す。
      supabase
        .from("field_plantings")
        .select("field_id, crop_id")
        .is("deleted_at", null)
        .neq("status", "finished"),
    ]);

  const failure =
    workersResult.error ??
    workCategoriesResult.error ??
    workTypesResult.error ??
    fieldsResult.error ??
    cropsResult.error ??
    suggestionsResult.error ??
    timeRowsResult.error ??
    plantingsResult.error;

  const fieldCropIds: Record<string, string[]> = {};
  for (const row of plantingsResult.data ?? []) {
    (fieldCropIds[row.field_id] ??= []).push(row.crop_id);
  }

  return {
    workers: (workersResult.data ?? []).map((row) => ({
      id: row.id,
      label: row.short_name ?? row.name,
      group: row.employment_type,
    })),
    workCategories: (workCategoriesResult.data ?? []).map((row) => ({
      id: row.id,
      label: row.name,
      cropId: row.crop_id,
    })),
    workTypes: (workTypesResult.data ?? []).map((row) => ({
      id: row.id,
      label: row.name,
      categoryId: row.category_id,
    })),
    fields: (fieldsResult.data ?? []).map((row) => ({
      id: row.id,
      label: row.name,
    })),
    fieldCropIds,
    crops: (cropsResult.data ?? []).map((row) => ({
      id: row.id,
      label: row.name,
    })),
    workTypeSuggestions: (suggestionsResult.data ?? []).flatMap((row) =>
      row.work_type_raw
        ? [{ value: row.work_type_raw, count: row.record_count ?? 0 }]
        : [],
    ),
    startTimeSuggestions: rankTimes(
      (timeRowsResult.data ?? []).map((row) => row.start_time),
    ),
    endTimeSuggestions: rankTimes(
      (timeRowsResult.data ?? []).map((row) => row.end_time),
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

/**
 * 一覧表示用に、作業者・圃場・作業種類の名前を引き当てて返す。
 * workerId を渡すと、その作業者の分だけに絞る（閲覧のみの人向け）。
 */
export async function fetchWorkRecords(
  limit = 100,
  workerId?: string,
): Promise<WorkRecordList> {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("work_records")
    .select(
      "id, work_date, start_time, end_time, memo, work_type_raw, workers(name, short_name), fields(name), crops(name), work_type_master(name)",
    )
    .is("deleted_at", null)
    .order("work_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (workerId) query = query.eq("worker_id", workerId);

  const { data, error } = await query;

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
 *
 * workerId を渡すと、その作業者の分だけに絞る（閲覧のみの人向け）。
 */
export async function fetchEditableWorkRecords(
  fromDate: string,
  toDate: string,
  workerId?: string,
): Promise<EditableWorkRecordList> {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("work_records")
    .select(
      "id, work_date, start_time, end_time, work_type_id, work_type_raw, field_id, crop_id, worker_id, memo, worked_through_lunch, batch_id, workers(name, short_name), fields(name), crops(name), work_type_master(name)",
    )
    .is("deleted_at", null)
    .gte("work_date", fromDate)
    .lte("work_date", toDate)
    .order("work_date", { ascending: false })
    .order("start_time", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  if (workerId) query = query.eq("worker_id", workerId);

  const { data, error } = await query;

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
      worksThroughLunch: row.worked_through_lunch,
      batchId: row.batch_id,
    })),
    errorMessage: error
      ? `作業実績の取得に失敗しました（${error.message}）。`
      : null,
  };
}
