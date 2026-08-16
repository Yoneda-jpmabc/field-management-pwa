import "server-only";

import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

/**
 * 暗証番号（PIN）のハッシュ化。
 *
 * 平文は DB にもログにも残さない。scrypt は Node 標準に入っているので、
 * bcrypt / argon2 のような追加依存を足さずに済む。
 * ソルトは 1 件ごとに変え、`salt:hash` の 1 列にまとめて保存する。
 */

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: string,
  keylen: number,
) => Promise<Buffer>;

const KEY_LENGTH = 64;

/** 暗証番号の最低桁数。総当たりを考えると 4 桁は短いが、現場の入力しやすさを優先している。 */
export const MIN_PIN_LENGTH = 4;
export const MAX_PIN_LENGTH = 12;

/** 数字のみ・桁数の検証。問題なければ null を返す。 */
export function validatePinFormat(pin: string): string | null {
  if (!/^\d+$/.test(pin)) {
    return "暗証番号は数字だけで入力してください。";
  }
  if (pin.length < MIN_PIN_LENGTH || pin.length > MAX_PIN_LENGTH) {
    return `暗証番号は${MIN_PIN_LENGTH}〜${MAX_PIN_LENGTH}桁で入力してください。`;
  }
  return null;
}

export async function hashPin(pin: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = await scryptAsync(pin, salt, KEY_LENGTH);
  return `${salt}:${derived.toString("hex")}`;
}

/**
 * 保存済みハッシュとの照合。
 * 比較は timingSafeEqual で行い、一致した文字数から桁を推測されないようにする。
 */
export async function verifyPin(pin: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;

  const expected = Buffer.from(hash, "hex");
  const derived = await scryptAsync(pin, salt, KEY_LENGTH);
  if (expected.length !== derived.length) return false;

  return timingSafeEqual(expected, derived);
}
