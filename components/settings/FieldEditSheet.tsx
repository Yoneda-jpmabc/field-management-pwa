"use client";

import { useState, useTransition } from "react";
import { BottomSheet, SheetSection } from "@/components/ui/BottomSheet";
import { deleteField, saveField } from "@/lib/fields/actions";
import type { EditableField } from "@/lib/fields/queries";

/** 新規なら null、編集なら対象の圃場。 */
export type FieldSheetTarget = EditableField | null;

type Props = {
  target: FieldSheetTarget;
  onClose: () => void;
  onDone: (message: string) => void;
};

const inputClass =
  "control-focus min-h-12 w-full rounded-[10px] border border-separator-strong bg-surface px-3 text-base text-foreground placeholder:text-foreground-tertiary";

export function FieldEditSheet({ target, onClose, onDone }: Props) {
  const [name, setName] = useState(target?.name ?? "");
  const [areaA, setAreaA] = useState(
    target?.areaA === null || target?.areaA === undefined
      ? ""
      : String(target.areaA),
  );
  const [crop, setCrop] = useState(target?.crop ?? "");
  const [memo, setMemo] = useState(target?.memo ?? "");
  const [displayOrder, setDisplayOrder] = useState(
    String(target?.displayOrder ?? 0),
  );
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const canSave = name.trim() !== "";

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      const result = await saveField({
        id: target?.id ?? null,
        name,
        areaA,
        crop,
        memo,
        displayOrder,
      });
      if (result.ok) {
        onDone(target ? "圃場を更新しました。" : "圃場を登録しました。");
      } else {
        setError(result.message);
      }
    });
  };

  const handleDelete = () => {
    if (!target) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteField(target.id);
      if (result.ok) {
        onDone("圃場を削除しました。");
      } else {
        setConfirmingDelete(false);
        setError(result.message);
      }
    });
  };

  const footer = confirmingDelete ? (
    <div>
      <p className="mb-3 text-center text-sm font-medium text-foreground">
        「{target?.name}」を削除しますか？
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
      {target && (
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
        {pending ? "保存中…" : target ? "変更を保存" : "圃場を登録"}
      </button>
    </div>
  );

  return (
    <BottomSheet
      title={target ? "圃場の編集" : "圃場を登録"}
      onClose={onClose}
      busy={pending}
      footer={footer}
    >
      <div className="flex flex-col gap-5">
        <SheetSection title="圃場名" required>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="例: 第1ハウス / 東の畑"
            autoFocus={!target}
            className={inputClass}
          />
        </SheetSection>

        <SheetSection title="面積（アール）">
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={areaA}
            onChange={(event) => setAreaA(event.target.value)}
            placeholder="未入力可"
            className={`${inputClass} text-right font-mono`}
          />
        </SheetSection>

        <SheetSection title="主な作物（メモ）">
          <input
            type="text"
            value={crop}
            onChange={(event) => setCrop(event.target.value)}
            placeholder="任意。一覧での目印に使う覚え書き"
            className={inputClass}
          />
          <p className="mt-2 text-xs text-foreground-tertiary">
            収穫画面に出る作物は、圃場ごとの「作付」で登録したものです。ここは一覧の目印用です。
          </p>
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
            小さいほど先に出ます。同じ値なら圃場名の順です。
          </p>
        </SheetSection>

        <SheetSection title="メモ">
          <textarea
            value={memo}
            onChange={(event) => setMemo(event.target.value)}
            rows={3}
            placeholder="任意"
            className="control-focus w-full resize-y rounded-[10px] border border-separator-strong bg-surface px-3 py-2.5 text-base text-foreground placeholder:text-foreground-tertiary"
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
