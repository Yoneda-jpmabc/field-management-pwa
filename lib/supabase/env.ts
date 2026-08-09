export type SupabaseEnv = {
  url: string;
  publishableKey: string;
};

/**
 * Supabase の接続情報をまとめて取り出す。
 * トップレベルで `!` を使うと未設定に気づけないまま不正なクライアントが作られるため、
 * 呼び出し時に検証して、欠けている変数名を含むエラーを投げる。
 */
export function getSupabaseEnv(): SupabaseEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    const missing: string[] = [];
    if (!url) missing.push("NEXT_PUBLIC_SUPABASE_URL");
    if (!publishableKey) missing.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
    throw new Error(
      `Supabase の環境変数が設定されていません: ${missing.join(", ")}`,
    );
  }

  return { url, publishableKey };
}
