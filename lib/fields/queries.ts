import { createSupabaseServerClient } from "@/lib/supabase/server";

export type FieldListItem = {
  id: string;
  name: string;
  crop: string | null;
  areaA: number | null;
  memo: string | null;
};

export type FieldList = {
  items: FieldListItem[];
  errorMessage: string | null;
};

export async function fetchFields(limit?: number): Promise<FieldList> {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("fields")
    .select("id, name, crop, area_a, memo")
    .is("deleted_at", null)
    .eq("is_active", true)
    .order("display_order")
    .order("name");

  if (limit !== undefined) query = query.limit(limit);

  const { data, error } = await query;

  return {
    items: (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      crop: row.crop,
      areaA: row.area_a,
      memo: row.memo,
    })),
    errorMessage: error ? `圃場の取得に失敗しました（${error.message}）。` : null,
  };
}
