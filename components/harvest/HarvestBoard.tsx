"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { CropIcon, IconPlus, IconSearch } from "@/components/icons";
import { formatDayLabel } from "@/lib/work-records/period";
import {
  PLANTING_STATUS_LABELS,
  formatQuantity,
  type FieldBoardItem,
  type PlantingStatus,
  type PlantingSummary,
} from "@/lib/harvest/types";
import type { WorkerOption } from "@/lib/work-records/types";
import { HarvestSheet, type HarvestSheetTarget } from "./HarvestSheet";

type Props = {
  items: FieldBoardItem[];
  workers: WorkerOption[];
  today: string;
  /** 期間の見出し（「8月」など）。数値の横に何の期間か添える。 */
  periodLabel: string;
  /** 収穫を記録できるか。閲覧のみの人には入力ボタンを出さない。 */
  canEdit: boolean;
};

const STATUS_TONES: Record<
  PlantingStatus,
  "neutral" | "accent" | "success" | "warning"
> = {
  planned: "neutral",
  growing: "accent",
  harvesting: "success",
  finished: "neutral",
};

function formatNumber(value: number): string {
  return Number(value.toFixed(2)).toLocaleString("ja-JP");
}

/** 「2,000株」「30a」のように、作付の規模を 1 行にまとめる。 */
function describeScale(planting: PlantingSummary): string {
  const parts: string[] = [];
  if (planting.plantCount !== null) {
    parts.push(`${planting.plantCount.toLocaleString("ja-JP")}株`);
  }
  if (planting.areaA !== null) parts.push(`${formatNumber(planting.areaA)}a`);
  if (planting.plantedOn) parts.push(`${formatDayLabel(planting.plantedOn)}定植`);
  return parts.join(" ・ ");
}

/**
 * 収穫量のバー。
 * 見込み量が入っていればそれを分母にした進捗、無ければ画面内の最大値を
 * 分母にした相対量を出す。どちらなのかは必ずラベルで区別する。
 */
function HarvestBar({
  quantity,
  denominator,
  isProgress,
}: {
  quantity: number;
  denominator: number;
  isProgress: boolean;
}) {
  const ratio = denominator > 0 ? Math.min(quantity / denominator, 1) : 0;

  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-surface-secondary"
      role="img"
      aria-label={
        isProgress
          ? `見込みに対して${Math.round(ratio * 100)}%`
          : `画面内の最大量に対する割合 ${Math.round(ratio * 100)}%`
      }
    >
      <div
        className={`h-full rounded-full transition-[width] duration-300 ${
          isProgress ? "bg-success" : "bg-accent"
        }`}
        style={{ width: `${Math.max(ratio * 100, quantity > 0 ? 3 : 0)}%` }}
      />
    </div>
  );
}

