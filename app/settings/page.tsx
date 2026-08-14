import type { ReactNode } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SyncStatus } from "@/components/SyncStatus";
import { SupabaseHealth } from "@/components/settings/SupabaseHealth";

function SettingsRow({
  title,
  description,
  control,
}: {
  title: string;
  description: string;
  control: ReactNode;
}) {
  // 操作部が広い行（例: データベース接続）は、狭い画面だと見出しが折り返してしまう。
  // 収まらないときだけ操作部を次の行へ送るため、flex-wrap + basis で最低幅を確保する。
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4">
      <div className="min-w-0 flex-1 basis-48">
        <p className="text-[15px] font-medium text-foreground">{title}</p>
        <p className="mt-0.5 text-sm text-foreground-secondary">{description}</p>
      </div>
      <div className="ml-auto shrink-0">{control}</div>
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
            <SettingsRow
              title="データベース接続"
              description="Supabase に接続できるかを確認します。"
              control={<SupabaseHealth />}
            />
          </Card>
        </section>
      </div>
    </>
  );
}
