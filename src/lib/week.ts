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