export function HarvestBoard({
  items,
  workers,
  today,
  periodLabel,
  canEdit,
}: Props) {
  const [query, setQuery] = useState("");
  const [target, setTarget] = useState<HarvestSheetTarget | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  /**
   * 見込み量が無い作付のバーをそろえるための基準値。
   * 単位が違うものを同じ物差しで測ると誤解を招くので、単位ごとに最大値を出す。
   */
  const maxByUnit = useMemo(() => {
    const max = new Map<string, number>();
    for (const field of items) {
      for (const planting of field.plantings) {
        max.set(
          planting.unit,
          Math.max(max.get(planting.unit) ?? 0, planting.totalQuantity),
        );
      }
    }
    return max;
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return items;
    return items.filter((field) =>
      [field.name, field.memo, ...field.plantings.map((p) => p.cropName)].some(
        (value) => value?.includes(q),
      ),
    );
  }, [items, query]);

  if (items.length === 0) {
    return (
      <Card className="py-12 text-center text-foreground-secondary">
        圃場がまだ登録されていません。
        <span className="mt-1 block text-sm text-foreground-tertiary">
          設定画面の「圃場情報」から登録できます。
        </span>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {notice && (
        <p
          role="status"
          className="rounded-[10px] bg-success-bg px-4 py-3 text-sm text-success"
        >
          {notice}
        </p>
      )}

      <div className="relative max-w-sm">
        <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-tertiary" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="圃場名・作物で検索"
          className="control-focus w-full rounded-[10px] border border-separator bg-surface py-2.5 pl-10 pr-3.5 text-base text-foreground placeholder:text-foreground-tertiary"
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="py-12 text-center text-foreground-secondary">
          該当する圃場が見つかりませんでした。
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filtered.map((field) => (
            <Card key={field.id} className="flex flex-col gap-3">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-[17px] font-semibold text-foreground">
                  {field.name}
                </h2>
                <span className="shrink-0 font-mono text-sm text-foreground-tertiary">
                  {field.areaA === null ? "面積未設定" : `${formatNumber(field.areaA)}a`}
                </span>
              </div>

              {field.plantings.length === 0 && field.unlinked.length === 0 ? (
                <p className="py-4 text-center text-sm text-foreground-tertiary">
                  作付が登録されていません。
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {field.plantings.map((planting) => {
                    const hasExpectation =
                      planting.expectedQuantity !== null &&
                      planting.expectedQuantity > 0;
                    const denominator = hasExpectation
                      ? planting.expectedQuantity!
                      : (maxByUnit.get(planting.unit) ?? 0);

                    return (
                      <div
                        key={planting.id}
                        className="rounded-[12px] border border-separator p-3.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-2">
                            <CropIcon
                              name={planting.cropName}
                              className="h-[18px] w-[18px] shrink-0 text-foreground-secondary"
                            />
                            <span className="truncate text-[15px] font-medium text-foreground">
                              {planting.cropName}
                            </span>
                          </div>
                          <Badge tone={STATUS_TONES[planting.status]}>
                            {PLANTING_STATUS_LABELS[planting.status]}
                          </Badge>
                        </div>

                        {describeScale(planting) && (
                          <p className="mt-1.5 text-sm text-foreground-secondary">
                            {describeScale(planting)}
                          </p>
                        )}

                        <div className="mt-3 flex items-baseline justify-between gap-2">
                          <span className="font-mono text-[17px] font-semibold text-foreground">
                            {formatQuantity(planting.totalQuantity, planting.unit)}
                          </span>
                          <span className="text-xs text-foreground-tertiary">
                            {hasExpectation
                              ? `見込み ${formatQuantity(planting.expectedQuantity!, planting.unit)}`
                              : "累計"}
                          </span>
                        </div>

                        <div className="mt-2">
                          <HarvestBar
                            quantity={planting.totalQuantity}
                            denominator={denominator}
                            isProgress={hasExpectation}
                          />
                        </div>

                        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-foreground-tertiary">
                          <span>
                            {periodLabel}{" "}
                            <span className="font-mono text-foreground-secondary">
                              {formatQuantity(planting.periodQuantity, planting.unit)}
                            </span>
                          </span>
                          <span>
                            {planting.lastHarvestedOn
                              ? `最終 ${formatDayLabel(planting.lastHarvestedOn)}`
                              : "未収穫"}
                          </span>
                        </div>

                        {planting.memo && (
                          <p className="mt-2 text-sm text-foreground-secondary">
                            {planting.memo}
                          </p>
                        )}

                        {canEdit && (
                          <button
                            type="button"
                            onClick={() =>
                              setTarget({
                                mode: "create",
                                fieldId: field.id,
                                fieldName: field.name,
                                cropId: planting.cropId,
                                cropName: planting.cropName,
                                plantingId: planting.id,
                                unit: planting.unit,
                              })
                            }
                            className="control-focus pressable mt-3 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full bg-accent text-[15px] font-medium text-accent-foreground transition-colors hover:bg-accent-hover"
                          >
                            <IconPlus className="h-4 w-4" />
                            収穫を記録
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {field.unlinked.map((entry) => (
                    <div
                      key={entry.cropId}
                      className="rounded-[12px] border border-dashed border-separator-strong p-3.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <CropIcon
                            name={entry.cropName}
                            className="h-[18px] w-[18px] shrink-0 text-foreground-tertiary"
                          />
                          <span className="truncate text-[15px] text-foreground-secondary">
                            {entry.cropName}
                          </span>
                        </div>
                        <span className="shrink-0 font-mono text-sm text-foreground-secondary">
                          {formatQuantity(entry.totalQuantity, entry.unit)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-foreground-tertiary">
                        作付の登録が無い収穫です。設定画面で作付を登録すると、ここにまとまります。
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {target && (
        <HarvestSheet
          target={target}
          today={today}
          workers={workers}
          onClose={() => setTarget(null)}
          onDone={(message) => {
            setTarget(null);
            setNotice(message);
          }}
        />
      )}
    </div>
  );
}
