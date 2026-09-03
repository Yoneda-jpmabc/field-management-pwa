import { PeriodSwitcher } from "@/components/work-records/PeriodSwitcher";
import { RecordsTabs } from "@/components/work-records/RecordsTabs";
import { RecordListPanel } from "@/components/work-records/RecordListPanel";
import { getCurrentWorker } from "@/lib/auth/session";
import { canEditRecords, canViewEveryone } from "@/lib/auth/permissions";
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
  // この画面はかつての作業記録タブを兼ねるので、閲覧のみの人にも開く。
  const worker = await getCurrentWorker();
  const params = await searchParams;

  // クエリは手で書き換えられるので、想定外の値は既定に落とす。
  const unit = isPeriodUnit(params.unit) ? params.unit : "day";
  const anchor = isIsoDate(params.date) ? params.date : todayInTokyo();

  // 閲覧のみの人には自分の分だけを見せる。
  const scopedWorkerId = canViewEveryone(worker.permission)
    ? undefined
    : worker.id;

  const period = resolvePeriod(unit, anchor);
  // 一覧本体と、編集シートで使うマスタ類を並列に取る。
  const [records, formData] = await Promise.all([
    fetchEditableWorkRecords(period.from, period.to, scopedWorkerId),
    fetchWorkRecordFormData(),
  ]);

  const canEdit = canEditRecords(worker.permission);
  const errorMessage = records.errorMessage ?? formData.errorMessage;

  return (
    <>
      <h1 className="sr-only">実績</h1>
      <RecordsTabs permission={worker.permission} />
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
        workCategories={formData.workCategories}
        workTypes={formData.workTypes}
        fields={formData.fields}
        canEdit={canEdit}
        emptyHint={
          canEdit
            ? "上の矢印で期間を移動するか、「登録」タブから追加できます。"
            : "上の矢印で期間を移動すると、別の日の記録を確認できます。"
        }
      />
    </>
  );
}
