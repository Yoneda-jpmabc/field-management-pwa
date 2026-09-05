import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AccentPicker } from "@/components/AccentPicker";
import { SyncStatus } from "@/components/SyncStatus";
import { SupabaseHealth } from "@/components/settings/SupabaseHealth";
import { CropUnitSettings } from "@/components/settings/CropUnitSettings";
import { FieldSettings } from "@/components/settings/FieldSettings";
import { CheckItemSettings } from "@/components/settings/CheckItemSettings";
import { WeatherLocationSettings } from "@/components/settings/WeatherLocationSettings";
import { SignOutButton } from "@/components/settings/SignOutButton";
import { PermissionPreview } from "@/components/settings/PermissionPreview";
import { checkSupabaseHealth } from "@/lib/supabase/health";
import { getCurrentWorker } from "@/lib/auth/session";
import { canEditMasters } from "@/lib/auth/permissions";
import { fetchFieldSettingsData } from "@/lib/fields/queries";
import { fetchCheckItemSettings } from "@/lib/crop-checks/queries";

// 疎通結果を毎回その場で確認するため、この画面はキャッシュしない。
export const dynamic = "force-dynamic";

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

export default async function SettingsPage() {
  const worker = await getCurrentWorker();

  const [health, fieldData, checkItemData] = await Promise.all([
    checkSupabaseHealth(),
    fetchFieldSettingsData(),
    fetchCheckItemSettings(),
  ]);

  const canEdit = canEditMasters(worker.permission);

  return (
    <>
      <h1 className="sr-only">設定</h1>

      <div className="flex flex-col gap-6">
        <section>
          <h2 className="mb-2.5 text-xs font-bold tracking-[0.06em] text-foreground-secondary">
            圃場情報
          </h2>
          {fieldData.errorMessage && (
            <p className="mb-3 rounded-[10px] bg-danger-bg px-4 py-3 text-sm text-danger">
              {fieldData.errorMessage}
            </p>
          )}
          <FieldSettings
            fields={fieldData.fields}
            crops={fieldData.crops}
            canEdit={canEdit}
          />
        </section>

        <section>
          <h2 className="mb-2.5 text-xs font-bold tracking-[0.06em] text-foreground-secondary">
            管理項目
          </h2>
          <p className="mb-2.5 text-sm text-foreground-secondary">
            作物ごとに、管理タブで毎日確認することを登録します。
          </p>
          {checkItemData.errorMessage && (
            <p className="mb-3 rounded-[10px] bg-danger-bg px-4 py-3 text-sm text-danger">
              {checkItemData.errorMessage}
            </p>
          )}
          <CheckItemSettings groups={checkItemData.groups} canEdit={canEdit} />
        </section>

        <section>
          <h2 className="mb-2.5 text-xs font-bold tracking-[0.06em] text-foreground-secondary">
            収穫量の単位
          </h2>
          <CropUnitSettings crops={fieldData.crops} canEdit={canEdit} />
        </section>

        <section>
          <h2 className="mb-2.5 text-xs font-bold tracking-[0.06em] text-foreground-secondary">
            表示
          </h2>
          <Card className="divide-y divide-separator !p-0">
            <SettingsRow
              title="外観"
              description="ライトモード・ダークモードを切り替えます。"
              control={<ThemeToggle />}
            />
            <SettingsRow
              title="アクセントカラー"
              description="ボタンや選択中の表示に使う色を選びます。この端末だけの設定です。"
              control={<AccentPicker />}
            />
            <SettingsRow
              title="天気の地点"
              description="画面上部に出す天気・気温・降水確率をどの地点で見るかを選びます。この端末だけの設定です。"
              control={<WeatherLocationSettings />}
            />
          </Card>
        </section>

        <section>
          <h2 className="mb-2.5 text-xs font-bold tracking-[0.06em] text-foreground-secondary">
            アカウント
          </h2>
          <Card className="divide-y divide-separator !p-0">
            <SettingsRow
              title={worker.name}
              description="この端末でログインしている人です。"
              control={<SignOutButton />}
            />
            {/*
              権限プレビューは全権限の人だけに出す。ここは「他の人にどう
              見えるか」を確かめるためのもので、権限そのものは変わらない。
            */}
            {worker.realPermission === "all" && (
              <div className="px-5 py-4">
                <p className="text-[15px] font-medium text-foreground">
                  権限の見え方を確認
                </p>
                <p className="mt-0.5 mb-3 text-sm text-foreground-secondary">
                  他の権限の人に画面がどう見えるかを、ログインし直さずに
                  確かめられます。確認中は登録・編集ができなくなりますが、
                  権限そのものは変わりません。
                </p>
                <PermissionPreview current={worker.permission} />
              </div>
            )}
          </Card>
        </section>

        <section>
          <h2 className="mb-2.5 text-xs font-bold tracking-[0.06em] text-foreground-secondary">
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
              control={<SupabaseHealth initial={health} />}
            />
          </Card>
        </section>
      </div>
    </>
  );
}
