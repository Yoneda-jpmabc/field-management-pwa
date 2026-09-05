import { CustomRangePicker } from "@/components/work-records/CustomRangePicker";
import { PeriodSwitcher } from "@/components/work-records/PeriodSwitcher";
import { SummaryPanels } from "@/components/work-records/SummaryPanels";
import { SwipeableDateArea } from "@/components/work-records/SwipeableDateArea";
import { requireEveryoneViewer } from "@/lib/auth/session";
import { fetchWorkSummary } from "@/lib/work-records/queries";
import {
  isIsoDate,
  isPeriodUnit,
  resolveCustomRange,
  resolvePeriod,
  todayInTokyo,
} from "@/lib/work-records/period";

const SUMMARY_PATH = "/records/summary";

export const dynamic = "force-dynamic";

export default async function RecordsSummaryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireEveryoneViewer();
  const params = await searchParams;

  // クエリは手で書き換えられるので、想定外の値は既定に落とす。
  const unit = isPeriodUnit(params.unit) ? params.unit : "day";
  const anchor = isIsoDate(params.date) ? params.date : todayInTokyo();

  // from/to が両方そろっていれば、日/週/月/年のプリセットより優先して任意期間として扱う。
  const isCustomRange = isIsoDate(params.from) && isIsoDate(params.to);
  const period = isCustomRange
    ? resolveCustomRange(params.from as string, params.to as string)
    : resolvePeriod(unit, anchor);
  const summary = await fetchWorkSummary(period.from, period.to);

  return (
    <>
      <h1 className="sr-only">実績</h1>
      {isCustomRange ? (
        <>
          <p className="mb-2 text-[15px] font-semibold text-foreground">
            {period.label}
          </p>
          <CustomRangePicker
            basePath={SUMMARY_PATH}
            defaultFrom={period.from}
            defaultTo={period.to}
            active
          />
        </>
      ) : (
        <>
          <PeriodSwitcher unit={unit} anchor={anchor} label={period.label} />
          <CustomRangePicker
            basePath={SUMMARY_PATH}
            defaultFrom={period.from}
            defaultTo={period.to}
            active={false}
          />
        </>
      )}

      {summary.errorMessage && (
        <p className="mb-4 rounded-[10px] bg-danger-bg px-4 py-3 text-sm text-danger">
          {summary.errorMessage}
        </p>
      )}

      {isCustomRange ? (
        // 任意期間は前後の単位が定まらないのでスワイプ移動の対象にしない。
        <SummaryPanels summary={summary} />
      ) : (
        <SwipeableDateArea unit={unit} anchor={anchor} basePath={SUMMARY_PATH}>
          <SummaryPanels summary={summary} />
        </SwipeableDateArea>
      )}
    </>
  );
}
