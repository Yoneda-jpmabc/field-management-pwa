/**
 * 農薬の希釈計算。
 *
 * 「希釈倍率」と「散布液量（希釈後の総量）」の 2 つだけから原液量・水量を求める、
 * 純粋な算数（原液量 = 散布液量 ÷ 希釈倍率）。
 * 農薬ごとの使用基準など法令に関わる値はここでは一切扱わない
 * （CLAUDE.md の「法令・データの正確性に関する注意」対象外）。
 *
 * server-only にしていないので、クライアント側の入力中プレビューにもそのまま使える。
 */

export type DilutionCalcResult = {
  /** 原液量。単位は mL。 */
  stockVolumeMl: number;
  /** 水量。単位は L。 */
  waterVolumeL: number;
};

export function calcDilution(
  targetVolumeL: number,
  dilutionRatio: number,
): DilutionCalcResult | null {
  if (!Number.isFinite(targetVolumeL) || targetVolumeL <= 0) return null;
  if (!Number.isFinite(dilutionRatio) || dilutionRatio <= 0) return null;

  const stockVolumeMl = (targetVolumeL * 1000) / dilutionRatio;
  const waterVolumeL = targetVolumeL - stockVolumeMl / 1000;
  return { stockVolumeMl, waterVolumeL };
}
