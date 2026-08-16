import { PageHeader } from "@/components/ui/PageHeader";
import { PeriodSwitcher } from "@/components/work-records/PeriodSwitcher";
import { HarvestTabs } from "@/components/harvest/HarvestTabs";
import { HarvestListPanel } from "@/components/harvest/HarvestListPanel";
import { requireWorker } from "@/lib/auth/session";
import { canEditRecords, canViewEveryone } from "@/lib/auth/permissions";
import { fetchHarvestRecords, fetchWorkerOptions } from "@/lib/harvest/queries";
import {
  isIsoDate,
  isPeriodUnit,
  resolvePeriod,
  todayInTokyo,
} from "@/lib/work-records/period";

export const dynamic = "force-dynamic";

export default async function HarvestListPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const worker = await requireWorker("/harvest/list");
  const params = await searchParams;

  const unit = isPeriodUnit(params.unit) ? params.unit : "month";
  const anchor = isIsoDate(params.date) ? params.date : todayInTokyo();
  const period = resolvePeriod(unit, anchor);

  // 閲覧のみの人には、自分が収穫した分だけを見せる。
  const scopedWorkerId = canViewEveryone(worker.permission)
    ? undefined
    : worker.id;

  const [records, workers] = await Promise.all([
    fetchHarvestRecords(period.from, period.to, scopedWorkerId),
    fetchWorkerOptions(),
  ]);

  return (
    <>
      <PageHeader
        title="収穫"
        description={
          scopedWorkerId
            ? "自分が収穫した記録を日付順に確認できます。"
            : "収穫の記録を日付順に確認し、タップして修正・削除できます。"
        }
      />
      <HarvestTabs />
      <PeriodSwitcher
        unit={unit}
        anchor={anchor}
        label={period.label}
        basePath="/harvest/list"
      />

      {records.errorMessage && (
        <p className="mb-4 rounded-[10px] bg-danger-bg px-4 py-3 text-sm text-danger">
          {records.errorMessage}
        </p>
      )}

      <HarvestListPanel
        items={records.items}
        workers={workers}
        today={todayInTokyo()}
        canEdit={canEditRecords(worker.permission)}
      />
    </>
  );
}
