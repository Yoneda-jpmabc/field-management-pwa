import { NextResponse } from "next/server";
import { checkSupabaseHealth } from "@/lib/supabase/health";

/**
 * 設定画面の「再確認」ボタン用。
 * 初回表示はページ側（Server Component）で確認済みなので、
 * このハンドラは押し直したときだけ呼ばれる。
 */
export async function GET() {
  const health = await checkSupabaseHealth();
  return NextResponse.json(health, { status: health.ok ? 200 : 502 });
}
