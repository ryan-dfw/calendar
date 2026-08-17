import { addDays, startOfWeekMonday } from "./week";

export function getMonthGridDays(anchor: Date): Date[] {
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);

  const gridStart = startOfWeekMonday(firstOfMonth);
  let gridEnd = addDays(startOfWeekMonday(lastOfMonth), 6);

  const MIN_WEEKS = 6;
  const totalDays = Math.round((gridEnd.getTime() - gridStart.getTime()) / 86_400_000) + 1;
  const naturalWeeks = totalDays / 7;
  if (naturalWeeks < MIN_WEEKS) {
    gridEnd = addDays(gridEnd, (MIN_WEEKS - naturalWeeks) * 7);
  }

  const days: Date[] = [];
  let cursor = gridStart;
  while (cursor.getTime() <= gridEnd.getTime()) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return days;
}
