"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { IconSearch } from "@/components/icons";
import type { FieldListItem } from "@/lib/fields/queries";

export function FieldsBrowser({ fields }: { fields: FieldListItem[] }) {
  const [query, setQuery] = useState("");

  const filtered = fields.filter((field) => {
    const q = query.trim();
    if (!q) return true;
    return [field.name, field.crop, field.memo].some((value) =>
      value?.includes(q),
    );
  });

  if (fields.length === 0) {
    return (
      <Card className="py-12 text-center text-foreground-secondary">
        圃場がまだ登録されていません。
      </Card>
    );
  }

  return (
    <div>
      <div className="relative mb-5 max-w-sm">
        <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-tertiary" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="圃場名・作物・メモで検索"
          className="control-focus w-full rounded-[10px] border border-separator bg-surface py-2.5 pl-10 pr-3.5 text-[15px] text-foreground placeholder:text-foreground-tertiary"
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="py-12 text-center text-foreground-secondary">
          該当する圃場が見つかりませんでした。
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((field) => (
            <Card key={field.id} className="flex flex-col gap-3">
              <h3 className="text-[16px] font-semibold text-foreground">
                {field.name}
              </h3>
              <dl className="grid grid-cols-2 gap-y-1.5 text-sm">
                <dt className="text-foreground-tertiary">作物</dt>
                <dd className="text-right text-foreground">
                  {field.crop ?? "—"}
                </dd>
                <dt className="text-foreground-tertiary">面積</dt>
                <dd className="text-right font-mono text-foreground">
                  {field.areaA === null ? "—" : `${field.areaA}a`}
                </dd>
              </dl>
              {field.memo && (
                <p className="text-sm text-foreground-secondary">{field.memo}</p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
