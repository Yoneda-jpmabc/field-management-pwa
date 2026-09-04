import { IconChevronRight } from "@/components/icons";

/**
 * 丸い前後移動ボタン（山型アイコン入り）。
 * 実績登録のカード送りと、ホームの週送りで共通に使う。
 */
export function RoundArrowButton({
  direction,
  label,
  onClick,
  disabled = false,
  className = "",
}: {
  direction: "prev" | "next";
  label: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`control-focus pressable flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full border border-separator-strong bg-surface text-foreground-secondary disabled:border-separator disabled:text-foreground-tertiary ${className}`}
    >
      <IconChevronRight
        className={`h-4 w-4 ${direction === "prev" ? "rotate-180" : ""}`}
      />
    </button>
  );
}
