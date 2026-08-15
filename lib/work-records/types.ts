/**
 * 作業実績モジュールの共有型。
 * UI(components/work-records) と データアクセス(lib/work-records) の両方から参照する。
 */

/** チップ・ボタン表示用に正規化したマスタ 1 件。 */
export type MasterOption = {
  id: string;
  label: string;
};

/** 作業者チップ用。人数が多いので雇用区分ごとに見出しを付けて探しやすくする。 */
export type WorkerOption = MasterOption & {
  /** 雇用区分（正社員 / パート / 実習生）。未設定は null。 */
  group: string | null;
};

/** work_type_raw のサジェスト候補（過去の入力を頻度順に並べたもの）。 */
export type WorkTypeSuggestion = {
  value: string;
  count: number;
};

/** 入力画面が保持するフォーム状態。 */
export type WorkRecordFormState = {
  workDate: string;
  /** "HH:MM"。未入力は空文字で持ち、送信時に null へ変換する。 */
  startTime: string;
  endTime: string;
  /** マスタから選んだ作業種類。未選択は null。 */
  workTypeId: string | null;
  /** 試験期間中のフリーテキスト作業種類。 */
  workTypeRaw: string;
  fieldId: string | null;
  cropId: string | null;
  selectedWorkerIds: string[];
  memo: string;
};

/** Server Action へ渡す入力。フォーム状態と同型だが、境界を明示するため別名にしている。 */
export type CreateWorkRecordsInput = WorkRecordFormState;

export type CreateWorkRecordsResult =
  | { ok: true; insertedCount: number; batchId: string }
  | { ok: false; message: string };

/**
 * 確認タブで扱う登録済みレコード 1 件。
 * 編集フォームへそのまま流し込めるよう ID を持ち、
 * マスタから外れた（無効化済みなどの）場合に備えて表示名も持つ。
 */
export type EditableWorkRecord = {
  id: string;
  workDate: string;
  /** "HH:MM"。未設定は空文字。 */
  startTime: string;
  endTime: string;
  workTypeId: string | null;
  workTypeRaw: string;
  fieldId: string | null;
  cropId: string | null;
  workerId: string;
  memo: string;
  workerName: string;
  workTypeLabel: string | null;
  fieldName: string | null;
  cropName: string | null;
};

/** 1 レコードの更新入力。 */
export type UpdateWorkRecordInput = {
  id: string;
  workDate: string;
  startTime: string;
  endTime: string;
  workTypeId: string | null;
  workTypeRaw: string;
  fieldId: string | null;
  cropId: string | null;
  workerId: string;
  memo: string;
};

export type WorkRecordMutationResult =
  | { ok: true }
  | { ok: false; message: string };
