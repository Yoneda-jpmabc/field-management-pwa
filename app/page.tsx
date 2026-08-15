import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { IconChevronRight } from "@/components/icons";
import { WeekCalendar } from "@/components/work-plans/WeekCalendar";
import { fetchFields } from "@/lib/fields/queries";
import {
  fetchPlanTitleSuggestions,
  fetchWorkPlans,
} from "@/lib/work-plans/queries";
import {
  fetchWorkRecordFormData,
  fetchWorkRecords,
} from "@/lib/work-records/queries";
import {
  enumerateDays,
  isIsoDate,
  resolvePeriod,
  todayInTokyo,
} from "@/lib/work-records/period";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  // クエリは手で書き換えられるので、想定外の値は今日に落とす。
  const anchor = isIsoDate(params.week) ? params.week : todayInTokyo();
  const week = resolvePeriod("week", anchor);

  const [plans, titleSuggestions, masters, recent, fieldList] =
    await Promise.all([
      fetchWorkPlans(week.from, week.to),
      fetchPlanTitleSuggestions(),
      fetchWorkRecordFormData(),
      fetchWorkRecords(5),
      fetchFields(4),
    ]);

  return (
    <>
      <PageHeader
        title="ダッシュボード"
        description="今週の作業予定と、直近の作業実績を確認できます。"
      />

      {plans.errorMessage && (
        <p className="mb-4 rounded-[10px] bg-danger-bg px-4 py-3 text-sm text-danger">
          {plans.errorMessage}
        </p>
      )}

      <WeekCalendar
        days={enumerateDays(week.from, week.to)}
        anchor={anchor}
        label={week.label}
        plans={plans.items}
        crops={masters.crops}
        fields={masters.fields}
        titleSuggestions={titleSuggestions}
      />

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className="text-[17px] font-semibold text-foreground">
              最近の作業記録
            </h2>
            <Link
              href="/logs"
              className="control-focus -mr-2 flex shrink-0 items-center gap-0.5 rounded-full px-2 py-3 text-sm font-medium text-accent transition-colors active:bg-surface-secondary"
            >
              すべて見る
              <IconChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {recent.items.length === 0 ? (
            <p className="py-6 text-center text-sm text-foreground-secondary">
              まだ作業記録がありません。
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-separator">
              {recent.items.map((record) => (
                <li
                  key={record.id}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-medium text-foreground">
                      {record.workerName} ・ {record.workTypeLabel}
                    </p>
                    <p className="truncate text-sm text-foreground-secondary">
                      {record.workDate}
                      {record.cropName && ` — ${record.cropName}`}
                      {record.fieldName && ` — ${record.fieldName}`}
                      {record.memo && ` — ${record.memo}`}
                    </p>
                  </div>
                  {record.timeLabel && (
                    <span className="shrink-0 font-mono text-sm text-foreground-secondary">
                      {record.timeLabel}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className="text-[17px] font-semibold text-foreground">圃場</h2>
            <Link
              href="/fields"
              className="control-focus -mr-2 flex shrink-0 items-center gap-0.5 rounded-full px-2 py-3 text-sm font-medium text-accent transition-colors active:bg-surface-secondary"
            >
              すべて見る
              <IconChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {fieldList.items.length === 0 ? (
            <p className="py-6 text-center text-sm text-foreground-secondary">
              圃場がまだ登録されていません。
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-separator">
              {fieldList.items.map((field) => (
                <li
                  key={field.id}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <p className="min-w-0 truncate text-[15px] font-medium text-foreground">
                    {field.name}
                  </p>
                  <p className="shrink-0 text-sm text-foreground-secondary">
                    {[field.crop, field.areaA !== null && `${field.areaA}a`]
                      .filter(Boolean)
                      .join(" ・ ") || "—"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
