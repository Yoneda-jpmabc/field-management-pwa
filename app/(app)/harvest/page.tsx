import { PeriodSwitcher } from "@/components/work-records/PeriodSwitcher";
import { HarvestBoard } from "@/components/harvest/HarvestBoard";
import { getCurrentWorker } from "@/lib/auth/session";
import { canEditRecords } from "@/lib/auth/permissions";
import { fetchHarvestBoard, fetchWorkerOptions } from "@/lib/harvest/queries";
import {
  isIsoDate,
  isPeriodUnit,
  resolvePeriod,
  todayInTokyo,
} from "@/lib/work-records/period";

export const dynamic = "force-dynamic";

export default async function HarvestPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const worker = await getCurrentWorker();
  const params = await searchParams;

  // クエリは手で書き換えられるので、想定外の値は既定に落とす。
  // 収穫は日ごとに見ても数字が動かない日があるため、既定は月にしている。
  const unit = isPeriodUnit(params.unit) ? params.unit : "month";
  const anchor = isIsoDate(params.date) ? params.date : todayInTokyo();
  const period = resolvePeriod(unit, anchor);

  const [board, workers] = await Promise.all([
    fetchHarvestBoard(period.from, period.to),
    fetchWorkerOptions(),
  ]);

  return (
    <>
      <h1 className="sr-only">収穫</h1>
      <PeriodSwitcher
        unit={unit}
        anchor={anchor}
        label={period.label}
        basePath="/harvest"
      />

      {board.errorMessage && (
        <p className="mb-4 rounded-[10px] bg-danger-bg px-4 py-3 text-sm text-danger">
          {board.errorMessage}
        </p>
      )}

      <HarvestBoard
        items={board.items}
        workers={workers}
        today={todayInTokyo()}
        periodLabel={period.label}
        canEdit={canEditRecords(worker.permission)}
      />
    </>
  );
}
