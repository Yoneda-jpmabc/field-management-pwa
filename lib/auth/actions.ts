"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type LoginState = { message: string } | null;

/**
 * ログインIDとパスワードの組み合わせが違う、ID が存在しない、作業者が無効、
 * のいずれでも同じ文言を返す。どの ID が実在するかを画面から探れないようにするため。
 */
const FAILED = "ログインIDまたはパスワードが違います。";

/**
 * login_id + パスワードでログインする。
 *
 * Supabase Auth の signInWithPassword はメールしか受け付けないので、
 * login_id → workers.auth_email を引いてから渡す。auth.users は anon から
 * 読めないため、メールは workers 側に控えてある（20260902141658 のマイグレーション）。
 *
 * この workers の参照だけはログイン前＝未認証の状態で走る。RLS を締めるときも、
 * login_id / auth_email / is_active / deleted_at の参照は anon に残すか、
 * SECURITY DEFINER の関数に逃がすこと。ここが読めないとログインできなくなる。
 */
export async function signInWithLoginId(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  // 現場では大文字で印刷したものを手入力するので、小文字で打たれても通す。
  const loginId = String(formData.get("loginId") ?? "")
    .trim()
    .toUpperCase();
  const password = String(formData.get("password") ?? "");

  if (!loginId || !password) {
    return { message: "ログインIDとパスワードを入力してください。" };
  }

  const supabase = await createSupabaseServerClient();

  const { data: worker } = await supabase
    .from("workers")
    .select("auth_email, is_active, deleted_at")
    .eq("login_id", loginId)
    .maybeSingle();

  if (
    !worker?.auth_email ||
    !worker.is_active ||
    worker.deleted_at !== null
  ) {
    return { message: FAILED };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: worker.auth_email,
    password,
  });
  if (error) return { message: FAILED };

  // ログアウト中に見ていた画面のキャッシュを残さない。
  revalidatePath("/", "layout");
  // redirect は例外を投げるので、必ず try の外で呼ぶこと。
  redirect("/");
}

/** ログアウトして /login へ戻す。 */
export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  // 前の人の画面が Router Cache に残ったままにならないよう捨てる。
  revalidatePath("/", "layout");
  redirect("/login");
}
