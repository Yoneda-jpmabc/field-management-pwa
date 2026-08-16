"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireRecordEditor } from "@/lib/auth/guards";
import type { TablesInsert } from "@/lib/supabase/database.types";
import type {
  CreateWorkRecordsInput,
  CreateWorkRecordsResult,
  UpdateWorkRecordInput,
  WorkRecordMutationResult,
} from "./types";

/** 空文字を time カラム用の null に落とす。 */
function toTimeOrNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function toTextOrNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * 管理者一括入力モデルの登録処理。
 * 選択された作業者の人数分 work_records に行を作り、同じ batch_id を振る。
 * batch_id があると「さっきまとめて入れた分」を後から一括で直せる。
 *
 * Server Action は UI を経由せず直接 POST できるため、クライアント側の
 * バリデーションとは別にここでも検証している。
 */
export async function createWorkRecords(
  input: CreateWorkRecordsInput,
): Promise<CreateWorkRecordsResult> {
  const auth = await requireRecordEditor();
  if (!auth.ok) return auth;

  if (!DATE_PATTERN.test(input.workDate)) {
    return { ok: false, message: "作業日を選択してください。" };
  }

  const workerIds = [...new Set(input.selectedWorkerIds)].filter(Boolean);
  if (workerIds.length === 0) {
    return { ok: false, message: "作業者を1人以上選択してください。" };
  }

  const startTime = toTimeOrNull(input.startTime);
  const endTime = toTimeOrNull(input.endTime);

  const batchId = crypto.randomUUID();
  const rows: TablesInsert<"work_records">[] = workerIds.map((workerId) => ({
    worker_id: workerId,
    work_date: input.workDate,
    start_time: startTime,
    end_time: endTime,
    work_type_id: input.workTypeId,
    work_type_raw: toTextOrNull(input.workTypeRaw),
    field_id: input.fieldId,
    crop_id: input.cropId,
    memo: toTextOrNull(input.memo),
    batch_id: batchId,
  }));

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("work_records").insert(rows);

  if (error) {
    return { ok: false, message: `登録に失敗しました（${error.message}）。` };
  }

  revalidateWorkRecordPages();

  return { ok: true, insertedCount: rows.length, batchId };
}

const TIME_PATTERN = /^\d{2}:\d{2}$/;

function revalidateWorkRecordPages() {
  revalidatePath("/records");
  revalidatePath("/records/list");
  revalidatePath("/records/summary");
  revalidatePath("/logs");
}

/**
 * 登録済みレコード 1 件の更新。
 * Server Action は UI を経由せず直接 POST できるため、ここでも検証する。
 */
export async function updateWorkRecord(
  input: UpdateWorkRecordInput,
): Promise<WorkRecordMutationResult> {
  const auth = await requireRecordEditor();
  if (!auth.ok) return auth;

  if (!input.id) {
    return { ok: false, message: "対象のレコードが特定できません。" };
  }
  if (!DATE_PATTERN.test(input.workDate)) {
    return { ok: false, message: "作業日を選択してください。" };
  }
  if (!input.workerId) {
    return { ok: false, message: "作業者を選択してください。" };
  }

  const startTime = toTimeOrNull(input.startTime);
  const endTime = toTimeOrNull(input.endTime);
  if (
    (startTime !== null && !TIME_PATTERN.test(startTime)) ||
    (endTime !== null && !TIME_PATTERN.test(endTime))
  ) {
    return { ok: false, message: "時刻の形式が正しくありません。" };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("work_records")
    .update({
      worker_id: input.workerId,
      work_date: input.workDate,
      start_time: startTime,
      end_time: endTime,
      work_type_id: input.workTypeId,
      work_type_raw: toTextOrNull(input.workTypeRaw),
      field_id: input.fieldId,
      crop_id: input.cropId,
      memo: toTextOrNull(input.memo),
    })
    .eq("id", input.id)
    .is("deleted_at", null)
    .select("id");

  if (error) {
    return { ok: false, message: `更新に失敗しました（${error.message}）。` };
  }
  if (!data || data.length === 0) {
    return {
      ok: false,
      message: "対象のレコードが見つかりません。すでに削除された可能性があります。",
    };
  }

  revalidateWorkRecordPages();
  return { ok: true };
}

/**
 * 登録済みレコード 1 件の削除。
 * 物理削除はせず deleted_at を立てる（既存の一覧・集計はすべて deleted_at is null で見ている）。
 */
export async function deleteWorkRecord(
  id: string,
): Promise<WorkRecordMutationResult> {
  const auth = await requireRecordEditor();
  if (!auth.ok) return auth;

  if (!id) {
    return { ok: false, message: "対象のレコードが特定できません。" };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("work_records")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null)
    .select("id");

  if (error) {
    return { ok: false, message: `削除に失敗しました（${error.message}）。` };
  }
  if (!data || data.length === 0) {
    return {
      ok: false,
      message: "対象のレコードが見つかりません。すでに削除された可能性があります。",
    };
  }

  revalidateWorkRecordPages();
  return { ok: true };
}
