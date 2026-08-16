import { createSupabaseServerClient } from "@/lib/supabase/server";
import { toPlantingStatus, type PlantingStatus } from "@/lib/harvest/types";

export type FieldListItem = {
  id: string;
  name: string;
  crop: string | null;
  areaA: number | null;
  memo: string | null;
};

export type FieldList = {
  items: FieldListItem[];
  errorMessage: string | null;
};

export async function fetchFields(limit?: number): Promise<FieldList> {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("fields")
    .select("id, name, crop, area_a, memo")
    .is("deleted_at", null)
    .eq("is_active", true)
    .order("display_order")
    .order("name");

  if (limit !== undefined) query = query.limit(limit);

  const { data, error } = await query;

  return {
    items: (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      crop: row.crop,
      areaA: row.area_a,
      memo: row.memo,
    })),
    errorMessage: error ? `圃場の取得に失敗しました（${error.message}）。` : null,
  };
}

/** 設定画面の編集フォームに流し込む作付 1 件。 */
export type EditablePlanting = {
  id: string;
  fieldId: string;
  cropId: string;
  cropName: string;
  unit: string;
  plantedOn: string | null;
  plantCount: number | null;
  areaA: number | null;
  expectedQuantity: number | null;
  status: PlantingStatus;
  memo: string;
};

/** 設定画面の編集フォームに流し込む圃場 1 件。 */
export type EditableField = {
  id: string;
  name: string;
  crop: string;
  areaA: number | null;
  memo: string;
  displayOrder: number;
  plantings: EditablePlanting[];
};

export type CropUnitItem = {
  id: string;
  name: string;
  unit: string;
};

export type FieldSettingsData = {
  fields: EditableField[];
  crops: CropUnitItem[];
  errorMessage: string | null;
};

/**
 * 設定画面（圃場情報）が必要とするデータをまとめて取得する。
 * 圃場と作付を別々に取りに行くとウォーターフォールになるので、並列に投げて後で束ねる。
 */
export async function fetchFieldSettingsData(): Promise<FieldSettingsData> {
  const supabase = await createSupabaseServerClient();

  const [fieldsResult, plantingsResult, cropsResult] = await Promise.all([
    supabase
      .from("fields")
      .select("id, name, crop, area_a, memo, display_order")
      .is("deleted_at", null)
      .eq("is_active", true)
      .order("display_order")
      .order("name"),
    supabase
      .from("field_plantings")
      .select(
        "id, field_id, crop_id, planted_on, plant_count, area_a, expected_quantity, status, memo, display_order, crops(name, unit)",
      )
      .is("deleted_at", null)
      .order("display_order")
      .order("planted_on", { ascending: false, nullsFirst: false }),
    supabase
      .from("crops")
      .select("id, name, unit")
      .is("deleted_at", null)
      .eq("is_active", true)
      .order("display_order")
      .order("name"),
  ]);

  const failure =
    fieldsResult.error ?? plantingsResult.error ?? cropsResult.error;

  const plantingsByField = new Map<string, EditablePlanting[]>();
  for (const row of plantingsResult.data ?? []) {
    const planting: EditablePlanting = {
      id: row.id,
      fieldId: row.field_id,
      cropId: row.crop_id,
      cropName: row.crops?.name ?? "（削除された作物）",
      unit: row.crops?.unit ?? "kg",
      plantedOn: row.planted_on,
      plantCount: row.plant_count,
      areaA: row.area_a,
      expectedQuantity: row.expected_quantity,
      status: toPlantingStatus(row.status),
      memo: row.memo ?? "",
    };

    const list = plantingsByField.get(row.field_id);
    if (list) list.push(planting);
    else plantingsByField.set(row.field_id, [planting]);
  }

  return {
    fields: (fieldsResult.data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      crop: row.crop ?? "",
      areaA: row.area_a,
      memo: row.memo ?? "",
      displayOrder: row.display_order,
      plantings: plantingsByField.get(row.id) ?? [],
    })),
    crops: (cropsResult.data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      unit: row.unit,
    })),
    errorMessage: failure
      ? `圃場情報の取得に失敗しました（${failure.message}）。`
      : null,
  };
}
