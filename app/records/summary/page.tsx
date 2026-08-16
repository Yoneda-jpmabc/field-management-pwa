import { PageHeader } from "@/components/ui/PageHeader";
import { PeriodSwitcher } from "@/components/work-records/PeriodSwitcher";
import { RecordsTabs } from "@/components/work-records/RecordsTabs";
import { SummaryPanels } from "@/components/work-records/SummaryPanels";
import { requireEveryoneViewer } from "@/lib/auth/session";
import { fetchWorkSummary } from "@/lib/work-records/queries";
import {
  isIsoDate,
  isPeriodUnit,
  resolvePeriod,
  todayInTokyo,
} from "@/lib/work-records/period";

export const dynamic = "force-dynamic";

export default async function RecordsSummaryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const worker = await requireEveryoneViewer();
  const params = await searchParams;

  // クエリは手で書き換えられるので、想定外の値は既定に落とす。
  const unit = isPeriodUnit(params.unit) ? params.unit : "day";
  const anchor = isIsoDate(params.date) ? params.date : todayInTokyo();

  const period = resolvePeriod(unit, anchor);
  const summary = await fetchWorkSummary(period.from, period.to);

  return (
    <>
      <PageHeader
        title="実績"
        description="期間ごとに、誰がどの作業に何時間かけたかを確認できます。"
      />
      <RecordsTabs permission={worker.permission} />
      <PeriodSwitcher unit={unit} anchor={anchor} label={period.label} />

      {summary.errorMessage && (
        <p className="mb-4 rounded-[10px] bg-danger-bg px-4 py-3 text-sm text-danger">
          {summary.errorMessage}
        </p>
      )}

      <SummaryPanels summary={summary} />
    </>
  );
}
