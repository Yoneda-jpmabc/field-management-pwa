import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { DilutionRecord } from "./types";

export type DilutionList = {
  items: DilutionRecord[];
  errorMessage: string | null;
};

/**
 * 希釈計算の履歴。
 * limit を渡すとダッシュボードの直近表示のように件数を絞れる。省略時は全件。
 */
export async function fetchDilutionRecords(
  limit?: number,
): Promise<DilutionList> {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("pesticide_dilutions")
    .select(
      "id, used_on, pesticide_name, dilution_ratio, target_volume_l, stock_volume_ml, water_volume_l, memo, workers(name, short_name)",
    )
    .is("deleted_at", null)
    .order("used_on", { ascending: false })
    .order("created_at", { ascending: false });

  if (limit) query = query.limit(limit);

  const { data, error } = await query;

  return {
    items: (data ?? []).map((row) => ({
      id: row.id,
      usedOn: row.used_on,
      pesticideName: row.pesticide_name,
      dilutionRatio: Number(row.dilution_ratio),
      targetVolumeL: Number(row.target_volume_l),
      stockVolumeMl: Number(row.stock_volume_ml),
      waterVolumeL: Number(row.water_volume_l),
      memo: row.memo ?? "",
      workerName: row.workers?.short_name ?? row.workers?.name ?? null,
    })),
    errorMessage: error
      ? `希釈計算の履歴取得に失敗しました（${error.message}）。`
      : null,
  };
}
