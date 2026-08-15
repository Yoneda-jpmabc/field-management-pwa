type IconProps = {
  className?: string;
};

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function IconGrid({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </svg>
  );
}

export function IconLeaf({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M20 4c.6 7-2 13-8 16-6-3-8-9-6-14 5 1 9-1 14-2Z" />
      <path d="M12 20c1-4 2.5-7 6-10" />
    </svg>
  );
}

export function IconStrawberry({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M12 21.2c-3.7-1.9-6.2-5.2-6.2-8.4A4.9 4.9 0 0 1 12 8.2a4.9 4.9 0 0 1 6.2 4.6c0 3.2-2.5 6.5-6.2 8.4Z" />
      <path d="M12 8.2V4.8" />
      <path d="M7.8 5.4c1.4-.7 2.9-.6 4.2-.2 1.3-.4 2.8-.5 4.2.2-1.1 1.3-2.6 1.8-4.2 1.7-1.6.1-3.1-.4-4.2-1.7Z" />
      <path d="M10 13h.01M14 13h.01M12 16.4h.01" />
    </svg>
  );
}

export function IconTomato({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M12 21a7.2 7.2 0 0 0 7.2-7.2c0-3.4-3.2-5.7-7.2-5.7s-7.2 2.3-7.2 5.7A7.2 7.2 0 0 0 12 21Z" />
      <path d="M12 8.1V5.2" />
      <path d="M8.2 7.2 12 8.6l3.8-1.4" />
    </svg>
  );
}

/** きくらげなど、傘がひらひらしたキノコ類。 */
export function IconMushroom({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M4.8 15.6c0-6 3.6-10.2 8.2-10.2 3.9 0 6.2 2.7 6.2 6.2 0 4.8-4.3 7.8-8.8 7.8-3.2 0-5.6-1.5-5.6-3.8Z" />
      <path d="M9.4 18.6c-.8-3.7.3-7.4 3.2-10" />
      <path d="M13.8 18.8c-1.2-3.5-.4-6.9 2.2-9.4" />
    </svg>
  );
}

/** サツマイモ。細長い紡錘形で、丸いジャガイモ類と描き分ける。 */
export function IconSweetPotato({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M6.4 17.6c-2.1-2.1-1.2-6 2-9.2s7.1-4.1 9.2-2 1.2 6-2 9.2-7.1 4.1-9.2 2Z" />
      <path d="M18.6 5.4 20.4 3.6M5.4 18.6 3.6 20.4" />
      <path d="M10.2 13.8h.01M13.8 10.2h.01" />
    </svg>
  );
}

/** ジャガイモ・里芋などの「イモ」全般。 */
export function IconPotato({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M5.4 14c0-4.1 3-7.4 6.7-7.4 3.6 0 6.5 2.7 6.5 6.6 0 3.4-2.7 6.3-6.3 6.3-3.6 0-6.9-2-6.9-5.5Z" />
      <path d="M10 11.4h.01M14.2 14.4h.01M12.6 9.4h.01" />
    </svg>
  );
}

export function IconOnion({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M12 21c-3.6 0-6.1-2.5-6.1-5.8 0-3.5 3-6.5 6.1-8.4 3.1 1.9 6.1 4.9 6.1 8.4 0 3.3-2.5 5.8-6.1 5.8Z" />
      <path d="M12 6.8V3.6M12 5.6c1-.8 1.7-1.8 2.1-2.9" />
      <path d="M9.4 9.6c-.9 1.9-1.1 3.8-.7 5.7M14.6 9.6c.9 1.9 1.1 3.8.7 5.7" />
    </svg>
  );
}

/** 育苗中の株。作物名から種類が特定できないときの苗用。 */
export function IconSeedling({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M12 20.5v-7.8" />
      <path d="M12 13.6C10.6 10.9 8 9.6 4.6 9.6c0 3.4 1.6 5.8 4.6 6.4 1 .2 1.9.1 2.8-.3" />
      <path d="M12 12.4c1-2.6 3.2-4.1 6.4-4.4-.2 3.3-1.6 5.4-4.2 6.1-.8.2-1.5.2-2.2 0" />
      <path d="M6.5 20.5h11" />
    </svg>
  );
}

export function IconNote({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M6 3.5h9l3.5 3.5V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" />
      <path d="M15 3.5V7a1 1 0 0 0 1 1h3.5" />
      <path d="M8 12h8M8 15.5h8M8 8.5h3" />
    </svg>
  );
}

export function IconChecklist({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M9 4.5H7a1 1 0 0 0-1 1V20a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V5.5a1 1 0 0 0-1-1h-2" />
      <rect x="9" y="3" width="6" height="3" rx="1" />
      <path d="m8.75 12 1.6 1.6 3.4-3.4" />
      <path d="M8.75 17.2h6.5" />
    </svg>
  );
}

export function IconSync({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M4 12a8 8 0 0 1 13.66-5.66L20 8.5" />
      <path d="M20 4.5v4h-4" />
      <path d="M20 12a8 8 0 0 1-13.66 5.66L4 15.5" />
      <path d="M4 19.5v-4h4" />
    </svg>
  );
}

/** 電源マーク。同期の接続状態を「入・切」として見せるのに使う。 */
export function IconPower({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M12 4v8" />
      <path d="M17.7 7A8 8 0 1 1 6.3 7" />
    </svg>
  );
}

export function IconSearch({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m20 20-4.8-4.8" />
    </svg>
  );
}

export function IconPlus({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconChevronRight({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="m9 5 7 7-7 7" />
    </svg>
  );
}

export function IconSun({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2.5v2.3M12 19.2v2.3M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2.5 12h2.3M19.2 12h2.3M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6" />
    </svg>
  );
}

export function IconMoon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M20.5 14.7A8.5 8.5 0 1 1 9.3 3.5a7 7 0 0 0 11.2 11.2Z" />
    </svg>
  );
}

/**
 * 作物名からアイコンを引く対応表。
 * 作物マスタは自由に増えるので、名称の部分一致で判定し、
 * 該当がなければ葉アイコンにフォールバックする。
 * 「サツマイモ」を「イモ」より先に見るなど、限定的な語を上に置くこと。
 */
const CROP_ICON_RULES: { keywords: string[]; Icon: (props: IconProps) => React.JSX.Element }[] = [
  { keywords: ["いちご", "イチゴ", "苺"], Icon: IconStrawberry },
  { keywords: ["とまと", "トマト"], Icon: IconTomato },
  { keywords: ["きくらげ", "キクラゲ", "木耳", "しいたけ", "シイタケ", "椎茸", "きのこ", "キノコ"], Icon: IconMushroom },
  { keywords: ["さつまいも", "サツマイモ", "薩摩芋", "甘藷"], Icon: IconSweetPotato },
  { keywords: ["たまねぎ", "タマネギ", "玉ねぎ", "玉葱"], Icon: IconOnion },
  { keywords: ["じゃがいも", "ジャガイモ", "馬鈴薯", "さといも", "サトイモ", "里芋", "いも", "イモ", "芋"], Icon: IconPotato },
  { keywords: ["苗"], Icon: IconSeedling },
];

/** 作物チップ用のアイコン。name はマスタの表示名（例:「イモ（苗）」）をそのまま渡す。 */
export function CropIcon({ name, className }: IconProps & { name: string }) {
  const rule = CROP_ICON_RULES.find((candidate) =>
    candidate.keywords.some((keyword) => name.includes(keyword)),
  );
  const Icon = rule?.Icon ?? IconLeaf;
  return <Icon className={className} />;
}

export function IconSettings({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
