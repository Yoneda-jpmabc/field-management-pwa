import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { WorkerOption } from "@/lib/work-records/types";
import type {
  FieldBoardItem,
  HarvestListItem,
  PlantingSummary,
  UnlinkedHarvest,
} from "./types";
import { toPlantingStatus } from "./types";

/**
 * 収穫入力の「収穫した人」チップ用。
 * 実績入力の fetchWorkRecordFormData は作業種類やサジェストまで引くので、
 * 作業者だけ要る画面ではこちらを使う。
 */
export async function fetchWorkerOptions(): Promise<WorkerOption[]> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("workers")
    .select("id, name, short_name, employment_type")
    .is("deleted_at", null)
    .eq("is_active", true)
    .order("display_order")
    .order("name");

  return (data ?? []).map((row) => ({
    id: row.id,
    label: row.short_name ?? row.name,
    group: row.employment_type,
  }));
}

/** 集計 1 行分のキー。作付に紐付かない行は planting_id が null で来る。 */
type SummaryRow = {
  planting_id: string | null;
  field_id: string;
  crop_id: string;
  total_quantity: number;
  record_count: number;
  last_harvested_on: string | null;
};

/** 作付に紐付かない行を「圃場×作物」で引けるようにするキー。 */
function unlinkedKey(fieldId: string, cropId: string): string {
  return `${fieldId}:${cropId}`;
}

export type HarvestBoard = {
  items: FieldBoardItem[];
  errorMessage: string | null;
};

/**
 * 収穫タブの本体。「どこに何がどれくらいあるか」＋「どれだけ採れたか」を組み立てる。
 *
 * 期間の集計と全期間の累計を両方出すため、集計関数を 2 回呼ぶ。
 * 圃場・作付は件数が知れている（圃場 10〜30 件）ので、突き合わせはアプリ側で行う。
 */
export async function fetchHarvestBoard(
  fromDate: string,
  toDate: string,
): Promise<HarvestBoard> {
  const supabase = await createSupabaseServerClient();

  const [fieldsResult, plantingsResult, periodResult, totalResult] =
    await Promise.all([
      supabase
        .from("fields")
        .select("id, name, area_a, memo")
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
      supabase.rpc("harvest_summary_by_planting", {
        from_date: fromDate,
        to_date: toDate,
      }),
      // 期間を渡さない＝全期間の累計。
      supabase.rpc("harvest_summary_by_planting", {
        from_date: null,
        to_date: null,
      }),
    ]);

  const failure =
    fieldsResult.error ??
    plantingsResult.error ??
    periodResult.error ??
    totalResult.error;

  const periodRows = (periodResult.data ?? []) as SummaryRow[];
  const totalRows = (totalResult.data ?? []) as SummaryRow[];

  const periodByPlanting = new Map<string, SummaryRow>();
  const totalByPlanting = new Map<string, SummaryRow>();
  const periodByUnlinked = new Map<string, SummaryRow>();
  const totalByUnlinked = new Map<string, SummaryRow>();

  for (const row of periodRows) {
    if (row.planting_id) periodByPlanting.set(row.planting_id, row);
    else periodByUnlinked.set(unlinkedKey(row.field_id, row.crop_id), row);
  }
  for (const row of totalRows) {
    if (row.planting_id) totalByPlanting.set(row.planting_id, row);
    else totalByUnlinked.set(unlinkedKey(row.field_id, row.crop_id), row);
  }

  const plantingsByField = new Map<string, PlantingSummary[]>();
  for (const row of plantingsResult.data ?? []) {
    const period = periodByPlanting.get(row.id);
    const total = totalByPlanting.get(row.id);

    const summary: PlantingSummary = {
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
      memo: row.memo,
      periodQuantity: Number(period?.total_quantity ?? 0),
      totalQuantity: Number(total?.total_quantity ?? 0),
      lastHarvestedOn: total?.last_harvested_on ?? null,
    };

    const list = plantingsByField.get(row.field_id);
    if (list) list.push(summary);
    else plantingsByField.set(row.field_id, [summary]);
  }

  // 作付に紐付かない収穫の作物名を出すためだけにマスタを引く。
  // 作付側の突き合わせでは crops を join 済みなので、ここは残りの分だけ。
  const cropNames = new Map<string, { name: string; unit: string }>();
  if (totalByUnlinked.size > 0 || periodByUnlinked.size > 0) {
    const { data } = await supabase.from("crops").select("id, name, unit");
    for (const crop of data ?? []) {
      cropNames.set(crop.id, { name: crop.name, unit: crop.unit });
    }
  }

  const unlinkedByField = new Map<string, UnlinkedHarvest[]>();
  // 期間内に無くても累計に出る作物があるため、両方のキーを合わせて回す。
  const unlinkedKeys = new Set([
    ...periodByUnlinked.keys(),
    ...totalByUnlinked.keys(),
  ]);
  for (const key of unlinkedKeys) {
    const row = totalByUnlinked.get(key) ?? periodByUnlinked.get(key);
    if (!row) continue;

    const crop = cropNames.get(row.crop_id);
    const entry: UnlinkedHarvest = {
      cropId: row.crop_id,
      cropName: crop?.name ?? "（削除された作物）",
      unit: crop?.unit ?? "kg",
      periodQuantity: Number(periodByUnlinked.get(key)?.total_quantity ?? 0),
      totalQuantity: Number(totalByUnlinked.get(key)?.total_quantity ?? 0),
    };

    const list = unlinkedByField.get(row.field_id);
    if (list) list.push(entry);
    else unlinkedByField.set(row.field_id, [entry]);
  }

  return {
    items: (fieldsResult.data ?? []).map((field) => ({
      id: field.id,
      name: field.name,
      areaA: field.area_a,
      memo: field.memo,
      plantings: plantingsByField.get(field.id) ?? [],
      unlinked: unlinkedByField.get(field.id) ?? [],
    })),
    errorMessage: failure
      ? `収穫状況の取得に失敗しました（${failure.message}）。`
      : null,
  };
}

export type HarvestList = {
  items: HarvestListItem[];
  errorMessage: string | null;
};

/**
 * 収穫履歴。
 * workerId を渡すと、その作業者が収穫した分だけに絞る（閲覧のみの人向け）。
 */
export async function fetchHarvestRecords(
  fromDate: string,
  toDate: string,
  workerId?: string,
): Promise<HarvestList> {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("harvest_records")
    .select(
      // workers への外部キーが worker_id と created_by_worker_id の 2 本あるため、
      // どちらを辿るかを外部キー名で明示する。省略すると PostgREST が解決できない。
      "id, harvest_date, field_id, crop_id, planting_id, quantity, unit, worker_id, memo, fields(name), crops(name), workers!harvest_records_worker_id_fkey(name, short_name)",
    )
    .is("deleted_at", null)
    .gte("harvest_date", fromDate)
    .lte("harvest_date", toDate)
    .order("harvest_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (workerId) query = query.eq("worker_id", workerId);

  const { data, error } = await query;

  return {
    items: (data ?? []).map((row) => ({
      id: row.id,
      harvestDate: row.harvest_date,
      fieldId: row.field_id,
      fieldName: row.fields?.name ?? "（削除された圃場）",
      cropId: row.crop_id,
      cropName: row.crops?.name ?? "（削除された作物）",
      plantingId: row.planting_id,
      quantity: Number(row.quantity),
      unit: row.unit,
      workerId: row.worker_id,
      workerName: row.workers?.short_name ?? row.workers?.name ?? null,
      memo: row.memo ?? "",
    })),
    errorMessage: error
      ? `収穫履歴の取得に失敗しました（${error.message}）。`
      : null,
  };
}
