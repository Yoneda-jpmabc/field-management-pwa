/**
 * 作物ごとの管理項目（デイリーチェックリスト）の共有型。
 * UI(components/care, components/settings) と データアクセス(lib/crop-checks) の
 * 両方から参照する。
 */

/** 管理タブに並べるチェック項目 1 件。その日の確認状態つき。 */
export type DailyCheckItem = {
  id: string;
  cropId: string;
  title: string;
  description: string | null;
  /** その日に確認済みか。 */
  isDone: boolean;
  /** その日のメモ。未入力は空文字。 */
  memo: string;
};

/** 管理タブに並べる作物 1 件。 */
export type DailyCheckCrop = {
  id: string;
  name: string;
  items: DailyCheckItem[];
  /** 確認済みの件数。見出しの「3/5」表示に使う。 */
  doneCount: number;
};

/** 設定画面の編集フォームに流し込むチェック項目 1 件。 */
export type EditableCheckItem = {
  id: string;
  cropId: string;
  title: string;
  description: string;
  displayOrder: number;
};

/** 設定画面で作物ごとにまとめたチェック項目。 */
export type CropCheckItemGroup = {
  cropId: string;
  cropName: string;
  items: EditableCheckItem[];
};

/** チェック項目の登録・更新入力。 */
export type CheckItemInput = {
  /** 新規なら null。 */
  id: string | null;
  cropId: string;
  title: string;
  description: string;
  /** 空文字は 0 として扱う。 */
  displayOrder: string;
};

export type CheckMutationResult =
  | { ok: true }
  | { ok: false; message: string };
