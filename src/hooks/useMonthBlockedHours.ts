import { useEffect, useRef, useState } from "react";
import { fetchRangeBlockedHours } from "../lib/googleCalendar";

export function useMonthBlockedHours(days: Date[]) {
  const [blocked, setBlocked] = useState<boolean[][]>(() =>
    days.map(() => new Array(24).fill(false)),
  );
  const [loading, setLoading] = useState(true);
  const requestId = useRef(0);
  const rangeKey = days.length ? `${days[0].getTime()}-${days[days.length - 1].getTime()}` : "";

  useEffect(() => {
    const id = ++requestId.current;
    setLoading(true);
    fetchRangeBlockedHours(days)
      .then((grid) => {
        if (requestId.current === id) setBlocked(grid);
      })
      .catch((err) => {
        console.error("raincal: failed to load this month's calendar", err);
      })
      .finally(() => {
        if (requestId.current === id) setLoading(false);
      });
  }, [rangeKey]);

  return { blocked, loading };
}
