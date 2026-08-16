import { PageHeader } from "@/components/ui/PageHeader";
import { DaySwitcher } from "@/components/care/DaySwitcher";
import { DailyChecklist } from "@/components/care/DailyChecklist";
import { getCurrentWorker } from "@/lib/auth/session";
import { canEditRecords } from "@/lib/auth/permissions";
import { fetchDailyChecklist } from "@/lib/crop-checks/queries";
import { isIsoDate, todayInTokyo } from "@/lib/work-records/period";

export const dynamic = "force-dynamic";

export default async function CarePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const worker = await getCurrentWorker();
  const params = await searchParams;

  // クエリは手で書き換えられるので、想定外の値は今日に落とす。
  const date = isIsoDate(params.date) ? params.date : todayInTokyo();
  const checklist = await fetchDailyChecklist(date);

  return (
    <>
      <PageHeader
        title="管理"
        description="作物ごとに、その日確認することをチェックしていきます。"
      />
      <DaySwitcher date={date} />

      {checklist.errorMessage && (
        <p className="mb-4 rounded-[10px] bg-danger-bg px-4 py-3 text-sm text-danger">
          {checklist.errorMessage}
        </p>
      )}

      {/* 日付を変えたらチェック状態の一時的な上書きを持ち越さないよう作り直す。 */}
      <DailyChecklist
        key={date}
        crops={checklist.crops}
        date={date}
        canEdit={canEditRecords(worker.permission)}
      />
    </>
  );
}
