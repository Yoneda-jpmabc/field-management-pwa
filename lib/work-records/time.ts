export const TIME_STEP_MINUTES = 10;

/** HH:mm を 10 分単位に丸める。空文字や不正値はそのまま返す。 */
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
