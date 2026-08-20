"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireMasterEditor } from "@/lib/auth/guards";
import {
  PLANTING_STATUSES,
  type FieldInput,
  type HarvestMutationResult,
  type PlantingInput,
} from "@/lib/harvest/types";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function toTextOrNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

/**
 * 空文字を null に、それ以外を数値に落とす。
 * 数値として読めない文字列は「不正」として扱いたいので、undefined を返して呼び出し側で弾く。
 */
function toNumberOrNull(value: string): number | null | undefined {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;
  return parsed;
}

function revalidateFieldPages() {
  revalidatePath("/settings");
  revalidatePath("/harvest");
  revalidatePath("/records");
  revalidatePath("/");
}

// ---------------------------------------------------------------------------
// 圃場マスタ
// ---------------------------------------------------------------------------

function validateField(input: FieldInput): string | null {
  if (input.name.trim() === "") return "圃場名を入力してください。";
  if (toNumberOrNull(input.areaA) === undefined) {
    return "面積は 0 以上の数字で入力してください。";
  }
  if (toNumberOrNull(input.displayOrder) === undefined) {
    return "並び順は 0 以上の数字で入力してください。";
  }
  return null;
}

export async function saveField(
  input: FieldInput,
): Promise<HarvestMutationResult> {
  const auth = await requireMasterEditor();
  if (!auth.ok) return auth;

  const invalid = validateField(input);
  if (invalid) return { ok: false, message: invalid };

  const supabase = await createSupabaseServerClient();
  const values = {
    name: input.name.trim(),
    area_a: toNumberOrNull(input.areaA) ?? null,
    crop: toTextOrNull(input.crop),
    memo: toTextOrNull(input.memo),
    display_order: toNumberOrNull(input.displayOrder) ?? 0,
  };

  if (input.id) {
    const { data, error } = await supabase
      .from("fields")
      .update(values)
      .eq("id", input.id)
      .is("deleted_at", null)
      .select("id");

    if (error) {
      return { ok: false, message: `更新に失敗しました（${error.message}）。` };
    }
    if (!data || data.length === 0) {
      return {
        ok: false,
        message: "対象の圃場が見つかりません。すでに削除された可能性があります。",
      };
    }
  } else {
    const { error } = await supabase.from("fields").insert(values);
    if (error) {
      return { ok: false, message: `登録に失敗しました（${error.message}）。` };
    }
  }

  revalidateFieldPages();
  return { ok: true };
}

/**
 * 圃場の論理削除。
 * 実績・収穫から参照されているため物理削除はしない（過去の記録が引けなくなる）。
 */
export async function deleteField(id: string): Promise<HarvestMutationResult> {
  const auth = await requireMasterEditor();
  if (!auth.ok) return auth;

  if (!id) return { ok: false, message: "対象の圃場が特定できません。" };

  const supabase = await createSupabaseServerClient();

  // 生きている作付が残ったまま圃場を消すと、収穫画面から辿れない作付が残る。
  const { count } = await supabase
    .from("field_plantings")
    .select("id", { count: "exact", head: true })
    .eq("field_id", id)
    .is("deleted_at", null);

  if ((count ?? 0) > 0) {
    return {
      ok: false,
      message: `この圃場にはまだ作付が${count}件あります。先に作付を削除してください。`,
    };
  }

  const { data, error } = await supabase
    .from("fields")
    .update({ deleted_at: new Date().toISOString(), is_active: false })
    .eq("id", id)
    .is("deleted_at", null)
    .select("id");

  if (error) {
    return { ok: false, message: `削除に失敗しました（${error.message}）。` };
  }
  if (!data || data.length === 0) {
    return {
      ok: false,
      message: "対象の圃場が見つかりません。すでに削除された可能性があります。",
    };
  }

  revalidateFieldPages();
  return { ok: true };
}

// ---------------------------------------------------------------------------
// 作付情報
// ---------------------------------------------------------------------------

