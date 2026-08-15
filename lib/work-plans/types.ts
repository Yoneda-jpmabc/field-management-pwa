/**
 * 作業予定モジュールの共有型。
 * 実績（work_records）と違い、予定は「大まかに置いておく」ことを優先するので
 * 作業者も時刻も持たず、日付とタイトルだけで成立する。
 */

/** カレンダーに表示する予定 1 件。 */
export type WorkPlan = {
  id: string;
  planDate: string;
  title: string;
  cropId: string | null;
  fieldId: string | null;
  memo: string;
  isDone: boolean;
  /** マスタから外れた場合に備えて表示名も持つ。 */
  cropName: string | null;
  fieldName: string | null;
};

/** 新規作成の入力。 */
export type CreateWorkPlanInput = {
  planDate: string;
  title: string;
  cropId: string | null;
  fieldId: string | null;
  memo: string;
};

/** 更新の入力。 */
export type UpdateWorkPlanInput = CreateWorkPlanInput & {
  id: string;
  isDone: boolean;
};

export type WorkPlanMutationResult =
  | { ok: true }
  | { ok: false; message: string };
