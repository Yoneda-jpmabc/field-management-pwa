import type { ReactNode } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SyncStatus } from "@/components/SyncStatus";
import { LocationPicker } from "@/components/settings/LocationPicker";

function SettingsRow({
  title,
  description,
  control,
}: {
  title: string;
  description: string;
  control: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <div className="min-w-0">
        <p className="text-[15px] font-medium text-foreground">{title}</p>
        <p className="mt-0.5 text-sm text-foreground-secondary">{description}</p>
      </div>
      {control}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="設定"
        description="表示や同期状況などアプリの設定を確認・変更できます。"
      />

      <div className="flex flex-col gap-6">
        <section>
          <h2 className="mb-2.5 text-sm font-semibold text-foreground-secondary">
            天気
          </h2>
          <Card className="flex flex-col gap-3">
            <div>
              <p className="text-[15px] font-medium text-foreground">
                ダッシュボードに表示する地域
              </p>
              <p className="mt-0.5 text-sm text-foreground-secondary">
                天草市内の登録済みの地域から選択できます。
              </p>
            </div>
            <LocationPicker />
          </Card>
        </section>

        <section>
          <h2 className="mb-2.5 text-sm font-semibold text-foreground-secondary">
            表示
          </h2>
          <Card className="divide-y divide-separator !p-0">
            <SettingsRow
              title="外観"
              description="ライトモード・ダークモードを切り替えます。"
              control={<ThemeToggle />}
            />
          </Card>
        </section>

        <section>
          <h2 className="mb-2.5 text-sm font-semibold text-foreground-secondary">
            同期
          </h2>
          <Card className="divide-y divide-separator !p-0">
            <SettingsRow
              title="接続状態"
              description="オフライン中の変更はこの端末に保存され、再接続時に自動で同期されます。"
              control={<SyncStatus />}
            />
          </Card>
        </section>
      </div>
    </>
  );
}
