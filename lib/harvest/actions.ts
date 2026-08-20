"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireRecordEditor } from "@/lib/auth/guards";
import type { HarvestMutationResult, HarvestRecordInput } from "./types";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function toTextOrNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function revalidateHarvestPages() {
  revalidatePath("/harvest");
  revalidatePath("/harvest/list");
  revalidatePath("/");
}

/**
 * 入力の検証。
 * Server Action は UI を経由せず直接 POST できるので、クライアント側とは別にここでも見る。
 */
function validate(input: HarvestRecordInput): string | null {
  if (!DATE_PATTERN.test(input.harvestDate)) {
    return "収穫日を選択してください。";
  }
  if (!input.fieldId) return "圃場を選択してください。";
  if (!input.cropId) return "作物を選択してください。";

  const quantity = Number(input.quantity);
  if (input.quantity.trim() === "" || !Number.isFinite(quantity)) {
    return "収穫量を数字で入力してください。";
  }
  if (quantity < 0) return "収穫量に負の数は入力できません。";
  if (input.unit.trim() === "") return "単位が設定されていません。";

  return null;
}

export async function createHarvestRecord(
  input: HarvestRecordInput,
): Promise<HarvestMutationResult> {
  const auth = await requireRecordEditor();
  if (!auth.ok) return auth;

  const invalid = validate(input);
  if (invalid) return { ok: false, message: invalid };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("harvest_records").insert({
    harvest_date: input.harvestDate,
    field_id: input.fieldId,
    crop_id: input.cropId,
    planting_id: input.plantingId,
    quantity: Number(input.quantity),
    unit: input.unit.trim(),
    worker_id: input.workerId,
    memo: toTextOrNull(input.memo),
    created_by_worker_id: auth.workerId,
  });

  if (error) {
    return { ok: false, message: `登録に失敗しました（${error.message}）。` };
  }

  revalidateHarvestPages();
  return { ok: true };
}

export async function updateHarvestRecord(
  input: HarvestRecordInput,
): Promise<HarvestMutationResult> {
  const auth = await requireRecordEditor();
  if (!auth.ok) return auth;

  if (!input.id) {
    return { ok: false, message: "対象の収穫記録が特定できません。" };
  }
  const invalid = validate(input);
  if (invalid) return { ok: false, message: invalid };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("harvest_records")
    .update({
      harvest_date: input.harvestDate,
      field_id: input.fieldId,
      crop_id: input.cropId,
      planting_id: input.plantingId,
      quantity: Number(input.quantity),
      unit: input.unit.trim(),
      worker_id: input.workerId,
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
      message: "対象の収穫記録が見つかりません。すでに削除された可能性があります。",
    };
  }

  revalidateHarvestPages();
  return { ok: true };
}

/** 他と同じく物理削除はせず deleted_at を立てる。 */
export async function deleteHarvestRecord(
  id: string,
): Promise<HarvestMutationResult> {
  const auth = await requireRecordEditor();
  if (!auth.ok) return auth;

  if (!id) return { ok: false, message: "対象の収穫記録が特定できません。" };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("harvest_records")
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
      message: "対象の収穫記録が見つかりません。すでに削除された可能性があります。",
    };
  }

  revalidateHarvestPages();
  return { ok: true };
}
