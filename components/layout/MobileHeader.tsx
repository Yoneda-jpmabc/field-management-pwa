import { SyncStatus } from "../SyncStatus";
import { IconLeaf } from "../icons";

export function MobileHeader() {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-separator bg-surface/90 px-4 py-3 backdrop-blur-lg md:hidden">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-accent text-accent-foreground">
          <IconLeaf className="h-[15px] w-[15px]" />
        </span>
        <span className="text-[15px] font-semibold tracking-tight text-foreground">
          圃場管理
        </span>
      </div>
      <SyncStatus />
    </header>
  );
}
