import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "./env";

/**
 * Client Component から使う Supabase クライアント。
 * モジュール読み込み時に副作用を出さないよう、関数として呼び出す形にしている。
 * Cookie の読み書きは @supabase/ssr が document.cookie 経由で面倒を見る。
 */
export function createSupabaseBrowserClient() {
  const { url, publishableKey } = getSupabaseEnv();
  return createBrowserClient(url, publishableKey);
}
