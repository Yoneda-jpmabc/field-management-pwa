import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SupabaseHealth = {
  ok: boolean;
  message: string;
};

/**
 * まだテーブルが 1 つも無いため、存在しないテーブル名をわざと引いて疎通を確かめている。
 * PostgREST が返す PGRST205（スキーマキャッシュに無い）は DB まで到達できた証拠になり、
 * キーが不正なら手前の 401 で弾かれるので両者を区別できる。
 *
 * テーブルを作ったら PROBE_TABLE を実テーブル名に変えるだけでよい。
 */
const PROBE_TABLE = "__connectivity_check__";
const TABLE_NOT_FOUND = "PGRST205";

export async function GET() {
  let supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  try {
    supabase = await createSupabaseServerClient();
  } catch (error) {
    return NextResponse.json<SupabaseHealth>(
      {
        ok: false,
        message:
          error instanceof Error ? error.message : "環境変数の読み込みに失敗しました。",
      },
      { status: 500 },
    );
  }

  const { error } = await supabase.from(PROBE_TABLE).select("*").limit(1);

  if (!error) {
    return NextResponse.json<SupabaseHealth>({
      ok: true,
      message: "Supabase に接続できました。",
    });
  }

  if (error.code === TABLE_NOT_FOUND) {
    return NextResponse.json<SupabaseHealth>({
      ok: true,
      message: "Supabase に接続できました。テーブルはまだ作成されていません。",
    });
  }

  return NextResponse.json<SupabaseHealth>(
    { ok: false, message: describeError(error.message) },
    { status: 502 },
  );
}

function describeError(message: string): string {
  if (message.includes("Invalid API key")) {
    return "APIキーが拒否されました。NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY を確認してください。";
  }
  if (message.includes("fetch failed")) {
    return "Supabase に到達できませんでした。プロジェクトが一時停止中でないか、URL が正しいか確認してください。";
  }
  return `Supabase でエラーが発生しました（${message}）。`;
}
