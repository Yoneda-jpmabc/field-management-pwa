import { weatherKind } from "@/lib/weather/wmo";

/**
 * UI アイコンはすべて Tabler Icons（https://tabler.io/icons, MIT License / © Paweł Kuna）から
 * 「outline」スタイルのパスを転記して使う。新しいアイコンが必要になったら
 *
 *   1. tabler.io/icons で語を選び（例: "basket", "calendar-check"）、
 *   2. その SVG の <path> だけをこのファイルに `Icon◯◯` として足す（1 コンポーネント 1 アイコン）、
 *   3. 使う側は `className` で 24px グリッド前提のサイズを指定する。
 *
 * Tabler に無いもの（いちご・トマト・さつまいも・じゃがいも・玉ねぎ、天気の「晴れ時々くもり」）
 * だけは Tabler の作法（24px グリッド / fill:none / stroke:currentColor / round キャップ）に合わせて自作する。
 * 線幅は Tabler 標準の 2 に統一。選択状態は色だけで表し、線幅は変えない。
 */

type IconProps = {
  className?: string;
};

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/* ---- Tabler Icons（outline）からの転記 ---- */

/** Tabler: layout-grid */
export function IconGrid({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M4 5a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -4" />
      <path d="M14 5a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -4" />
      <path d="M4 15a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -4" />
      <path d="M14 15a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -4" />
    </svg>
  );
}

/** Tabler: leaf */
export function IconLeaf({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M5 21c.5 -4.5 2.5 -8 7 -10" />
      <path d="M9 18c6.218 0 10.5 -3.288 11 -12v-2h-4.014c-9 0 -11.986 4 -12 9c0 1 0 3 2 5h3l.014 0" />
    </svg>
  );
}

/** 収穫かご。収穫タブのアイコン。Tabler: basket */
export function IconBasket({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M10 14a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
      <path d="M5.001 8h13.999a2 2 0 0 1 1.977 2.304l-1.255 7.152a3 3 0 0 1 -2.966 2.544h-9.512a3 3 0 0 1 -2.965 -2.544l-1.255 -7.152a2 2 0 0 1 1.977 -2.304" />
      <path d="M17 10l-2 -6" />
      <path d="M7 10l2 -6" />
    </svg>
  );
}

/** 日めくりのチェック。作物ごとの日々の管理タブに使う。Tabler: calendar-check */
export function IconCalendarCheck({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M11.5 21h-5.5a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v6" />
      <path d="M16 3v4" />
      <path d="M8 3v4" />
      <path d="M4 11h16" />
      <path d="M15 19l2 2l4 -4" />
    </svg>
  );
}

/** 施錠。権限で操作できない項目に添える。Tabler: lock */
export function IconLock({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M5 13a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v6a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-6" />
      <path d="M11 16a1 1 0 1 0 2 0a1 1 0 0 0 -2 0" />
      <path d="M8 11v-4a4 4 0 1 1 8 0v4" />
    </svg>
  );
}

/** Tabler: checklist */
export function IconChecklist({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M9.615 20h-2.615a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v8" />
      <path d="M14 19l2 2l4 -4" />
      <path d="M9 8h4" />
      <path d="M9 12h2" />
    </svg>
  );
}

/** 実績タブ。作業記録＋集計＝報告書のイメージ。Tabler: report */
export function IconReport({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M8 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h5.697" />
      <path d="M18 14v4h4" />
      <path d="M18 11v-4a2 2 0 0 0 -2 -2h-2" />
      <path d="M8 5a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2" />
      <path d="M14 18a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" />
      <path d="M8 11h4" />
      <path d="M8 15h3" />
    </svg>
  );
}

/** Tabler: refresh */
export function IconSync({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
      <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
    </svg>
  );
}

/** 電源マーク。同期の接続状態を「入・切」として見せるのに使う。Tabler: power */
export function IconPower({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M7 6a7.75 7.75 0 1 0 10 0" />
      <path d="M12 4l0 8" />
    </svg>
  );
}

