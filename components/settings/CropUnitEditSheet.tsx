"use client";

import { useState, useTransition } from "react";
import { BottomSheet, SheetSection } from "@/components/ui/BottomSheet";
import { updateCropUnit } from "@/lib/fields/actions";
import type { CropUnitItem } from "@/lib/fields/queries";

type Props = {
  crop: CropUnitItem;
  onClose: () => void;
  onDone: (message: string) => void;
};

const inputClass =
  "control-focus min-h-12 w-full rounded-[10px] border border-separator-strong bg-surface px-3 text-base text-foreground placeholder:text-foreground-tertiary";

/** 設定画面の「収穫量の単位」の編集。1作物につき単位だけを持つシンプルな項目。 */
export function CropUnitEditSheet({ crop, onClose, onDone }: Props) {
  const [unit, setUnit] = useState(crop.unit);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const canSave = unit.trim() !== "";

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      const result = await updateCropUnit(crop.id, unit);
      if (result.ok) {
        onDone("単位を変更しました。");
      } else {
        setError(result.message);
      }
    });
  };

  return (
    <BottomSheet
      title="収穫量の単位を編集"
      onClose={onClose}
      busy={pending}
      footer={
        <button
          type="button"
          onClick={handleSave}
          disabled={pending || !canSave}
          className="control-focus min-h-12 w-full rounded-full bg-accent text-[15px] font-medium text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {pending ? "保存中…" : "変更を保存"}
        </button>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="rounded-[10px] bg-surface-secondary px-4 py-3">
          <p className="text-[15px] font-medium text-foreground">
            {crop.name}
          </p>
        </div>

        <SheetSection title="単位" required hint="例: kg、パック、ケース">
          <input
            type="text"
            value={unit}
            onChange={(event) => setUnit(event.target.value)}
            maxLength={10}
            autoFocus
            className={inputClass}
          />
        </SheetSection>

        {error && (
          <p
            role="alert"
            className="rounded-[10px] bg-danger-bg px-4 py-3 text-sm text-danger"
          >
            {error}
          </p>
        )}
      </div>
    </BottomSheet>
  );
}
