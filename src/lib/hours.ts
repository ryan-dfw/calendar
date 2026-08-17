export const HOUR_LABEL_STEP = 3;

export function gridLineTier(h: number): "" | "isMidLine" | "isMinor" {
  if (h % 6 === 0) return "";
  if (h % 3 === 0) return "isMidLine";
  return "isMinor";
}

export function formatHour(h: number): string {
  const hh = h % 24;
  const period = hh < 12 ? "a" : "p";
  const hour12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${hour12}${period}`;
}
