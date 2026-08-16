"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { IconPlus } from "@/components/icons";
import { toggleWorkPlanDone } from "@/lib/work-plans/actions";
import type { WorkPlan } from "@/lib/work-plans/types";
import type { MasterOption } from "@/lib/work-records/types";
import { formatWeekday, shiftAnchor, todayInTokyo } from "@/lib/work-records/period";
import { PlanEditSheet, type PlanSheetTarget } from "./PlanEditSheet";

type Props = {
  /** 週の 7 日ぶんの日付（月曜始まり）。 */
  days: string[];
  /** 週の基準日。前後移動の起点になる。 */
  anchor: string;
  label: string;
  plans: WorkPlan[];
  crops: MasterOption[];
  fields: MasterOption[];
  titleSuggestions: string[];
  /** 予定を追加・編集できるか。閲覧のみの人には操作を出さない。 */
  canEdit: boolean;
};

/** "2026-08-14" → "8/14"。カレンダーの見出しは月日だけで足りる。 */
function shortDate(iso: string): string {
  const [, month, day] = iso.split("-");
  return `${Number(month)}/${Number(day)}`;
}

/** 土曜は青、日曜は赤という一般的なカレンダーの配色に合わせる。 */
function weekdayToneClass(iso: string): string {
  const weekday = formatWeekday(iso);
  if (weekday === "日") return "text-danger";
  if (weekday === "土") return "text-accent";
  return "text-foreground-secondary";
}

/**
 * ダッシュボードの週カレンダー。
 * スマホでは 7 日を縦に積み、タブレット以上では 7 列に並べる。
 * 月単位のビューは別ページで用意する前提なので、ここは週固定にしている。
 */
