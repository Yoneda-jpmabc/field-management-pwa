import { formatHours } from "@/lib/work-records/period";
import type { WorkSummary } from "@/lib/work-records/queries";

/**
 * 集計の表示。対話は <details> の開閉だけなので Server Component のままにしている。
 */
export function SummaryPanels({ summary }: { summary: WorkSummary }) {
  if (summary.recordCount === 0) {
    return (
      <div className="surface-card p-5">
        <p className="text-sm text-foreground-secondary">
          この期間に登録された作業実績はありません。
        </p>
      </div>
    );
  }

  const maxWorkerMinutes = Math.max(
    ...summary.byWorker.map((row) => row.totalMinutes),
    1,
  );
  const maxTypeMinutes = Math.max(
    ...summary.byWorkType.map((row) => row.totalMinutes),
    1,
  );

  return (
    <div className="flex flex-col gap-4">
      <section className="surface-card p-5">
        <h2 className="text-[15px] font-semibold text-foreground">期間合計</h2>
        <div className="mt-3 flex flex-wrap gap-x-8 gap-y-3">
          <Stat label="のべ作業時間" value={formatHours(summary.totalMinutes)} />
          <Stat label="レコード数" value={`${summary.recordCount}件`} />
          <Stat
            label="時間未設定"
            value={`${summary.untimedCount}件`}
            muted={summary.untimedCount === 0}
          />
        </div>
        {summary.untimedCount > 0 && (
          <p className="mt-3 text-sm text-warning">
            開始・終了が未入力、または終了が開始以前のレコードは時間を計上していません。
          </p>
        )}
      </section>

      <section className="surface-card p-5">
        <h2 className="text-[15px] font-semibold text-foreground">
          作業者ごと
        </h2>
        <p className="mt-1 text-sm text-foreground-tertiary">
          行をタップすると、その人の作業種類の内訳が開きます。
        </p>
        <div className="mt-3 divide-y divide-separator">
          {summary.byWorker.map((worker) => {
            const breakdown = summary.byWorkerAndType.filter(
              (row) => row.workerId === worker.workerId,
            );
            return (
              <details key={worker.workerId} className="group py-2">
                <summary className="control-focus pressable flex min-h-11 cursor-pointer select-none items-center justify-between gap-3 list-none [&::-webkit-details-marker]:hidden">
                  <span className="min-w-0 truncate text-[15px] font-medium text-foreground">
                    {worker.workerName}
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5 text-sm text-foreground-secondary">
                    {formatHours(worker.totalMinutes)}
                    <span className="text-foreground-tertiary">
                      {worker.recordCount}件
                    </span>
                    <span
                      aria-hidden
                      className="text-foreground-tertiary transition-transform group-open:rotate-90"
                    >
                      ›
                    </span>
                  </span>
                </summary>
                <Bar value={worker.totalMinutes} max={maxWorkerMinutes} />
                <ul className="mt-3 mb-1 flex flex-col gap-1.5 pl-3">
                  {breakdown.map((row) => (
                    <li
                      key={`${row.workerId}-${row.workTypeLabel}`}
                      className="flex items-baseline justify-between gap-3 text-sm"
                    >
                      <span className="text-foreground-secondary">
                        {row.workTypeLabel}
                      </span>
                      <span className="shrink-0 text-foreground-tertiary">
                        {formatHours(row.totalMinutes)} / {row.recordCount}件
                      </span>
                    </li>
                  ))}
                </ul>
              </details>
            );
          })}
        </div>
      </section>

      <section className="surface-card p-5">
        <h2 className="text-[15px] font-semibold text-foreground">
          作業ごと
        </h2>
        <div className="mt-3 divide-y divide-separator">
          {summary.byWorkType.map((type) => (
            <div key={type.workTypeLabel} className="py-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[15px] font-medium text-foreground">
                  {type.workTypeLabel}
                </span>
                <span className="shrink-0 text-sm text-foreground-secondary">
                  {formatHours(type.totalMinutes)}
                  <span className="ml-2 text-foreground-tertiary">
                    {type.recordCount}件
                  </span>
                </span>
              </div>
              <Bar
                value={type.totalMinutes}
                max={maxTypeMinutes}
                className="mt-2"
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-foreground-tertiary">{label}</p>
      <p
        className={`mt-0.5 text-[22px] font-semibold tracking-tight ${
          muted ? "text-foreground-tertiary" : "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function Bar({
  value,
  max,
  className = "",
}: {
  value: number;
  max: number;
  className?: string;
}) {
  const percent = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className={`h-1.5 w-full rounded-full bg-surface-secondary ${className}`}>
      <div
        className="h-full rounded-full bg-accent"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
