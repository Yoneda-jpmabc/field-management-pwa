import { PERMISSIONS, type Permission } from "./permissions";

/**
 * 権限プレビュー（設定タブの「権限の見え方を確認」）。
 *
 * 全権限の人が、いちいちログインし直さずに「登録・編集の人にはこう見える」
 * 「閲覧のみの人にはこう見える」を確かめるための仕組み。
 *
 * 効くのは画面と Server Action の権限確認まで。DB の RLS は本人の
 * workers.permission を見ているので、プレビュー中でも DB 側の許可は
 * 変わらない（下げているだけなので、できることが増えることはない）。
 *
 * Cookie に置くのは、Server Component から読めないと画面の出し分けに
 * 使えないため。localStorage だとサーバー側で権限を決められない。
 */
export const PREVIEW_COOKIE = "preview_permission";

/**
 * 本当の権限とプレビュー指定から、画面が従うべき権限を決める。
 *
 * プレビューを許すのは全権限の人だけ。ほかの人の Cookie は無視する。
 * 手で Cookie を書けば誰でも値を送れるので、ここで必ず本人の権限を見ること
 * （全権限の人が下げる方向にしか使えないため、権限が増えることはない）。
 */
export function effectivePermission(
  realPermission: Permission,
  previewValue: string | undefined,
): Permission {
  if (realPermission !== "all") return realPermission;
  if (!previewValue) return realPermission;
  return (PERMISSIONS as readonly string[]).includes(previewValue)
    ? (previewValue as Permission)
    : realPermission;
}
