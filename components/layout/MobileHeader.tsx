import { SyncStatus } from "../SyncStatus";
import { HeaderDate, HeaderWeather } from "./HeaderStatus";

export function MobileHeader() {
  return (
    <header className="z-10 flex shrink-0 items-center justify-between border-b border-separator bg-surface px-4 py-3 md:hidden">
      {/* アプリ名とロゴは常に同じで情報量が無いので置かない。
          代わりに作業中に見たいものを出す。左に日付、右は天気（同期状態とひとまとまり）。 */}
      <HeaderDate />
      <div className="flex shrink-0 items-center gap-3">
        <HeaderWeather />
        <SyncStatus size="sm" />
      </div>
    </header>
  );
}
