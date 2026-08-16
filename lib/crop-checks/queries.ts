import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  CropCheckItemGroup,
  DailyCheckCrop,
  DailyCheckItem,
  EditableCheckItem,
} from "./types";

export type DailyChecklist = {
  crops: DailyCheckCrop[];
  errorMessage: string | null;
};

/**
 * 指定日のチェックリストを組み立てる。
 *
 * 作物マスタを軸にするので、項目が 1 つも登録されていない作物も
 * 「項目が未登録」として画面に出る（登録漏れに気づけるようにするため）。
 */
export async function fetchDailyChecklist(
  checkDate: string,
): Promise<DailyChecklist> {
  const supabase = await createSupabaseServerClient();

  const [cropsResult, itemsResult, recordsResult] = await Promise.all([
    supabase
      .from("crops")
      .select("id, name")
      .is("deleted_at", null)
      .eq("is_active", true)
      .order("display_order")
      .order("name"),
    supabase
      .from("crop_check_items")
      .select("id, crop_id, title, description")
      .is("deleted_at", null)
      .eq("is_active", true)
      .order("display_order")
      .order("title"),
    supabase
      .from("crop_check_records")
      .select("item_id, is_done, memo")
      .eq("check_date", checkDate),
  ]);

  const failure = cropsResult.error ?? itemsResult.error ?? recordsResult.error;

  const stateByItem = new Map<string, { isDone: boolean; memo: string }>();
  for (const row of recordsResult.data ?? []) {
    stateByItem.set(row.item_id, {
      isDone: row.is_done,
      memo: row.memo ?? "",
    });
  }

  const itemsByCrop = new Map<string, DailyCheckItem[]>();
  for (const row of itemsResult.data ?? []) {
    const state = stateByItem.get(row.id);
    const item: DailyCheckItem = {
      id: row.id,
      cropId: row.crop_id,
      title: row.title,
      description: row.description,
      // 記録が無い＝その日はまだ確認していない。
      isDone: state?.isDone ?? false,
      memo: state?.memo ?? "",
    };

    const list = itemsByCrop.get(row.crop_id);
    if (list) list.push(item);
    else itemsByCrop.set(row.crop_id, [item]);
  }

  return {
    crops: (cropsResult.data ?? []).map((crop) => {
      const items = itemsByCrop.get(crop.id) ?? [];
      return {
        id: crop.id,
        name: crop.name,
        items,
        doneCount: items.filter((item) => item.isDone).length,
      };
    }),
    errorMessage: failure
      ? `チェックリストの取得に失敗しました（${failure.message}）。`
      : null,
  };
}

export type CheckItemSettingsData = {
  groups: CropCheckItemGroup[];
  errorMessage: string | null;
};

/** 設定画面用に、作物ごとのチェック項目をまとめて取得する。 */
export async function fetchCheckItemSettings(): Promise<CheckItemSettingsData> {
  const supabase = await createSupabaseServerClient();

  const [cropsResult, itemsResult] = await Promise.all([
    supabase
      .from("crops")
      .select("id, name")
      .is("deleted_at", null)
      .eq("is_active", true)
      .order("display_order")
      .order("name"),
    supabase
      .from("crop_check_items")
      .select("id, crop_id, title, description, display_order")
      .is("deleted_at", null)
      .eq("is_active", true)
      .order("display_order")
      .order("title"),
  ]);

  const failure = cropsResult.error ?? itemsResult.error;

  const itemsByCrop = new Map<string, EditableCheckItem[]>();
  for (const row of itemsResult.data ?? []) {
    const item: EditableCheckItem = {
      id: row.id,
      cropId: row.crop_id,
      title: row.title,
      description: row.description ?? "",
      displayOrder: row.display_order,
    };

    const list = itemsByCrop.get(row.crop_id);
    if (list) list.push(item);
    else itemsByCrop.set(row.crop_id, [item]);
  }

  return {
    groups: (cropsResult.data ?? []).map((crop) => ({
      cropId: crop.id,
      cropName: crop.name,
      items: itemsByCrop.get(crop.id) ?? [],
    })),
    errorMessage: failure
      ? `管理項目の取得に失敗しました（${failure.message}）。`
      : null,
  };
}
