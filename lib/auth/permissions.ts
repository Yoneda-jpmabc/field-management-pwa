/**
 * 権限区分と、その判定。
 *
 * Server Component / Client Component の両方から参照するので、
 * ここには秘密情報も Node 依存も持ち込まないこと（Cookie や DB は session.ts 側）。
 *
 * 判定はこのファイルに集約する。画面ごとに `permission === "all"` と直接書くと、
 * 権限を増やしたときに直し漏れが出るため。
 */

export const PERMISSIONS = ["all", "allowed", "view_only"] as const;
export type Permission = (typeof PERMISSIONS)[number];

export const PERMISSION_LABELS: Record<Permission, string> = {
  all: "全権限",
  allowed: "登録・編集",
  view_only: "閲覧のみ",
};

/** DB の text 列を Permission に落とす。想定外の値は最も弱い権限に倒す。 */
export function toPermission(value: string | null | undefined): Permission {
  return (PERMISSIONS as readonly string[]).includes(value ?? "")
    ? (value as Permission)
    : "view_only";
}

/**
 * 圃場・作付・作物マスタの登録編集ができるか。
 * 運用上ここに該当するのは米田さん（permission = 'all'）だけ。
 */
export function canEditMasters(permission: Permission): boolean {
  return permission === "all";
}

/** 実績・予定・収穫の登録編集ができるか。 */
export function canEditRecords(permission: Permission): boolean {
  return permission === "all" || permission === "allowed";
}

/**
 * 自分以外の記録も含めて見られるか。
 * view_only は自分に関係する記録だけに絞り、全体集計の画面自体を出さない。
 */
export function canViewEveryone(permission: Permission): boolean {
  return permission !== "view_only";
}
