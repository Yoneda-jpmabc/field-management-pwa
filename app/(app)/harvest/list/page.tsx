import { PeriodSwitcher } from "@/components/work-records/PeriodSwitcher";
import { HarvestListPanel } from "@/components/harvest/HarvestListPanel";
import { getCurrentWorker } from "@/lib/auth/session";
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
  const worker = await getCurrentWorker();
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
      <h1 className="sr-only">収穫</h1>
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
