"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireRecordEditor } from "@/lib/auth/guards";
import { calcDilution } from "./calc";
import type { DilutionCalcInput, DilutionMutationResult } from "./types";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function toTextOrNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function revalidateDilutionPages() {
  revalidatePath("/");
  revalidatePath("/pesticide");
}

/**
 * 入力の検証。
 * Server Action は UI を経由せず直接 POST できるので、クライアント側とは別にここでも見る。
 */
function validate(input: DilutionCalcInput): string | null {
  if (input.pesticideName.trim() === "") return "農薬名を入力してください。";
  if (!DATE_PATTERN.test(input.usedOn)) return "使用日を選択してください。";

  const ratio = Number(input.dilutionRatio);
  if (
    input.dilutionRatio.trim() === "" ||
    !Number.isFinite(ratio) ||
    ratio <= 0
  ) {
    return "希釈倍率を正しく入力してください。";
  }

  const target = Number(input.targetVolumeL);
  if (
    input.targetVolumeL.trim() === "" ||
    !Number.isFinite(target) ||
    target <= 0
  ) {
    return "散布量を正しく入力してください。";
  }

  return null;
}

export async function createDilutionRecord(
  input: DilutionCalcInput,
): Promise<DilutionMutationResult> {
  const auth = await requireRecordEditor();
  if (!auth.ok) return auth;

  const invalid = validate(input);
  if (invalid) return { ok: false, message: invalid };

  const result = calcDilution(
    Number(input.targetVolumeL),
    Number(input.dilutionRatio),
  );
  if (!result) {
    return { ok: false, message: "希釈倍率・散布量を正しく入力してください。" };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("pesticide_dilutions").insert({
    used_on: input.usedOn,
    pesticide_name: input.pesticideName.trim(),
    dilution_ratio: Number(input.dilutionRatio),
    target_volume_l: Number(input.targetVolumeL),
    stock_volume_ml: result.stockVolumeMl,
    water_volume_l: result.waterVolumeL,
    memo: toTextOrNull(input.memo),
    worker_id: auth.workerId,
  });

  if (error) {
    return { ok: false, message: `登録に失敗しました（${error.message}）。` };
  }

  revalidateDilutionPages();
  return { ok: true };
}

/** 他と同じく物理削除はせず deleted_at を立てる。 */
export async function deleteDilutionRecord(
  id: string,
): Promise<DilutionMutationResult> {
  const auth = await requireRecordEditor();
  if (!auth.ok) return auth;

  if (!id) return { ok: false, message: "対象の記録が特定できません。" };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("pesticide_dilutions")
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
      message: "対象の記録が見つかりません。すでに削除された可能性があります。",
    };
  }

  revalidateDilutionPages();
  return { ok: true };
}
