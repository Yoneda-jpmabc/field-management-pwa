export const TIME_STEP_MINUTES = 30;

/** HH:mm を 30 分単位に丸める。空文字や不正値はそのまま返す。 */
export function snapTimeToStep(
  value: string,
  stepMinutes: number = TIME_STEP_MINUTES,
): string {
  const matched = /^(\d{1,2}):(\d{2})/.exec(value);
  if (!matched) {
    return value;
  }

  const hours = Number(matched[1]);
  const minutes = Number(matched[2]);
  if (hours > 23 || minutes > 59) {
    return value;
  }

  const total = hours * 60 + minutes;
  const snapped = Math.min(
    Math.round(total / stepMinutes) * stepMinutes,
    23 * 60 + 59 - ((23 * 60 + 59) % stepMinutes),
  );

  const snappedHours = Math.floor(snapped / 60);
  const snappedMinutes = snapped % 60;
  return `${String(snappedHours).padStart(2, "0")}:${String(snappedMinutes).padStart(2, "0")}`;
}

/**
 * 開始〜終了が 12:00〜13:00 をまるごと含むか（＝昼休憩をまたぐ入力か）。
 * DB 側の work_record_durations ビューの判定条件と合わせている。
 */
export function spansLunchBreak(startTime: string, endTime: string): boolean {
  return (
    startTime !== "" &&
    endTime !== "" &&
    startTime <= "12:00" &&
    endTime >= "13:00"
  );
}

/** "HH:MM" を 0 時からの経過分に変換する。 */
export function timeToMinutes(value: string): number {
  const matched = /^(\d{1,2}):(\d{2})/.exec(value);
  if (!matched) return 0;
  return Number(matched[1]) * 60 + Number(matched[2]);
}

/**
 * 所要時間（分）。開始・終了のどちらかが未入力、または終了が開始以前なら
 * 集計対象外（null）。work_record_durations ビューの計算式と揃えている。
 */
export function recordDurationMinutes(
  startTime: string,
  endTime: string,
  worksThroughLunch: boolean,
): number | null {
  if (!startTime || !endTime || endTime <= startTime) return null;
  const duration = timeToMinutes(endTime) - timeToMinutes(startTime);
  return spansLunchBreak(startTime, endTime) && !worksThroughLunch
    ? duration - 60
    : duration;
}
