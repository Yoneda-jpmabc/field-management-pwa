import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { WorkPlan } from "./types";

export type WorkPlanList = {
  items: WorkPlan[];
  errorMessage: string | null;
};

/**
 * 指定期間の作業予定を取得する。
 * 週カレンダーは 1 週間ぶんをまとめて引き、日付ごとの振り分けは表示側で行う。
 */
export async function fetchWorkPlans(
  fromDate: string,
  toDate: string,
): Promise<WorkPlanList> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("work_plans")
    .select(
      "id, plan_date, title, crop_id, field_id, memo, is_done, crops(name), fields(name)",
    )
    .is("deleted_at", null)
    .gte("plan_date", fromDate)
    .lte("plan_date", toDate)
    .order("plan_date")
    .order("display_order")
    .order("created_at");

  return {
    items: (data ?? []).map((row) => ({
      id: row.id,
      planDate: row.plan_date,
      title: row.title,
      cropId: row.crop_id,
      fieldId: row.field_id,
      memo: row.memo ?? "",
      isDone: row.is_done,
      cropName: row.crops?.name ?? null,
      fieldName: row.fields?.name ?? null,
    })),
    errorMessage: error
      ? `作業予定の取得に失敗しました（${error.message}）。`
      : null,
  };
}

/**
 * 予定入力のサジェスト候補。
 * 直近に登録した予定名を新しい順に重複を除いて返す。
 * 件数が少ないうちは DB 側で集計するほどでもないので、ここで畳む。
 */
export async function fetchPlanTitleSuggestions(limit = 8): Promise<string[]> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("work_plans")
    .select("title")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(100);

  const seen = new Set<string>();
  for (const row of data ?? []) {
    const title = row.title.trim();
    if (title) seen.add(title);
    if (seen.size >= limit) break;
  }
  return [...seen];
}
