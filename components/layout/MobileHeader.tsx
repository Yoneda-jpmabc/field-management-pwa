import { SyncStatus } from "../SyncStatus";
import { HeaderStatus } from "./HeaderStatus";

export function MobileHeader() {
  return (
    <header className="z-10 flex shrink-0 items-center justify-between border-b border-separator bg-surface px-4 py-3 md:hidden">
      {/* アプリ名とロゴは常に同じで情報量が無いので置かない。
          代わりに作業中に見たいもの（今日の日付と今の気温）を出す。 */}
      <HeaderStatus />
      <SyncStatus />
    </header>
  );
}
