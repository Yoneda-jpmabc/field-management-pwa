import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { IconPlus } from "@/components/icons";
import { fetchWorkRecords } from "@/lib/work-records/queries";
import { formatWeekday } from "@/lib/work-records/period";
import type { WorkRecordListItem } from "@/lib/work-records/queries";

export const dynamic = "force-dynamic";

function groupByDate(items: WorkRecordListItem[]) {
  const groups = new Map<string, WorkRecordListItem[]>();
  for (const item of items) {
    const bucket = groups.get(item.workDate) ?? [];
    bucket.push(item);
    groups.set(item.workDate, bucket);
  }
  // クエリ側で日付降順に並べてあるので、挿入順がそのまま新しい順になる。
  return [...groups.entries()];
}

export default async function LogsPage() {
  const { items, errorMessage } = await fetchWorkRecords();
  const grouped = groupByDate(items);

  return (
    <>
      <PageHeader
        title="作業記録"
        description="登録された作業実績を日付ごとに並べています。"
        actions={
          <Link
            href="/records"
            className="control-focus flex items-center gap-1.5 rounded-full bg-accent px-5 py-3 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover active:bg-accent-hover"
          >
            <IconPlus className="h-4 w-4" />
            記録を追加
          </Link>
        }
      />

      {errorMessage && (
        <p className="mb-4 rounded-[10px] bg-danger-bg px-4 py-3 text-sm text-danger">
          {errorMessage}
        </p>
      )}

      {grouped.length === 0 ? (
        <Card className="py-12 text-center text-foreground-secondary">
          まだ作業記録がありません。実績タブから登録できます。
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          {grouped.map(([date, records]) => (
            <div key={date}>
              <h2 className="mb-2.5 text-sm font-semibold text-foreground-secondary">
                {date}（{formatWeekday(date)}）
              </h2>
              <Card className="divide-y divide-separator !p-0">
                {records.map((record) => (
                  <div key={record.id} className="px-5 py-4">
                    <div className="flex items-baseline justify-between gap-4">
                      <p className="min-w-0 text-[15px] font-medium text-foreground">
                        {record.workerName}
                        <span className="ml-2 text-foreground-tertiary">
                          {record.workTypeLabel}
                        </span>
                      </p>
                      {record.timeLabel && (
                        <span className="shrink-0 font-mono text-sm text-foreground-secondary">
                          {record.timeLabel}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-sm text-foreground-secondary">
                      {[record.cropName, record.fieldName, record.memo]
                        .filter(Boolean)
                        .join(" ・ ") || "—"}
                    </p>
                  </div>
                ))}
              </Card>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
