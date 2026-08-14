import { useEffect, useRef, useState } from "react";
import { fetchWeekBlockedHours } from "../lib/googleCalendar";

function emptyWeek(): boolean[][] {
  return Array.from({ length: 7 }, () => new Array(24).fill(false));
}

export function useWeekBlockedHours(monday: Date) {
  const [blocked, setBlocked] = useState<boolean[][]>(emptyWeek);
  const [loading, setLoading] = useState(true);
  const mondayTime = monday.getTime();
  const requestId = useRef(0);

  useEffect(() => {
    const id = ++requestId.current;
    setLoading(true);
    fetchWeekBlockedHours(new Date(mondayTime))
      .then((week) => {
        if (requestId.current === id) setBlocked(week);
      })
      .catch((err) => {
        console.error("raincal: failed to load this week's calendar", err);
      })
      .finally(() => {
        if (requestId.current === id) setLoading(false);
      });
  }, [mondayTime]);

  return { blocked, loading };
}
