/**
 * WMO 天気コード（Open-Meteo の weather_code）の日本語表記。
 *
 * 気象庁の天気種別とは分類の切り方が違うので、そのまま対応はしない。
 * ここでは「見て分かる言葉」に寄せていて、法令や報告書には使わない
 * （農薬使用履歴の天候欄に流用する場合は、別途言い回しを確認すること）。
 */
const WEATHER_LABELS = new Map<number, string>([
  [0, "快晴"],
  [1, "晴れ"],
  [2, "薄曇り"],
  [3, "曇り"],
  [45, "霧"],
  [48, "霧（霧氷）"],
  [51, "弱い霧雨"],
  [53, "霧雨"],
  [55, "強い霧雨"],
  [56, "着氷性の霧雨"],
  [57, "強い着氷性の霧雨"],
  [61, "弱い雨"],
  [63, "雨"],
  [65, "強い雨"],
  [66, "着氷性の雨"],
  [67, "強い着氷性の雨"],
  [71, "弱い雪"],
  [73, "雪"],
  [75, "強い雪"],
  [77, "霧雪"],
  [80, "弱いにわか雨"],
  [81, "にわか雨"],
  [82, "激しいにわか雨"],
  [85, "にわか雪"],
  [86, "強いにわか雪"],
  [95, "雷雨"],
  [96, "雷雨（ひょう）"],
  [99, "激しい雷雨（ひょう）"],
]);

export function weatherLabel(code: number): string {
  return WEATHER_LABELS.get(code) ?? "天気不明";
}

/** アイコンの出し分け。細かい強弱はアイコンでは表さない。 */
export type WeatherKind = "clear" | "partly" | "cloudy" | "fog" | "rain" | "snow" | "thunder";

export function weatherKind(code: number): WeatherKind {
  if (code === 0 || code === 1) return "clear";
  if (code === 2) return "partly";
  if (code === 3) return "cloudy";
  if (code === 45 || code === 48) return "fog";
  if (code >= 95) return "thunder";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  return "rain";
}
