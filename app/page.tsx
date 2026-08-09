import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { IconLeaf, IconNote, IconSync, IconChevronRight } from "@/components/icons";
import { fields, workLogs, fieldStatusLabel } from "@/lib/mock-data";

const TODAY = "2026-07-19";

export default function Home() {
  const growingCount = fields.filter((f) => f.status === "growing").length;
  const todayLogCount = workLogs.filter((l) => l.date === TODAY).length;
  const unsyncedCount = workLogs.filter((l) => !l.synced).length;

  return (
    <>
      <PageHeader
        title="ダッシュボード"
        description="圃場と作業記録のようすを一目で確認できます。"
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="登録圃場数" value={fields.length} unit="筆" icon={<IconLeaf className="h-4 w-4" />} />
        <StatCard label="生育中の圃場" value={growingCount} unit="筆" icon={<IconLeaf className="h-4 w-4" />} />
        <StatCard label="本日の作業記録" value={todayLogCount} unit="件" icon={<IconNote className="h-4 w-4" />} />
        <StatCard
          label="未同期の記録"
          value={unsyncedCount}
          unit="件"
          icon={<IconSync className="h-4 w-4" />}
          tone={unsyncedCount > 0 ? "warning" : "default"}
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[17px] font-semibold text-foreground">
              最近の作業記録
            </h2>
            <Link
              href="/logs"
              className="control-focus flex items-center gap-0.5 text-sm font-medium text-accent"
            >
              すべて見る
              <IconChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <ul className="flex flex-col divide-y divide-separator">
            {workLogs.slice(0, 4).map((log) => (
              <li key={log.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-medium text-foreground">
                    {log.fieldName} ・ {log.type}
                  </p>
                  <p className="truncate text-sm text-foreground-secondary">
                    {log.date} — {log.memo}
                  </p>
                </div>
                <Badge tone={log.synced ? "success" : "warning"}>
                  {log.synced ? "同期済み" : "未同期"}
                </Badge>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[17px] font-semibold text-foreground">圃場</h2>
            <Link
              href="/fields"
              className="control-focus flex items-center gap-0.5 text-sm font-medium text-accent"
            >
              すべて見る
              <IconChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <ul className="flex flex-col divide-y divide-separator">
            {fields.slice(0, 4).map((field) => (
              <li key={field.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-medium text-foreground">
                    {field.name}
                  </p>
                  <p className="truncate text-sm text-foreground-secondary">
                    {field.cropType} ・ {field.areaAre}a
                  </p>
                </div>
                <Badge
                  tone={
                    field.status === "growing"
                      ? "success"
                      : field.status === "resting"
                        ? "neutral"
                        : "accent"
                  }
                >
                  {fieldStatusLabel[field.status]}
                </Badge>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