/** Tabler: search */
export function IconSearch({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M3 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" />
      <path d="M21 21l-6 -6" />
    </svg>
  );
}

/** Tabler: plus */
export function IconPlus({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M12 5l0 14" />
      <path d="M5 12l14 0" />
    </svg>
  );
}

/** 時間未入力・不正な入力の警告バッジに使う。Tabler: alert-triangle */
export function IconAlertTriangle({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M12 9v4" />
      <path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0z" />
      <path d="M12 16h.01" />
    </svg>
  );
}

/** Tabler: chevron-right */
export function IconChevronRight({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M9 6l6 6l-6 6" />
    </svg>
  );
}

/** Tabler: settings */
export function IconSettings({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065" />
      <path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
    </svg>
  );
}

/* ---- 天気（ヘッダーの WeatherIcon から使う。Tabler の cloud-* / sun / moon） ---- */

/** Tabler: sun */
export function IconSun({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M8 12a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" />
      <path d="M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7" />
    </svg>
  );
}

/** Tabler: moon */
export function IconMoon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454l0 .008" />
    </svg>
  );
}

/** Tabler: cloud */
export function IconCloud({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M6.657 18c-2.572 0 -4.657 -2.007 -4.657 -4.483c0 -2.475 2.085 -4.482 4.657 -4.482c.393 -1.762 1.794 -3.2 3.675 -3.773c1.88 -.572 3.956 -.193 5.444 1c1.488 1.19 2.162 3.007 1.77 4.769h.99c1.913 0 3.464 1.56 3.464 3.486c0 1.927 -1.551 3.487 -3.465 3.487h-11.878" />
    </svg>
  );
}

/**
 * 晴れ時々くもり（昼）。Tabler に該当語が無いため、Tabler の作法に合わせて自作。
 * 夜は WeatherIcon 側で IconCloud に差し替える。
 */
export function IconCloudSun({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="8" cy="7.5" r="3" />
      <path d="M8 1.8v1.4M8 11.8v1.4M2.3 7.5h1.4M12.3 7.5h1.4M3.9 3.4l1 1M11.1 10.6l1 1M3.9 11.6l1-1M11.1 4.4l1-1" />
      <path d="M11.5 19.5a3.5 3.5 0 0 1 -.3 -7 4.8 4.8 0 0 1 9.1 1.1 3.2 3.2 0 0 1 -.4 5.9Z" />
    </svg>
  );
}

/** Tabler: cloud-rain */
export function IconCloudRain({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M7 18a4.6 4.4 0 0 1 0 -9a5 4.5 0 0 1 11 2h1a3.5 3.5 0 0 1 0 7" />
      <path d="M11 13v2m0 3v2m4 -5v2m0 3v2" />
    </svg>
  );
}

/** Tabler: cloud-snow */
export function IconCloudSnow({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M7 18a4.6 4.4 0 0 1 0 -9a5 4.5 0 0 1 11 2h1a3.5 3.5 0 0 1 0 7" />
      <path d="M11 15v.01m0 3v.01m0 3v.01m4 -4v.01m0 3v.01" />
    </svg>
  );
}

/** Tabler: cloud-fog */
export function IconFog({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M7 16a4.6 4.4 0 0 1 0 -9a5 4.5 0 0 1 11 2h1a3.5 3.5 0 0 1 0 7h-12" />
      <path d="M5 20l14 0" />
    </svg>
  );
}

/** Tabler: cloud-storm */
export function IconThunder({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M7 18a4.6 4.4 0 0 1 0 -9a5 4.5 0 0 1 11 2h1a3.5 3.5 0 0 1 0 7h-1" />
      <path d="M13 14l-2 4l3 0l-2 4" />
    </svg>
  );
}

/* ---- 作物アイコン（Tabler に該当語が無いものは自作） ---- */

