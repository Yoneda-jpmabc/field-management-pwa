/**
 * 作業区分の見分け用パレット。確認タブ（日ごと）のタイムラインと、
 * 実績登録の区分選択チップの両方で同じ色を使う（画面をまたいでも
 * 「この色はこの区分」と覚えられるようにするため）。
 *
 * dataviz スキルの検証済みカテゴリカル配色（8色）から、このアプリの
 * 実際の背景色に対して隣接ペアの CVD 安全性・コントラストを確認した
 * 先頭6色を、区分マスタの並び順に固定で割り当てる。7番目以降・区分が
 * 分からない記録は色を増やさず、無彩色の foreground-tertiary に畳む。
 */
export const CATEGORY_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
];

export const OTHER_CATEGORY_COLOR = "var(--foreground-tertiary)";

/** 区分マスタでの並び順（0始まり）から色を引く。7番目以降はグレーに畳む。 */
export function colorForCategoryIndex(index: number): string {
  return index >= 0 && index < CATEGORY_COLORS.length
    ? CATEGORY_COLORS[index]
    : OTHER_CATEGORY_COLOR;
}
