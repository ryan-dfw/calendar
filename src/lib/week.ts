export const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function startOfWeekMonday(d: Date): Date {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = date.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diffToMonday);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function addDays(d: Date, n: number): Date {
  const nd = new Date(d);
  nd.setDate(nd.getDate() + n);
  return nd;
}

export function isSameDate(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isPastDate(d: Date, reference: Date): boolean {
  const dDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const refDay = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate());
  return dDay.getTime() < refDay.getTime();
}

export function toCompactDate(d: Date): string {
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}${mm}${dd}`;
}

export function parseCompactDate(str: string): Date | null {
  if (!/^\d{6}$/.test(str)) return null;
  const yy = Number(str.slice(0, 2));
  const mm = Number(str.slice(2, 4));
  const dd = Number(str.slice(4, 6));
  if (mm < 1 || mm > 12) return null;
  const year = 2000 + yy;
  const date = new Date(year, mm - 1, dd);
  if (date.getFullYear() !== year || date.getMonth() !== mm - 1 || date.getDate() !== dd) {
    return null;
  }
  return date;
}

export function toCompactMonth(d: Date): string {
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yy}${mm}`;
}

export function parseCompactMonth(str: string): Date | null {
  if (!/^\d{4}$/.test(str)) return null;
  const yy = Number(str.slice(0, 2));
  const mm = Number(str.slice(2, 4));
  if (mm < 1 || mm > 12) return null;
  return new Date(2000 + yy, mm - 1, 1);
}

export function toCompactYear(d: Date): string {
  return String(d.getFullYear()).slice(-2);
}

export function parseCompactYear(str: string): Date | null {
  if (!/^\d{2}$/.test(str)) return null;
  const yy = Number(str);
  return new Date(2000 + yy, 0, 1);
}

export type UrlParams = {
  view: "D" | "W" | "M" | "Y";
  date: Date | null;
};

export function parseUrlParams(search: string): UrlParams {
  const raw = search.replace(/^\?/, "");
  const tokens = raw.split("&").filter(Boolean);

  let view: UrlParams["view"] = "W";
  let date: Date | null = null;

  for (const token of tokens) {
    if (token === "d") view = "D";
    else if (token === "m") view = "M";
    else if (token === "y") view = "Y";
    else {
      const parsed = parseCompactDate(token) ?? parseCompactMonth(token) ?? parseCompactYear(token);
      if (parsed) date = parsed;
    }
  }

  return { view, date };
}

export function buildUrlParams(view: "D" | "W" | "M" | "Y", date: Date | null): string {
  const tokens: string[] = [];
  if (view === "D") tokens.push("d");
  else if (view === "M") tokens.push("m");
  else if (view === "Y") tokens.push("y");
  if (date) {
    if (view === "Y") tokens.push(toCompactYear(date));
    else if (view === "M") tokens.push(toCompactMonth(date));
    else tokens.push(toCompactDate(date));
  }
  return tokens.join("&");
}

export function formatWeekRangeCompact(monday: Date): string {
  const sunday = addDays(monday, 6);
  const yy = String(monday.getFullYear()).slice(-2);
  const mm = String(monday.getMonth() + 1).padStart(2, "0");
  const dd1 = String(monday.getDate()).padStart(2, "0");
  const dd2 = String(sunday.getDate()).padStart(2, "0");

  const sameMonth = monday.getMonth() === sunday.getMonth() && monday.getFullYear() === sunday.getFullYear();
  if (sameMonth) {
    return `${yy}${mm}${dd1}-${dd2}`;
  }

  const mm2 = String(sunday.getMonth() + 1).padStart(2, "0");
  return `${yy}${mm}${dd1}-${mm2}${dd2}`;
}

export function formatDayLabel(d: Date, today: Date): string {
  if (isSameDate(d, today)) return "Today";
  const month = d.toLocaleDateString(undefined, { month: "short" });
  if (d.getFullYear() !== today.getFullYear()) {
    return `${d.getFullYear()} ${month} ${d.getDate()}`;
  }
  return `${month} ${d.getDate()}`;
}

export function formatYearLabel(anchor: Date): string {
  return String(anchor.getFullYear());
}

export function formatMonthLabel(anchor: Date, currentYear: number): string {
  const month = anchor.toLocaleDateString(undefined, { month: "long" }).toUpperCase();
  if (anchor.getFullYear() > currentYear) {
    const yy = String(anchor.getFullYear()).slice(-2);
    return `${month} '${yy}`;
  }
  return month;
}

export function formatWeekRange(monday: Date): string {
  const sunday = addDays(monday, 6);
  const month = (d: Date) => d.toLocaleDateString(undefined, { month: "short" });

  const sameMonth = monday.getMonth() === sunday.getMonth();
  const sameYear = monday.getFullYear() === sunday.getFullYear();

  if (sameMonth) {
    return `${sunday.getFullYear()} ${month(monday)} ${monday.getDate()}–${sunday.getDate()}`;
  }
  if (sameYear) {
    return `${sunday.getFullYear()} ${month(monday)} ${monday.getDate()} – ${month(sunday)} ${sunday.getDate()}`;
  }
  return `${monday.getFullYear()} ${month(monday)} ${monday.getDate()} – ${sunday.getFullYear()} ${month(sunday)} ${sunday.getDate()}`;
}
