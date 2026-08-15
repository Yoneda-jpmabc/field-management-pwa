import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { IconLeaf, IconNote, IconSync, IconChevronRight } from "@/components/icons";
import { countFields, fetchFields } from "@/lib/fields/queries";
import {
  countWorkRecordsOn,
  countWorkers,
  fetchTotalMinutes,
  fetchWorkRecords,
} from "@/lib/work-records/queries";
import {
  formatHours,
  resolvePeriod,
  todayInTokyo,
} from "@/lib/work-records/period";

export const dynamic = "force-dynamic";

export default async function Home() {
  const today = todayInTokyo();
  const thisMonth = resolvePeriod("month", today);

  const [fieldCount, workerCount, todayCount, monthMinutes, recent, fieldList] =
    await Promise.all([
      countFields(),
      countWorkers(),
      countWorkRecordsOn(today),
      fetchTotalMinutes(thisMonth.from, thisMonth.to),
      fetchWorkRecords(5),
      fetchFields(4),
    ]);

  return (
    <>
      <PageHeader
        title="ダッシュボード"
        description="圃場と作業実績のようすを一目で確認できます。"
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="登録圃場数"
          value={fieldCount}
          unit="筆"
          icon={<IconLeaf className="h-4 w-4" />}
        />
        <StatCard
          label="登録ユーザー数"
          value={workerCount}
          unit="人"
          icon={<IconLeaf className="h-4 w-4" />}
        />
        <StatCard
          label="本日の作業記録"
          value={todayCount}
          unit="件"
          icon={<IconNote className="h-4 w-4" />}
        />
        <StatCard
          label={`${thisMonth.label}の作業時間`}
          value={formatHours(monthMinutes).replace("時間", "")}
          unit="時間"
          icon={<IconSync className="h-4 w-4" />}
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className="text-[17px] font-semibold text-foreground">
              最近の作業記録
            </h2>
            <Link
              href="/logs"
              className="control-focus pressable -mr-2 flex shrink-0 items-center gap-0.5 rounded-full px-2 py-3 text-sm font-medium text-accent"
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
              className="control-focus pressable -mr-2 flex shrink-0 items-center gap-0.5 rounded-full px-2 py-3 text-sm font-medium text-accent"
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
