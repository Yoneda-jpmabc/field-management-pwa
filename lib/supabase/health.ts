import { createSupabaseServerClient } from "./server";

export type SupabaseHealth = {
  ok: boolean;
  message: string;
  /**
   * 接続はできたが伝えるべき注意がある場合だけ true。
   * 成功時のメッセージを常に表示すると画面が冗長になるため、
   * 表示するかどうかの判断をこのフラグに寄せている。
   */
  note?: boolean;
};

/**
 * 実テーブルを 1 行だけ引いて疎通を確かめる。
 * PGRST205（スキーマキャッシュに無い）が返ったときも DB までは到達できているので、
 * 接続そのものは OK として扱う。キーが不正なら手前の 401 で弾かれる。
 */
const PROBE_TABLE = "workers";
const TABLE_NOT_FOUND = "PGRST205";

export async function checkSupabaseHealth(): Promise<SupabaseHealth> {
  let supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  try {
    supabase = await createSupabaseServerClient();
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "環境変数の読み込みに失敗しました。",
    };
  }

  const { error } = await supabase.from(PROBE_TABLE).select("*").limit(1);

  if (!error) {
    return { ok: true, message: "Supabase に接続できました。" };
  }

  if (error.code === TABLE_NOT_FOUND) {
    return {
      ok: true,
      message: "スキーマキャッシュが古い可能性があります。",
      note: true,
    };
  }

  return { ok: false, message: describeError(error.message) };
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