function validatePlanting(input: PlantingInput): string | null {
  if (!input.fieldId) return "圃場を選択してください。";
  if (!input.cropId) return "作物を選択してください。";
  if (input.plantedOn !== "" && !DATE_PATTERN.test(input.plantedOn)) {
    return "定植日の形式が正しくありません。";
  }
  if (!(PLANTING_STATUSES as readonly string[]).includes(input.status)) {
    return "状態の指定が正しくありません。";
  }
  if (toNumberOrNull(input.plantCount) === undefined) {
    return "株数は 0 以上の数字で入力してください。";
  }
  if (toNumberOrNull(input.areaA) === undefined) {
    return "作付面積は 0 以上の数字で入力してください。";
  }
  if (toNumberOrNull(input.expectedQuantity) === undefined) {
    return "収穫見込み量は 0 以上の数字で入力してください。";
  }
  return null;
}

export async function savePlanting(
  input: PlantingInput,
): Promise<HarvestMutationResult> {
  const auth = await requireMasterEditor();
  if (!auth.ok) return auth;

  const invalid = validatePlanting(input);
  if (invalid) return { ok: false, message: invalid };

  const plantCount = toNumberOrNull(input.plantCount) ?? null;

  const supabase = await createSupabaseServerClient();
  const values = {
    field_id: input.fieldId,
    crop_id: input.cropId,
    planted_on: input.plantedOn === "" ? null : input.plantedOn,
    // 株数は整数列なので、小数を入れられた場合に備えて丸める。
    plant_count: plantCount === null ? null : Math.round(plantCount),
    area_a: toNumberOrNull(input.areaA) ?? null,
    expected_quantity: toNumberOrNull(input.expectedQuantity) ?? null,
    status: input.status,
    memo: toTextOrNull(input.memo),
  };

  if (input.id) {
    const { data, error } = await supabase
      .from("field_plantings")
      .update(values)
      .eq("id", input.id)
      .is("deleted_at", null)
      .select("id");

    if (error) {
      return { ok: false, message: `更新に失敗しました（${error.message}）。` };
    }
    if (!data || data.length === 0) {
      return {
        ok: false,
        message: "対象の作付が見つかりません。すでに削除された可能性があります。",
      };
    }
  } else {
    const { error } = await supabase.from("field_plantings").insert(values);
    if (error) {
      return { ok: false, message: `登録に失敗しました（${error.message}）。` };
    }
  }

  revalidateFieldPages();
  return { ok: true };
}

/**
 * 作付の論理削除。
 * 収穫記録の planting_id から参照されるので物理削除はしない。
 * 記録側は planting_id を残したままになり、収穫画面では「作付外の収穫」として出る。
 */
export async function deletePlanting(
  id: string,
): Promise<HarvestMutationResult> {
  const auth = await requireMasterEditor();
  if (!auth.ok) return auth;

  if (!id) return { ok: false, message: "対象の作付が特定できません。" };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("field_plantings")
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
      message: "対象の作付が見つかりません。すでに削除された可能性があります。",
    };
  }

  revalidateFieldPages();
  return { ok: true };
}

// ---------------------------------------------------------------------------
// 作物の標準単位
// ---------------------------------------------------------------------------

/**
 * 作物ごとの収穫量の単位を変える。
 * 過去の収穫記録は記録時点の単位を持っているので、ここを変えても遡って書き換わらない。
 */
export async function updateCropUnit(
  cropId: string,
  unit: string,
): Promise<HarvestMutationResult> {
  const auth = await requireMasterEditor();
  if (!auth.ok) return auth;

  if (!cropId) return { ok: false, message: "対象の作物が特定できません。" };

  const trimmed = unit.trim();
  if (trimmed === "") return { ok: false, message: "単位を入力してください。" };
  if (trimmed.length > 10) {
    return { ok: false, message: "単位は10文字以内で入力してください。" };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("crops")
    .update({ unit: trimmed })
    .eq("id", cropId)
    .is("deleted_at", null)
    .select("id");

  if (error) {
    return { ok: false, message: `更新に失敗しました（${error.message}）。` };
  }
  if (!data || data.length === 0) {
    return { ok: false, message: "対象の作物が見つかりません。" };
  }

  revalidateFieldPages();
  return { ok: true };
}
