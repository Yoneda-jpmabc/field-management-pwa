"use client";

import { useEffect, useState, useTransition } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { CropIcon } from "@/components/icons";
import { setCheckState } from "@/lib/crop-checks/actions";
import type { DailyCheckCrop, DailyCheckItem } from "@/lib/crop-checks/types";

type Props = {
  crops: DailyCheckCrop[];
  date: string;
  /** チェックを付け外しできるか。閲覧のみの人は状態を見るだけ。 */
  canEdit: boolean;
};

/** サーバー反映待ちの間だけ、画面を先に動かすための上書き。 */
type Override = { isDone: boolean; memo: string };

function CheckBox({ checked }: { checked: boolean }) {
  return (
    <span
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-sm ${
        checked
          ? "border-success bg-success text-white"
          : "border-separator-strong"
      }`}
    >
      {checked && <span aria-hidden>✓</span>}
    </span>
  );
}

export function DailyChecklist({ crops, date, canEdit }: Props) {
  // 日付が変わったら、このコンポーネントは呼び出し側で key ごと作り直される。
  // 前の日の上書きやメモの編集途中が持ち越されないようにするため。
  const [overrides, setOverrides] = useState<Record<string, Override>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(null), 4000);
    return () => clearTimeout(timer);
  }, [error]);

  const resolve = (item: DailyCheckItem): Override =>
    overrides[item.id] ?? { isDone: item.isDone, memo: item.memo };

  const save = (item: DailyCheckItem, next: Override) => {
    const previous = resolve(item);
    setOverrides((current) => ({ ...current, [item.id]: next }));
    setError(null);

    startTransition(async () => {
      const result = await setCheckState(
        item.id,
        date,
        next.isDone,
        next.memo,
      );
      if (!result.ok) {
        // 失敗したら画面を元に戻す。通ったことにして進めない。
        setOverrides((current) => ({ ...current, [item.id]: previous }));
        setError(result.message);
      }
    });
  };

  const totalItems = crops.reduce((sum, crop) => sum + crop.items.length, 0);

  if (totalItems === 0) {
    return (
      <Card className="py-12 text-center text-foreground-secondary">
        管理項目がまだ登録されていません。
        <span className="mt-1 block text-sm text-foreground-tertiary">
          設定画面の「管理項目」から、作物ごとに毎日確認することを登録できます。
        </span>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p
          role="alert"
          className="rounded-[10px] bg-danger-bg px-4 py-3 text-sm text-danger"
        >
          {error}
        </p>
      )}

      {crops.map((crop) => {
        // 上書きを含めて数え直す（保存待ちの間も件数が合うように）。
        const doneCount = crop.items.filter(
          (item) => resolve(item).isDone,
        ).length;
        const allDone = crop.items.length > 0 && doneCount === crop.items.length;

        return (
          <Card key={crop.id} className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <CropIcon
                  name={crop.name}
                  className="h-5 w-5 shrink-0 text-foreground-secondary"
                />
                <h2 className="truncate text-[17px] font-semibold text-foreground">
                  {crop.name}
                </h2>
              </div>
              {crop.items.length === 0 ? (
                <Badge tone="neutral">項目未登録</Badge>
              ) : (
                <Badge tone={allDone ? "success" : "neutral"}>
                  {doneCount}/{crop.items.length}
                </Badge>
              )}
            </div>

            {crop.items.length === 0 ? (
              <p className="py-3 text-center text-sm text-foreground-tertiary">
                この作物の管理項目はまだ登録されていません。
              </p>
            ) : (
              <div className="flex flex-col divide-y divide-separator">
                {crop.items.map((item) => {
                  const state = resolve(item);
                  const expanded = expandedId === item.id;

                  return (
                    <div key={item.id} className="py-1">
                      <div className="flex items-start gap-1">
                        {canEdit ? (
                          <button
                            type="button"
                            aria-label={
                              state.isDone ? "未確認に戻す" : "確認済みにする"
                            }
                            aria-pressed={state.isDone}
                            onClick={() =>
                              save(item, { ...state, isDone: !state.isDone })
                            }
                            className="control-focus flex min-h-12 w-11 shrink-0 items-center justify-center rounded-[10px] transition-colors active:bg-surface-secondary"
                          >
                            <CheckBox checked={state.isDone} />
                          </button>
                        ) : (
                          <span className="flex min-h-12 w-11 shrink-0 items-center justify-center">
                            <CheckBox checked={state.isDone} />
                          </span>
                        )}

                        <button
                          type="button"
                          aria-expanded={expanded}
                          onClick={() =>
                            setExpandedId(expanded ? null : item.id)
                          }
                          className="control-focus min-w-0 flex-1 rounded-[10px] py-2.5 pr-2 text-left"
                        >
                          <p
                            className={`text-[15px] ${
                              state.isDone
                                ? "text-foreground-tertiary"
                                : "text-foreground"
                            }`}
                          >
                            {item.title}
                          </p>
                          {item.description && (
                            <p className="mt-0.5 text-sm text-foreground-tertiary">
                              {item.description}
                            </p>
                          )}
                          {!expanded && state.memo && (
                            <p className="mt-1 truncate text-sm text-foreground-secondary">
                              メモ: {state.memo}
                            </p>
                          )}
                        </button>
                      </div>

                      {expanded && (
                        <div className="pb-3 pl-12 pr-2">
                          {canEdit ? (
                            <textarea
                              value={state.memo}
                              onChange={(event) =>
                                setOverrides((current) => ({
                                  ...current,
                                  [item.id]: {
                                    ...state,
                                    memo: event.target.value,
                                  },
                                }))
                              }
                              // 1文字ごとに保存すると書き込みが増えるので、離れたときに保存する。
                              onBlur={() => save(item, state)}
                              rows={2}
                              placeholder="気づいたことがあれば（任意）"
                              className="control-focus w-full resize-y rounded-[10px] border border-separator-strong bg-surface px-3 py-2 text-base text-foreground placeholder:text-foreground-tertiary"
                            />
                          ) : (
                            <p className="text-sm text-foreground-secondary">
                              {state.memo || "メモはありません。"}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
