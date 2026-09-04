/**
 * 丸いチェック標識。ホームの作業予定と実績登録の「休憩を含まない」で共通に使う。
 * これ自体は入力ではないので、<label> の中で視覚表現として置き、状態は隣に
 * sr-only で置いた <input type="checkbox"> に持たせる（作業予定はボタンの押下状態）。
 */
export function CheckMark({
  checked,
  className = "",
}: {
  checked: boolean;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-white ${
        checked ? "border-success bg-success" : "border-separator-strong"
      } ${className}`}
    >
      {checked && <span className="text-[11px] leading-none">✓</span>}
    </span>
  );
}
