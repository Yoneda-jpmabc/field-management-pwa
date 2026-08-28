"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { calcDilution } from "@/lib/pesticide/calc";
import { createDilutionRecord, deleteDilutionRecord } from "@/lib/pesticide/actions";
import {
  formatLiters,
  formatStockVolume,
  type DilutionRecord,
} from "@/lib/pesticide/types";
import { formatDayLabel } from "@/lib/work-records/period";

type Props = {
  items: DilutionRecord[];
  today: string;
  /** 閲覧のみの人には計算フォームを出さず、履歴だけ見せる。 */
  canEdit: boolean;
};

const inputBaseClass =
  "control-focus min-h-12 rounded-[10px] border border-separator-strong bg-surface px-3 text-foreground placeholder:text-foreground-tertiary";

const inputClass = `${inputBaseClass} w-full text-base`;

const noSpinnerClass =
  "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

function emptyForm(today: string) {
  return {
    pesticideName: "",
    dilutionRatio: "",
    targetVolumeL: "",
    usedOn: today,
    memo: "",
  };
}

export function DilutionCalculatorPanel({ items, today, canEdit }: Props) {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm(today));
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  const preview = calcDilution(
    Number(form.targetVolumeL),
    Number(form.dilutionRatio),
  );

  const canSave =
    form.pesticideName.trim() !== "" && form.usedOn !== "" && preview !== null;

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      const result = await createDilutionRecord(form);
      if (result.ok) {
        setForm(emptyForm(today));
        setNotice("希釈計算を保存しました。");
        router.refresh();
      } else {
        setError(result.message);
      }
    });
  };

  const handleDelete = (id: string) => {
    setError(null);
    setDeletingId(id);
    startTransition(async () => {
      const result = await deleteDilutionRecord(id);
      if (result.ok) {
        setNotice("記録を削除しました。");
        router.refresh();
      } else {
        setError(result.message);
      }
      setDeletingId(null);
    });
  };

  return (
    <div className="flex flex-col gap-5">
      {canEdit && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={form.pesticideName}
              onChange={(event) =>
                setForm({ ...form, pesticideName: event.target.value })
              }
              placeholder="農薬名"
              className={`${inputClass} sm:flex-[2]`}
            />
            <input
              type="date"
              value={form.usedOn}
              onChange={(event) =>
                setForm({ ...form, usedOn: event.target.value })
              }
              className={`${inputClass} sm:flex-1`}
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex min-w-0 flex-1 items-stretch">
              <input
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                value={form.dilutionRatio}
                onChange={(event) =>
                  setForm({ ...form, dilutionRatio: event.target.value })
                }
                placeholder="希釈倍率"
                className={`${inputBaseClass} ${noSpinnerClass} min-w-0 flex-1 rounded-r-none border-r-0 text-right`}
              />
              <span className="flex items-center rounded-r-[10px] border border-separator-strong bg-surface-secondary px-3 text-sm text-foreground-secondary">
                倍
              </span>
            </div>

            <div className="flex min-w-0 flex-1 items-stretch">
              <input
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                value={form.targetVolumeL}
                onChange={(event) =>
                  setForm({ ...form, targetVolumeL: event.target.value })
                }
                placeholder="散布量"
                className={`${inputBaseClass} ${noSpinnerClass} min-w-0 flex-1 rounded-r-none border-r-0 text-right`}
              />
              <span className="flex items-center rounded-r-[10px] border border-separator-strong bg-surface-secondary px-3 text-sm text-foreground-secondary">
                L
              </span>
            </div>
          </div>

          <input
            type="text"
            value={form.memo}
            onChange={(event) => setForm({ ...form, memo: event.target.value })}
            placeholder="メモ（任意）"
            className={inputClass}
          />

          <div className="rounded-[10px] bg-surface-secondary px-4 py-3">
            {preview ? (
              <p className="text-[15px] text-foreground">
                原液{" "}
                <span className="font-semibold tabular-nums">
                  {formatStockVolume(preview.stockVolumeMl)}
                </span>{" "}
                ＋ 水{" "}
                <span className="font-semibold tabular-nums">
                  {formatLiters(preview.waterVolumeL)}
                </span>
              </p>
            ) : (
              <p className="text-sm text-foreground-tertiary">
                希釈倍率と散布量を入力すると、原液量・水量を計算します。
              </p>
            )}
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-[10px] bg-danger-bg px-4 py-3 text-sm text-danger"
            >
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={pending || !canSave}
            className="control-focus min-h-12 rounded-full bg-accent px-5 text-[15px] font-medium text-accent-foreground transition-colors hover:bg-accent-hover active:bg-accent-hover disabled:opacity-50"
          >
            {pending && deletingId === null ? "保存中…" : "計算して登録"}
          </button>
        </div>
      )}

      {notice && (
        <p
          role="status"
          className="rounded-[10px] bg-success-bg px-4 py-3 text-sm text-success"
        >
          {notice}
        </p>
      )}

      {items.length === 0 ? (
        <p className="py-4 text-center text-sm text-foreground-secondary">
          まだ希釈計算の記録がありません。
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-separator">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium text-foreground">
                  {item.pesticideName}
                  <span className="ml-2 font-normal text-foreground-secondary">
                    {item.dilutionRatio}倍
                  </span>
                </p>
                <p className="mt-0.5 truncate text-sm text-foreground-secondary">
                  {formatDayLabel(item.usedOn)} ・ 散布 {formatLiters(item.targetVolumeL)}
                  {" ・ "}
                  原液 {formatStockVolume(item.stockVolumeMl)} ＋ 水{" "}
                  {formatLiters(item.waterVolumeL)}
                </p>
                {(item.memo || item.workerName) && (
                  <p className="mt-0.5 truncate text-sm text-foreground-tertiary">
                    {[item.workerName, item.memo].filter(Boolean).join(" ・ ")}
                  </p>
                )}
              </div>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  disabled={pending}
                  aria-label="削除"
                  className="control-focus -mr-2 flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full text-sm text-foreground-tertiary transition-colors active:bg-surface-secondary disabled:opacity-50"
                >
                  {pending && deletingId === item.id ? "…" : "削除"}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
