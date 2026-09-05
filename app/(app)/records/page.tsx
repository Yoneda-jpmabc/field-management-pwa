import { WorkRecordForm } from "@/components/work-records/WorkRecordForm";
import { getCurrentWorker } from "@/lib/auth/session";
import { canEditRecords } from "@/lib/auth/permissions";
import { fetchWorkRecordFormData } from "@/lib/work-records/queries";
import { todayInTokyo } from "@/lib/work-records/period";
import { redirect } from "next/navigation";

// マスタの追加が即座に反映されてほしいので、この画面はキャッシュしない。
export const dynamic = "force-dynamic";

export default async function RecordsPage() {
  const worker = await getCurrentWorker();
  // 登録タブは入力専用の画面なので、編集権限が無い人は確認タブへ送る。
  if (!canEditRecords(worker.permission)) redirect("/records/list");

  const {
    workers,
    workCategories,
    workTypes,
    fields,
    fieldCropIds,
    workTypeSuggestions,
    startTimeSuggestions,
    endTimeSuggestions,
    errorMessage,
  } = await fetchWorkRecordFormData();

  return (
    <>
      <h1 className="sr-only">実績</h1>
      {errorMessage && (
        <p className="mb-4 rounded-[10px] bg-danger-bg px-4 py-3 text-sm text-danger">
          {errorMessage}
        </p>
      )}

      <WorkRecordForm
        today={todayInTokyo()}
        workers={workers}
        workCategories={workCategories}
        workTypes={workTypes}
        fields={fields}
        fieldCropIds={fieldCropIds}
        workTypeSuggestions={workTypeSuggestions}
        startTimeSuggestions={startTimeSuggestions}
        endTimeSuggestions={endTimeSuggestions}
      />
    </>
  );
}
