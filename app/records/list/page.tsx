import { PageHeader } from "@/components/ui/PageHeader";
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
  // ログイン未実装のうちは誰の操作か分からないので、絞り込みは効かない。
  const scopedWorkerId =
    canViewEveryone(worker.permission) || worker.id === null
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
      <PageHeader
        title="実績"
        description={
          canEdit
            ? "登録した実績を確認し、タップして修正・削除できます。"
            : scopedWorkerId
              ? "自分の作業実績を日付ごとに確認できます。"
              : "登録された作業実績を日付ごとに確認できます。"
        }
      />
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
        workTypes={formData.workTypes}
        fields={formData.fields}
        crops={formData.crops}
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
