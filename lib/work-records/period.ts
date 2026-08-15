/**
 * 集計期間の計算。
 *
 * 日付は "YYYY-MM-DD" 文字列で扱い、計算は UTC の Date で行う。
 * ローカルタイムの Date を使うとサーバー(UTC)とブラウザ(JST)で日付が1日ずれるため、
 * ここでは時差の無い UTC 上で加減算し、文字列に戻す。
 */

export const PERIOD_UNITS = ["day", "week", "month", "year"] as const;
export type PeriodUnit = (typeof PERIOD_UNITS)[number];

export const PERIOD_UNIT_LABELS: Record<PeriodUnit, string> = {
  day: "日",
  week: "週",
  month: "月",
  year: "年",
};

export type PeriodRange = {
  unit: PeriodUnit;
  /** 期間の基準日。前後移動もこの日を動かす。 */
  anchor: string;
  from: string;
  to: string;
  label: string;
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isPeriodUnit(value: unknown): value is PeriodUnit {
  return PERIOD_UNITS.includes(value as PeriodUnit);
}

export function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && DATE_PATTERN.test(value);
}

function toUtcDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function toIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(iso: string, days: number): string {
  const date = toUtcDate(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return toIso(date);
}

/** 月曜始まりの週の初日を返す。 */
function startOfWeek(iso: string): string {
  const date = toUtcDate(iso);
  // getUTCDay(): 0=日曜。月曜を先頭にするため日曜だけ 6 日戻す。
  const offset = (date.getUTCDay() + 6) % 7;
  return addDays(iso, -offset);
}

/** サーバーの TZ に左右されないよう、Asia/Tokyo の今日を明示的に組み立てる。 */
export function todayInTokyo(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function resolvePeriod(unit: PeriodUnit, anchor: string): PeriodRange {
  const date = toUtcDate(anchor);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();

  switch (unit) {
    case "day":
      return {
        unit,
        anchor,
        from: anchor,
        to: anchor,
        label: formatDayLabel(anchor),
      };
    case "week": {
      const from = startOfWeek(anchor);
      const to = addDays(from, 6);
      return {
        unit,
        anchor,
        from,
        to,
        label: `${formatDayLabel(from)} 〜 ${formatDayLabel(to)}`,
      };
    }
    case "month": {
      const from = toIso(new Date(Date.UTC(year, month, 1)));
      const to = toIso(new Date(Date.UTC(year, month + 1, 0)));
      return { unit, anchor, from, to, label: `${year}年${month + 1}月` };
    }
    case "year": {
      const from = toIso(new Date(Date.UTC(year, 0, 1)));
      const to = toIso(new Date(Date.UTC(year, 11, 31)));
      return { unit, anchor, from, to, label: `${year}年` };
    }
  }
}

/** 期間を delta 個ぶん前後に動かした新しい基準日を返す。 */
export function shiftAnchor(
  unit: PeriodUnit,
  anchor: string,
  delta: number,
): string {
  const date = toUtcDate(anchor);

  switch (unit) {
    case "day":
      return addDays(anchor, delta);
    case "week":
      return addDays(anchor, delta * 7);
    case "month": {
      // 月末日を保持したまま月を動かすと 1/31 → 3/3 のように溢れるので、月初に寄せる。
      const shifted = new Date(
        Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + delta, 1),
      );
      return toIso(shifted);
    }
    case "year":
      return toIso(new Date(Date.UTC(date.getUTCFullYear() + delta, 0, 1)));
  }
}

/** from から to まで（両端を含む）の日付を順に並べて返す。週カレンダーの列挙に使う。 */
export function enumerateDays(from: string, to: string): string[] {
  const days: string[] = [];
  for (let cursor = from; cursor <= to; cursor = addDays(cursor, 1)) {
    days.push(cursor);
    // 想定外の入力（from > to など）で無限ループさせない。
    if (days.length > 366) break;
  }
  return days;
}

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

export function formatWeekday(iso: string): string {
  return WEEKDAY_LABELS[toUtcDate(iso).getUTCDay()];
}

export function formatDayLabel(iso: string): string {
  const date = toUtcDate(iso);
  const weekday = WEEKDAY_LABELS[date.getUTCDay()];
  return `${date.getUTCMonth() + 1}/${date.getUTCDate()}(${weekday})`;
}

/** 分を「7.5時間」形式に整える。集計は分で持ち、表示だけ時間に直す。 */
export function formatHours(minutes: number): string {
  if (minutes === 0) return "0時間";
  const hours = minutes / 60;
  return `${Number(hours.toFixed(1))}時間`;
}
