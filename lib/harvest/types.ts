/**
 * 収穫・作付モジュールの共有型。
 * UI(components/harvest, components/settings) と データアクセス(lib/harvest, lib/fields) の
 * 両方から参照する。
 */

export const PLANTING_STATUSES = [
  "planned",
  "growing",
  "harvesting",
  "finished",
] as const;

export type PlantingStatus = (typeof PLANTING_STATUSES)[number];

export const PLANTING_STATUS_LABELS: Record<PlantingStatus, string> = {
  planned: "これから",
  growing: "生育中",
  harvesting: "収穫中",
  finished: "終了",
};

export function toPlantingStatus(value: string | null): PlantingStatus {
  return (PLANTING_STATUSES as readonly string[]).includes(value ?? "")
    ? (value as PlantingStatus)
    : "growing";
}

/** 圃場カードに並べる作付 1 件。収穫量の集計込み。 */
export type PlantingSummary = {
  id: string;
  fieldId: string;
  cropId: string;
  cropName: string;
  /** 収穫量の単位。作物マスタの標準単位。 */
  unit: string;
  plantedOn: string | null;
  /** 株数。数え方が面積の作物では null。 */
  plantCount: number | null;
  /** 作付面積（アール）。 */
  areaA: number | null;
  expectedQuantity: number | null;
  status: PlantingStatus;
  memo: string | null;
  /** 選んだ期間の収穫量。 */
  periodQuantity: number;
  /** 全期間の累計収穫量。 */
  totalQuantity: number;
  lastHarvestedOn: string | null;
};

/** 作付に紐付かない収穫（作付を登録する前に入れた分など）。 */
export type UnlinkedHarvest = {
  cropId: string;
  cropName: string;
  unit: string;
  periodQuantity: number;
  totalQuantity: number;
};

/** 収穫タブに並べる圃場 1 件。 */
export type FieldBoardItem = {
  id: string;
  name: string;
  areaA: number | null;
  memo: string | null;
  plantings: PlantingSummary[];
  unlinked: UnlinkedHarvest[];
};

/** 収穫入力シートが扱う 1 件。新規と編集で同じ形を使う。 */
export type HarvestRecordInput = {
  /** 新規なら null。 */
  id: string | null;
  harvestDate: string;
  fieldId: string;
  cropId: string;
  plantingId: string | null;
  /** 入力途中の空文字を許すため文字列で持ち、送信時に数値へ変換する。 */
  quantity: string;
  unit: string;
  workerId: string | null;
  memo: string;
};

/** 収穫履歴の一覧表示 1 件。 */
export type HarvestListItem = {
  id: string;
  harvestDate: string;
  fieldId: string;
  fieldName: string;
  cropId: string;
  cropName: string;
  plantingId: string | null;
  quantity: number;
  unit: string;
  workerId: string | null;
  workerName: string | null;
  memo: string;
};

export type HarvestMutationResult =
  | { ok: true }
  | { ok: false; message: string };

/** 作付の登録・更新入力。 */
export type PlantingInput = {
  /** 新規なら null。 */
  id: string | null;
  fieldId: string;
  cropId: string;
  plantedOn: string;
  /** 空文字は未入力として null に落とす。 */
  plantCount: string;
  areaA: string;
  expectedQuantity: string;
  status: PlantingStatus;
  memo: string;
};

/** 圃場マスタの登録・更新入力。 */
export type FieldInput = {
  /** 新規なら null。 */
  id: string | null;
  name: string;
  areaA: string;
  crop: string;
  memo: string;
  displayOrder: string;
};

/**
 * 数量の表示。
 * 小数第2位まで持てるが、割り切れるときに ".00" を出すと読みにくいので落とす。
 */
export function formatQuantity(value: number, unit: string): string {
  return `${Number(value.toFixed(2))}${unit}`;
}
