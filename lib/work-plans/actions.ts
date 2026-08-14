"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  CreateWorkPlanInput,
  UpdateWorkPlanInput,
  WorkPlanMutationResult,
} from "./types";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function toTextOrNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function revalidatePlanPages() {
  revalidatePath("/");
}

/**
 * 入力の共通検証。
 * Server Action は UI を経由せず直接 POST できるため、クライアント側とは別にここでも見る。
 * 認証導入後は、各アクションの先頭でセッション確認と created_by の設定を行うこと。
 */
function validate(input: CreateWorkPlanInput): string | null {
  if (!DATE_PATTERN.test(input.planDate)) return "日付を選択してください。";
  if (input.title.trim() === "") return "予定の内容を入力してください。";
  return null;
}

export async function createWorkPlan(
  input: CreateWorkPlanInput,
): Promise<WorkPlanMutationResult> {
  const invalid = validate(input);
  if (invalid) return { ok: false, message: invalid };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("work_plans").insert({
    plan_date: input.planDate,
    title: input.title.trim(),
    crop_id: input.cropId,
    field_id: input.fieldId,
    memo: toTextOrNull(input.memo),
  });

  if (error) {
    return { ok: false, message: `登録に失敗しました（${error.message}）。` };
  }

  revalidatePlanPages();
  return { ok: true };
}

export async function updateWorkPlan(
  input: UpdateWorkPlanInput,
): Promise<WorkPlanMutationResult> {
  if (!input.id) {
    return { ok: false, message: "対象の予定が特定できません。" };
  }
  const invalid = validate(input);
  if (invalid) return { ok: false, message: invalid };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("work_plans")
    .update({
      plan_date: input.planDate,
      title: input.title.trim(),
      crop_id: input.cropId,
      field_id: input.fieldId,
      memo: toTextOrNull(input.memo),
      is_done: input.isDone,
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
      message: "対象の予定が見つかりません。すでに削除された可能性があります。",
    };
  }

  revalidatePlanPages();
  return { ok: true };
}

/** 予定の完了フラグだけを切り替える。カレンダー上のワンタップ操作用。 */
export async function toggleWorkPlanDone(
  id: string,
  isDone: boolean,
): Promise<WorkPlanMutationResult> {
  if (!id) return { ok: false, message: "対象の予定が特定できません。" };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("work_plans")
    .update({ is_done: isDone })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) {
    return { ok: false, message: `更新に失敗しました（${error.message}）。` };
  }

  revalidatePlanPages();
  return { ok: true };
}

/** 実績と同じく物理削除はせず deleted_at を立てる。 */
export async function deleteWorkPlan(
  id: string,
): Promise<WorkPlanMutationResult> {
  if (!id) return { ok: false, message: "対象の予定が特定できません。" };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("work_plans")
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
      message: "対象の予定が見つかりません。すでに削除された可能性があります。",
    };
  }

  revalidatePlanPages();
  return { ok: true };
}
