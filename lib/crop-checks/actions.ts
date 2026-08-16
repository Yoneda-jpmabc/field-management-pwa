"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireMasterEditor, requireRecordEditor } from "@/lib/auth/guards";
import type { CheckItemInput, CheckMutationResult } from "./types";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function toTextOrNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function revalidateCheckPages() {
  revalidatePath("/care");
  revalidatePath("/settings");
}

// ---------------------------------------------------------------------------
// 日々の確認
// ---------------------------------------------------------------------------

/**
 * チェックの付け外しとメモの保存。
 *
 * 1 項目 × 1 日で 1 行なので、(item_id, check_date) の一意制約に対して
 * upsert する。チェックを外しても行は残り、is_done が false になる。
 */
export async function setCheckState(
  itemId: string,
  checkDate: string,
  isDone: boolean,
  memo: string,
): Promise<CheckMutationResult> {
  const auth = await requireRecordEditor();
  if (!auth.ok) return auth;

  if (!itemId) return { ok: false, message: "対象の項目が特定できません。" };
  if (!DATE_PATTERN.test(checkDate)) {
    return { ok: false, message: "日付の形式が正しくありません。" };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("crop_check_records").upsert(
    {
      item_id: itemId,
      check_date: checkDate,
      is_done: isDone,
      memo: toTextOrNull(memo),
      worker_id: auth.workerId,
    },
    { onConflict: "item_id,check_date" },
  );

  if (error) {
    return { ok: false, message: `保存に失敗しました（${error.message}）。` };
  }

  revalidateCheckPages();
  return { ok: true };
}

// ---------------------------------------------------------------------------
// チェック項目マスタ
// ---------------------------------------------------------------------------

function validate(input: CheckItemInput): string | null {
  if (!input.cropId) return "作物を選択してください。";
  if (input.title.trim() === "") return "項目名を入力してください。";

  const order = input.displayOrder.trim();
  if (order !== "" && (!Number.isFinite(Number(order)) || Number(order) < 0)) {
    return "並び順は 0 以上の数字で入力してください。";
  }
  return null;
}

export async function saveCheckItem(
  input: CheckItemInput,
): Promise<CheckMutationResult> {
  // 管理方法は全員の作業の基準になるものなので、圃場マスタと同じ扱いにする。
  const auth = await requireMasterEditor();
  if (!auth.ok) return auth;

  const invalid = validate(input);
  if (invalid) return { ok: false, message: invalid };

  const supabase = await createSupabaseServerClient();
  const values = {
    crop_id: input.cropId,
    title: input.title.trim(),
    description: toTextOrNull(input.description),
    display_order: Number(input.displayOrder.trim() || "0"),
  };

  if (input.id) {
    const { data, error } = await supabase
      .from("crop_check_items")
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
        message: "対象の項目が見つかりません。すでに削除された可能性があります。",
      };
    }
  } else {
    const { error } = await supabase.from("crop_check_items").insert(values);
    if (error) {
      return { ok: false, message: `登録に失敗しました（${error.message}）。` };
    }
  }

  revalidateCheckPages();
  return { ok: true };
}

/**
 * チェック項目の論理削除。
 * 過去の確認記録から参照されているため物理削除はしない（履歴が引けなくなる）。
 */
export async function deleteCheckItem(
  id: string,
): Promise<CheckMutationResult> {
  const auth = await requireMasterEditor();
  if (!auth.ok) return auth;

  if (!id) return { ok: false, message: "対象の項目が特定できません。" };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("crop_check_items")
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
      message: "対象の項目が見つかりません。すでに削除された可能性があります。",
    };
  }

  revalidateCheckPages();
  return { ok: true };
}
