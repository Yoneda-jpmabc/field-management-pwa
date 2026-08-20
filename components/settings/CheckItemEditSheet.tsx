"use client";

import { useState, useTransition } from "react";
import { BottomSheet, SheetSection } from "@/components/ui/BottomSheet";
import { deleteCheckItem, saveCheckItem } from "@/lib/crop-checks/actions";
import type { EditableCheckItem } from "@/lib/crop-checks/types";

/**
 * 編集対象。
 * 新規は所属する作物だけが決まっている状態、編集は既存の項目。
 */
export type CheckItemSheetTarget =
  | { mode: "create"; cropId: string; cropName: string }
  | { mode: "edit"; cropName: string; item: EditableCheckItem };

type Props = {
  target: CheckItemSheetTarget;
  onClose: () => void;
  onDone: (message: string) => void;
};

const inputClass =
  "control-focus min-h-12 w-full rounded-[10px] border border-separator-strong bg-surface px-3 text-base text-foreground placeholder:text-foreground-tertiary";

export function CheckItemEditSheet({ target, onClose, onDone }: Props) {
  const existing = target.mode === "edit" ? target.item : null;
  const cropId = target.mode === "edit" ? target.item.cropId : target.cropId;

  const [title, setTitle] = useState(existing?.title ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [displayOrder, setDisplayOrder] = useState(
    String(existing?.displayOrder ?? 0),
  );
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const canSave = title.trim() !== "";

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      const result = await saveCheckItem({
        id: existing?.id ?? null,
        cropId,
        title,
        description,
        displayOrder,
      });
      if (result.ok) {
        onDone(existing ? "管理項目を更新しました。" : "管理項目を登録しました。");
      } else {
        setError(result.message);
      }
    });
  };

  const handleDelete = () => {
    if (!existing) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteCheckItem(existing.id);
      if (result.ok) {
        onDone("管理項目を削除しました。");
      } else {
        setConfirmingDelete(false);
        setError(result.message);
      }
    });
  };

  const footer = confirmingDelete ? (
    <div>
      <p className="mb-3 text-center text-sm font-medium text-foreground">
        この管理項目を削除しますか？
      </p>
      <p className="mb-3 text-center text-xs text-foreground-tertiary">
        これまでの確認記録は残ります。
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setConfirmingDelete(false)}
          disabled={pending}
          className="control-focus min-h-12 flex-1 rounded-full border border-separator-strong text-[15px] font-medium text-foreground-secondary transition-colors active:bg-surface-secondary disabled:opacity-50"
        >
          やめる
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={pending}
          className="control-focus min-h-12 flex-1 rounded-full bg-danger text-[15px] font-medium text-white transition-colors active:opacity-80 disabled:opacity-50"
        >
          {pending ? "削除中…" : "削除する"}
        </button>
      </div>
    </div>
  ) : (
    <div className="flex gap-2">
      {existing && (
        <button
          type="button"
          onClick={() => setConfirmingDelete(true)}
          disabled={pending}
          className="control-focus min-h-12 rounded-full border border-danger/40 px-5 text-[15px] font-medium text-danger transition-colors active:bg-danger-bg disabled:opacity-50"
        >
          削除
        </button>
      )}
      <button
        type="button"
        onClick={handleSave}
        disabled={pending || !canSave}
        className="control-focus min-h-12 flex-1 rounded-full bg-accent text-[15px] font-medium text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-50"
      >
        {pending ? "保存中…" : existing ? "変更を保存" : "項目を登録"}
      </button>
    </div>
  );

  return (
    <BottomSheet
      title={existing ? "管理項目の編集" : "管理項目を登録"}
      onClose={onClose}
      busy={pending}
      footer={footer}
    >
      <div className="flex flex-col gap-5">
        <div className="rounded-[10px] bg-surface-secondary px-4 py-3">
          <p className="text-[15px] font-medium text-foreground">
            {target.cropName}
          </p>
        </div>

        <SheetSection title="毎日確認すること" required>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="例: 潅水量の確認"
            autoFocus={!existing}
            className={inputClass}
          />
        </SheetSection>

        <SheetSection title="確認のしかた・基準">
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            placeholder="任意。管理タブで項目名の下に出ます"
            className="control-focus w-full resize-y rounded-[10px] border border-separator-strong bg-surface px-3 py-2.5 text-base text-foreground placeholder:text-foreground-tertiary"
          />
        </SheetSection>

        <SheetSection title="並び順">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            step="1"
            value={displayOrder}
            onChange={(event) => setDisplayOrder(event.target.value)}
            className={`${inputClass} text-right font-mono`}
          />
          <p className="mt-2 text-xs text-foreground-tertiary">
            小さいほど先に出ます。同じ値なら項目名の順です。
          </p>
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
