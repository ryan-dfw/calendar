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
