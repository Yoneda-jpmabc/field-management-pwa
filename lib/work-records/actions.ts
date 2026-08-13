"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { TablesInsert } from "@/lib/supabase/database.types";
import type { CreateWorkRecordsInput, CreateWorkRecordsResult } from "./types";

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
 * 認証導入後は、この先頭でセッション確認と created_by の設定を行うこと。
 */
export async function createWorkRecords(
  input: CreateWorkRecordsInput,
): Promise<CreateWorkRecordsResult> {
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

  revalidatePath("/records");
  revalidatePath("/records/summary");
  revalidatePath("/logs");

  return { ok: true, insertedCount: rows.length, batchId };
}
