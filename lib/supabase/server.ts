import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseEnv } from "./env";

/**
 * Server Component / Route Handler から使う Supabase クライアント。
 * リクエストごとに新しく作る必要があるため、使い回さず毎回この関数を呼ぶこと。
 *
 * Next.js 16 の `cookies()` は非同期なので、ファクトリ自体を async にしている。
 */
export async function createSupabaseServerClient() {
  const { url, publishableKey } = getSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Component のレンダリング中は Cookie を書き込めない。
          // セッション更新は将来 proxy.ts 側で行うため、ここでは握りつぶす。
        }
      },
    },
  });
}
