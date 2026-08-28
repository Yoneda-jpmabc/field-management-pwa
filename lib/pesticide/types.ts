/**
 * 農薬 希釈計算モジュールの共有型。
 * UI(components/pesticide) と データアクセス(lib/pesticide) の両方から参照する。
 */

/** 計算フォームが扱う入力。新規登録専用（編集は無し）。 */
export type DilutionCalcInput = {
  pesticideName: string;
  /** 「n倍」の n。入力途中の空文字を許すため文字列で持つ。 */
  dilutionRatio: string;
  /** 希釈後の散布液量（合計）。単位は L。 */
  targetVolumeL: string;
  usedOn: string;
  memo: string;
};

/** 履歴表示 1 件。 */
export type DilutionRecord = {
  id: string;
  usedOn: string;
  pesticideName: string;
  dilutionRatio: number;
  targetVolumeL: number;
  stockVolumeMl: number;
  waterVolumeL: number;
  memo: string;
  workerName: string | null;
};

export type DilutionMutationResult =
  | { ok: true }
  | { ok: false; message: string };

/** 原液量の表示。1000mL 以上は L 表記に丸める。 */
export function formatStockVolume(ml: number): string {
  if (ml >= 1000) return `${Number((ml / 1000).toFixed(2))}L`;
  return `${Number(ml.toFixed(1))}mL`;
}

export function formatLiters(value: number): string {
  return `${Number(value.toFixed(2))}L`;
}
