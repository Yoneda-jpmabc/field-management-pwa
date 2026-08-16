import { PageHeader } from "@/components/ui/PageHeader";
import { PeriodSwitcher } from "@/components/work-records/PeriodSwitcher";
import { RecordsTabs } from "@/components/work-records/RecordsTabs";
import { RecordListPanel } from "@/components/work-records/RecordListPanel";
import { requireEveryoneViewer } from "@/lib/auth/session";
import {
  fetchEditableWorkRecords,
  fetchWorkRecordFormData,
} from "@/lib/work-records/queries";
import {
  isIsoDate,
  isPeriodUnit,
  resolvePeriod,
  todayInTokyo,
} from "@/lib/work-records/period";

export const dynamic = "force-dynamic";

export default async function RecordsListPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireEveryoneViewer("/records/list");
  const params = await searchParams;

  // クエリは手で書き換えられるので、想定外の値は既定に落とす。
  const unit = isPeriodUnit(params.unit) ? params.unit : "day";
  const anchor = isIsoDate(params.date) ? params.date : todayInTokyo();

  const period = resolvePeriod(unit, anchor);
  // 一覧本体と、編集シートで使うマスタ類を並列に取る。
  const [records, formData] = await Promise.all([
    fetchEditableWorkRecords(period.from, period.to),
    fetchWorkRecordFormData(),
  ]);

  const errorMessage = records.errorMessage ?? formData.errorMessage;

  return (
    <>
      <PageHeader
        title="実績"
        description="登録した実績を確認し、タップして修正・削除できます。"
      />
      <RecordsTabs />
      <PeriodSwitcher
        unit={unit}
        anchor={anchor}
        label={period.label}
        basePath="/records/list"
      />

      {errorMessage && (
        <p className="mb-4 rounded-[10px] bg-danger-bg px-4 py-3 text-sm text-danger">
          {errorMessage}
        </p>
      )}

      <RecordListPanel
        items={records.items}
        workers={formData.workers}
        workTypes={formData.workTypes}
        fields={formData.fields}
        crops={formData.crops}
      />
    </>
  );
}
