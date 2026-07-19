export type FieldStatus = "growing" | "resting" | "harvested";

export type Field = {
  id: string;
  name: string;
  areaAre: number;
  cropType: string;
  status: FieldStatus;
  location: string;
};

export type WorkLog = {
  id: string;
  fieldId: string;
  fieldName: string;
  date: string;
  type: string;
  memo: string;
  synced: boolean;
};

export const fields: Field[] = [
  { id: "f1", name: "北一号田", areaAre: 32, cropType: "コシヒカリ", status: "growing", location: "上田地区" },
  { id: "f2", name: "北二号田", areaAre: 28, cropType: "コシヒカリ", status: "growing", location: "上田地区" },
  { id: "f3", name: "南の畑", areaAre: 15, cropType: "大豆", status: "resting", location: "南地区" },
  { id: "f4", name: "河原田", areaAre: 40, cropType: "ひとめぼれ", status: "harvested", location: "河川敷地区" },
  { id: "f5", name: "西の段々畑", areaAre: 9, cropType: "野菜（混作）", status: "growing", location: "西地区" },
];

export const workLogs: WorkLog[] = [
  { id: "l1", fieldId: "f1", fieldName: "北一号田", date: "2026-07-19", type: "水管理", memo: "取水口を確認し、水位を調整。", synced: true },
  { id: "l2", fieldId: "f2", fieldName: "北二号田", date: "2026-07-19", type: "防除", memo: "カメムシ防除剤を散布。", synced: false },
  { id: "l3", fieldId: "f5", fieldName: "西の段々畑", date: "2026-07-18", type: "収穫", memo: "夏野菜を収穫し出荷準備。", synced: true },
  { id: "l4", fieldId: "f3", fieldName: "南の畑", date: "2026-07-17", type: "土壌管理", memo: "堆肥を投入し耕耘。", synced: true },
  { id: "l5", fieldId: "f4", fieldName: "河原田", date: "2026-07-16", type: "見回り", memo: "畦の崩れを確認、補修が必要。", synced: false },
];

export const fieldStatusLabel: Record<FieldStatus, string> = {
  growing: "生育中",
  resting: "休耕中",
  harvested: "収穫済み",
};
