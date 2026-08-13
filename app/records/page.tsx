import { PageHeader } from "@/components/ui/PageHeader";
import { RecordsTabs } from "@/components/work-records/RecordsTabs";
import { WorkRecordForm } from "@/components/work-records/WorkRecordForm";
import { fetchWorkRecordFormData } from "@/lib/work-records/queries";
import { todayInTokyo } from "@/lib/work-records/period";

// マスタの追加が即座に反映されてほしいので、この画面はキャッシュしない。
export const dynamic = "force-dynamic";

export default async function RecordsPage() {
  const { workers, workTypes, fields, workTypeSuggestions, errorMessage } =
    await fetchWorkRecordFormData();

  return (
    <>
      <PageHeader
        title="実績"
        description="作業者ごとの作業実績を、管理者がまとめて入力します。"
      />
      <RecordsTabs />

      {errorMessage && (
        <p className="mb-4 rounded-[10px] bg-danger-bg px-4 py-3 text-sm text-danger">
          {errorMessage}
        </p>
      )}

      <WorkRecordForm
        today={todayInTokyo()}
        workers={workers}
        workTypes={workTypes}
        fields={fields}
        workTypeSuggestions={workTypeSuggestions}
      />
    </>
  );
}