/** いちご。Tabler に無いため自作。 */
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

/** トマト。Tabler に無いため自作。 */
export function IconTomato({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M12 21a7.2 7.2 0 0 0 7.2-7.2c0-3.4-3.2-5.7-7.2-5.7s-7.2 2.3-7.2 5.7A7.2 7.2 0 0 0 12 21Z" />
      <path d="M12 8.1V5.2" />
      <path d="M8.2 7.2 12 8.6l3.8-1.4" />
    </svg>
  );
}

/** きくらげなど、傘がひらひらしたキノコ類。Tabler: mushroom */
export function IconMushroom({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M20 11.1c0 -4.474 -3.582 -8.1 -8 -8.1s-8 3.626 -8 8.1a.9 .9 0 0 0 .9 .9h14.2a.9 .9 0 0 0 .9 -.9" />
      <path d="M10 12v7a2 2 0 1 0 4 0v-7" />
    </svg>
  );
}

/** サツマイモ。細長い紡錘形。Tabler に無いため自作。 */
export function IconSweetPotato({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M6.4 17.6c-2.1-2.1-1.2-6 2-9.2s7.1-4.1 9.2-2 1.2 6-2 9.2-7.1 4.1-9.2 2Z" />
      <path d="M18.6 5.4 20.4 3.6M5.4 18.6 3.6 20.4" />
      <path d="M10.2 13.8h.01M13.8 10.2h.01" />
    </svg>
  );
}

/** ジャガイモ・里芋などの「イモ」全般。Tabler に無いため自作。 */
export function IconPotato({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M5.4 14c0-4.1 3-7.4 6.7-7.4 3.6 0 6.5 2.7 6.5 6.6 0 3.4-2.7 6.3-6.3 6.3-3.6 0-6.9-2-6.9-5.5Z" />
      <path d="M10 11.4h.01M14.2 14.4h.01M12.6 9.4h.01" />
    </svg>
  );
}

/** 玉ねぎ。Tabler に無いため自作。 */
export function IconOnion({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M12 21c-3.6 0-6.1-2.5-6.1-5.8 0-3.5 3-6.5 6.1-8.4 3.1 1.9 6.1 4.9 6.1 8.4 0 3.3-2.5 5.8-6.1 5.8Z" />
      <path d="M12 6.8V3.6M12 5.6c1-.8 1.7-1.8 2.1-2.9" />
      <path d="M9.4 9.6c-.9 1.9-1.1 3.8-.7 5.7M14.6 9.6c.9 1.9 1.1 3.8.7 5.7" />
    </svg>
  );
}

/** 育苗中の株。作物名から種類が特定できないときの苗用。Tabler: plant-2 */
export function IconSeedling({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M2 9a10 10 0 1 0 20 0" />
      <path d="M12 19a10 10 0 0 1 10 -10" />
      <path d="M2 9a10 10 0 0 1 10 10" />
      <path d="M12 4a9.7 9.7 0 0 1 2.99 7.5" />
      <path d="M9.01 11.5a9.7 9.7 0 0 1 2.99 -7.5" />
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

/**
 * 天気コードに対応するアイコン。
 * 快晴・晴れは夜だと太陽が出ていておかしいので、is_day で月に差し替える。
 */
export function WeatherIcon({
  code,
  isDay,
  className,
}: IconProps & { code: number; isDay: boolean }) {
  switch (weatherKind(code)) {
    case "clear":
      return isDay ? <IconSun className={className} /> : <IconMoon className={className} />;
    case "partly":
      return isDay ? <IconCloudSun className={className} /> : <IconCloud className={className} />;
    case "cloudy":
      return <IconCloud className={className} />;
    case "fog":
      return <IconFog className={className} />;
    case "snow":
      return <IconCloudSnow className={className} />;
    case "thunder":
      return <IconThunder className={className} />;
    default:
      return <IconCloudRain className={className} />;
  }
}
