"use client";

import { useSyncExternalStore } from "react";
import { IconSync } from "./icons";

function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getSnapshot() {
  return navigator.onLine;
}

function getServerSnapshot() {
  return true;
}

export function SyncStatus({ compact = false }: { compact?: boolean }) {
  const online = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border border-separator bg-surface px-3 py-1.5 text-xs font-medium ${
        online ? "text-success" : "text-warning"
      }`}
      title={online ? "オンライン: データは同期されています" : "オフライン: 変更はこの端末に保存されます"}
    >
      <span
        className={`h-2 w-2 rounded-full ${online ? "bg-success" : "bg-warning"}`}
      />
      {!compact && <span>{online ? "オンライン" : "オフライン・端末に保存中"}</span>}
      {compact && <IconSync className="h-3.5 w-3.5" />}
    </div>
  );
}
