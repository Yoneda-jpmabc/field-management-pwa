"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  createSession,
  destroySession,
  getCurrentWorker,
} from "./session";
import { hashPin, validatePinFormat, verifyPin } from "./pin";

/**
 * ログイン画面の状態。
 *
 * stage は入力欄の出し分けに使う。
 *   signin … 暗証番号を 1 つだけ入力する（通常）
 *   setup  … 暗証番号がまだ無い人が、初回に決める（確認用の欄も出す）
 */
export type SignInState = {
  stage: "signin" | "setup";
  /** 再表示用。入力し直しの手間を減らすため、ログインIDだけ引き継ぐ。 */
  loginId: string;
  message: string | null;
};

export const SIGN_IN_INITIAL_STATE: SignInState = {
  stage: "signin",
  loginId: "",
  message: null,
};

/** オープンリダイレクト対策。自サイト内の絶対パスだけ許す。 */
function safeReturnTo(value: FormDataEntryValue | null): string {
  const path = typeof value === "string" ? value : "";
  if (!path.startsWith("/") || path.startsWith("//")) return "/";
  return path;
}

export async function signIn(
  _prevState: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const loginId = String(formData.get("loginId") ?? "").trim();
  const pin = String(formData.get("pin") ?? "").trim();
  const pinConfirm = String(formData.get("pinConfirm") ?? "").trim();
  const stage = formData.get("stage") === "setup" ? "setup" : "signin";
  const next = safeReturnTo(formData.get("next"));

  if (loginId === "") {
    return { stage: "signin", loginId, message: "ログインIDを入力してください。" };
  }

  const supabase = await createSupabaseServerClient();
  const { data: worker, error } = await supabase
    .from("workers")
    .select("id, login_id, pin_hash")
    .eq("login_id", loginId)
    .is("deleted_at", null)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    return {
      stage,
      loginId,
      message: `ログインできませんでした（${error.message}）。`,
    };
  }

  // ID の有無で文面を変えると、存在するIDを総当たりで探せてしまう。
  // 見つからない場合と暗証番号違いは同じ文面にする。
  const failureMessage = "ログインIDまたは暗証番号が違います。";
  if (!worker) {
    return { stage: "signin", loginId, message: failureMessage };
  }

  // 暗証番号が未設定の人は、初回ログインで本人に決めてもらう。
  if (worker.pin_hash === null) {
    if (stage !== "setup") {
      return {
        stage: "setup",
        loginId,
        message:
          "初回ログインです。これから使う暗証番号を決めてください（数字4〜12桁）。",
      };
    }

    const invalid = validatePinFormat(pin);
    if (invalid) {
      return { stage: "setup", loginId, message: invalid };
    }
    if (pin !== pinConfirm) {
      return {
        stage: "setup",
        loginId,
        message: "確認用の暗証番号が一致しません。",
      };
    }

    const { error: updateError } = await supabase
      .from("workers")
      .update({ pin_hash: await hashPin(pin) })
      .eq("id", worker.id)
      // 別の端末で先に設定されていた場合は上書きしない。
      .is("pin_hash", null);

    if (updateError) {
      return {
        stage: "setup",
        loginId,
        message: `暗証番号を設定できませんでした（${updateError.message}）。`,
      };
    }

    await createSession(worker.id);
    redirect(next);
  }

  if (pin === "" || !(await verifyPin(pin, worker.pin_hash))) {
    return { stage: "signin", loginId, message: failureMessage };
  }

  await createSession(worker.id);
  redirect(next);
}

export async function signOut(): Promise<void> {
  await destroySession();
  redirect("/login");
}

export type ChangePinState = {
  message: string | null;
  ok: boolean;
};

export const CHANGE_PIN_INITIAL_STATE: ChangePinState = {
  message: null,
  ok: false,
};

/** ログイン中の本人が自分の暗証番号を変える。他人の分は変えられない。 */
export async function changePin(
  _prevState: ChangePinState,
  formData: FormData,
): Promise<ChangePinState> {
  const worker = await getCurrentWorker();
  if (!worker) {
    return { ok: false, message: "ログインし直してください。" };
  }

  const currentPin = String(formData.get("currentPin") ?? "").trim();
  const newPin = String(formData.get("newPin") ?? "").trim();
  const newPinConfirm = String(formData.get("newPinConfirm") ?? "").trim();

  const invalid = validatePinFormat(newPin);
  if (invalid) return { ok: false, message: invalid };
  if (newPin !== newPinConfirm) {
    return { ok: false, message: "確認用の暗証番号が一致しません。" };
  }

  const supabase = await createSupabaseServerClient();
  const { data: row, error } = await supabase
    .from("workers")
    .select("pin_hash")
    .eq("id", worker.id)
    .maybeSingle();

  if (error || !row) {
    return { ok: false, message: "現在の暗証番号を確認できませんでした。" };
  }
  if (row.pin_hash !== null && !(await verifyPin(currentPin, row.pin_hash))) {
    return { ok: false, message: "今の暗証番号が違います。" };
  }

  const { error: updateError } = await supabase
    .from("workers")
    .update({ pin_hash: await hashPin(newPin) })
    .eq("id", worker.id);

  if (updateError) {
    return {
      ok: false,
      message: `変更できませんでした（${updateError.message}）。`,
    };
  }

  return { ok: true, message: "暗証番号を変更しました。" };
}
