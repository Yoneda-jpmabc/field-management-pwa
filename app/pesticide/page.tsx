import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { DilutionCalculatorPanel } from "@/components/pesticide/DilutionCalculatorPanel";
import { getCurrentWorker } from "@/lib/auth/session";
import { canEditRecords } from "@/lib/auth/permissions";
import { fetchDilutionRecords } from "@/lib/pesticide/queries";
import { todayInTokyo } from "@/lib/work-records/period";

// 履歴の追加が即座に反映されてほしいので、この画面はキャッシュしない。
export const dynamic = "force-dynamic";

export default async function PesticidePage() {
  const worker = await getCurrentWorker();
  const dilutions = await fetchDilutionRecords();

  return (
    <>
      <PageHeader
        title="農薬 希釈計算"
        description="希釈倍率と散布量から原液量・水量を計算して記録し、あとから確認できます。"
      />

      {dilutions.errorMessage && (
        <p className="mb-4 rounded-[10px] bg-danger-bg px-4 py-3 text-sm text-danger">
          {dilutions.errorMessage}
        </p>
      )}

      <Card>
        <DilutionCalculatorPanel
          items={dilutions.items}
          today={todayInTokyo()}
          canEdit={canEditRecords(worker.permission)}
        />
      </Card>
    </>
  );
}
