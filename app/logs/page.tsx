import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { IconPlus } from "@/components/icons";
import { workLogs } from "@/lib/mock-data";

function groupByDate() {
  const groups = new Map<string, typeof workLogs>();
  for (const log of workLogs) {
    const bucket = groups.get(log.date) ?? [];
    bucket.push(log);
    groups.set(log.date, bucket);
  }
  return [...groups.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
}

export default function LogsPage() {
  const grouped = groupByDate();

  return (
    <>
      <PageHeader
        title="作業記録"
        description="日付ごとの作業履歴です。オフライン時の記録も自動的に一覧に反映されます。"
        actions={
          <button
            type="button"
            className="control-focus flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover"
          >
            <IconPlus className="h-4 w-4" />
            記録を追加
          </button>
        }
      />

      <div className="flex flex-col gap-6">
        {grouped.map(([date, logs]) => (
          <div key={date}>
            <h2 className="mb-2.5 text-sm font-semibold text-foreground-secondary">
              {date}
            </h2>
            <Card className="divide-y divide-separator !p-0">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <p className="text-[15px] font-medium text-foreground">
                      {log.fieldName}
                      <span className="ml-2 text-foreground-tertiary">{log.type}</span>
                    </p>
                    <p className="mt-0.5 truncate text-sm text-foreground-secondary">
                      {log.memo}
                    </p>
                  </div>
                  <Badge tone={log.synced ? "success" : "warning"}>
                    {log.synced ? "同期済み" : "未同期"}
                  </Badge>
                </div>
              ))}
            </Card>
          </div>
        ))}
      </div>
    </>
  );
}