export function WeekCalendar({
  days,
  anchor,
  label,
  plans,
  crops,
  fields,
  titleSuggestions,
  canEdit,
}: Props) {
  const router = useRouter();
  const [sheet, setSheet] = useState<PlanSheetTarget | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const today = todayInTokyo();

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  const goToWeek = (nextAnchor: string) => {
    router.push(nextAnchor === today ? "/" : `/?week=${nextAnchor}`);
  };

  const toggleDone = (plan: WorkPlan) => {
    startTransition(async () => {
      const result = await toggleWorkPlanDone(plan.id, !plan.isDone);
      if (!result.ok) setNotice(result.message);
    });
  };

  return (
    <section className="surface-card p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-[17px] font-semibold text-foreground">作業予定</h2>
        <button
          type="button"
          onClick={() => goToWeek(today)}
          className="control-focus -my-1 min-h-11 rounded-full px-3 text-sm font-medium text-accent transition-colors active:bg-surface-secondary"
        >
          今週
        </button>
      </div>

      <div className="mb-4 flex items-center justify-between gap-2">
        <button
          type="button"
          aria-label="前の週"
          onClick={() => goToWeek(shiftAnchor("week", anchor, -1))}
          className="control-focus flex min-h-11 min-w-14 items-center justify-center rounded-full border border-separator-strong text-[17px] text-foreground-secondary transition-colors active:bg-surface-secondary"
        >
          ←
        </button>
        <p className="min-w-0 truncate text-center text-[15px] font-semibold text-foreground">
          {label}
        </p>
        <button
          type="button"
          aria-label="次の週"
          onClick={() => goToWeek(shiftAnchor("week", anchor, 1))}
          className="control-focus flex min-h-11 min-w-14 items-center justify-center rounded-full border border-separator-strong text-[17px] text-foreground-secondary transition-colors active:bg-surface-secondary"
        >
          →
        </button>
      </div>

      {notice && (
        <p
          role="status"
          className="mb-3 rounded-[10px] bg-success-bg px-4 py-2.5 text-sm text-success"
        >
          {notice}
        </p>
      )}

      <div className="grid grid-cols-1 gap-2 lg:grid-cols-7 lg:gap-2.5">
        {days.map((day) => {
          const dayPlans = plans.filter((plan) => plan.planDate === day);
          const isToday = day === today;
          return (
            <div
              key={day}
              className={`rounded-[12px] border p-2.5 lg:flex lg:min-h-44 lg:flex-col ${
                isToday
                  ? "border-accent bg-accent/5"
                  : "border-separator bg-surface-secondary/40"
              }`}
            >
              <div className="mb-2 flex items-center gap-2 lg:mb-1.5">
                <span
                  className={`text-sm font-semibold ${
                    isToday ? "text-accent" : "text-foreground"
                  }`}
                >
                  {shortDate(day)}
                </span>
                <span className={`text-xs ${weekdayToneClass(day)}`}>
                  {formatWeekday(day)}
                </span>
                {isToday && (
                  <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-accent-foreground">
                    今日
                  </span>
                )}
                {dayPlans.length > 0 && (
                  <span className="ml-auto text-xs text-foreground-tertiary lg:hidden">
                    {dayPlans.length}件
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1.5 lg:flex-1">
                {dayPlans.map((plan) => {
                  // 予定の中身は編集可否にかかわらず同じ見た目。
                  // 押せるかどうかだけを canEdit で切り替える。
                  const body = (
                    <>
                      <p
                        className={`truncate text-sm font-medium ${
                          plan.isDone
                            ? "text-foreground-tertiary line-through"
                            : "text-foreground"
                        }`}
                      >
                        {plan.title}
                      </p>
                      {(plan.cropName || plan.fieldName || plan.memo) && (
                        <p className="truncate text-xs text-foreground-tertiary">
                          {[plan.cropName, plan.fieldName, plan.memo]
                            .filter(Boolean)
                            .join(" ・ ")}
                        </p>
                      )}
                    </>
                  );

                  const checkMark = (
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                        plan.isDone
                          ? "border-success bg-success text-white"
                          : "border-separator-strong"
                      }`}
                    >
                      {plan.isDone && <span aria-hidden>✓</span>}
                    </span>
                  );

                  return (
                    <div
                      key={plan.id}
                      className="flex items-stretch gap-1 rounded-[10px] bg-surface"
                    >
                      {canEdit ? (
                        <button
                          type="button"
                          aria-label={plan.isDone ? "未完了に戻す" : "完了にする"}
                          aria-pressed={plan.isDone}
                          onClick={() => toggleDone(plan)}
                          className={`control-focus flex min-h-11 w-10 shrink-0 items-center justify-center rounded-l-[10px] text-sm transition-colors ${
                            plan.isDone
                              ? "text-success"
                              : "text-foreground-tertiary active:bg-surface-secondary"
                          }`}
                        >
                          {checkMark}
                        </button>
                      ) : (
                        <span
                          aria-label={plan.isDone ? "完了" : "未完了"}
                          className={`flex min-h-11 w-10 shrink-0 items-center justify-center text-sm ${
                            plan.isDone ? "text-success" : "text-foreground-tertiary"
                          }`}
                        >
                          {checkMark}
                        </span>
                      )}

                      {canEdit ? (
                        <button
                          type="button"
                          onClick={() => setSheet({ mode: "edit", plan })}
                          className="control-focus pressable min-w-0 flex-1 rounded-r-[10px] py-2 pr-2 text-left"
                        >
                          {body}
                        </button>
                      ) : (
                        <div className="min-w-0 flex-1 py-2 pr-2">{body}</div>
                      )}
                    </div>
                  );
                })}

                {canEdit && (
                  <button
                    type="button"
                    onClick={() => setSheet({ mode: "create", planDate: day })}
                    className="control-focus pressable flex min-h-11 items-center justify-center gap-1 rounded-[10px] border border-dashed border-separator-strong text-sm text-foreground-tertiary lg:mt-auto lg:min-h-9"
                  >
                    <IconPlus className="h-3.5 w-3.5" />
                    予定を追加
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {sheet && (
        <PlanEditSheet
          key={sheet.mode === "edit" ? sheet.plan.id : sheet.planDate}
          target={sheet}
          crops={crops}
          fields={fields}
          titleSuggestions={titleSuggestions}
          onClose={() => setSheet(null)}
          onDone={(message) => {
            setSheet(null);
            setNotice(message);
          }}
        />
      )}
    </section>
  );
}
