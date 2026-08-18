import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { DAY_LABELS, isPastDate, isSameDate, startOfWeekMonday } from "../lib/week";
import { getMonthGridDays } from "../lib/month";
import { toBusyRuns } from "../lib/busyRuns";
import { useMonthBlockedHours } from "../hooks/useMonthBlockedHours";

type MonthViewProps = {
  monthAnchor: Date;
  today: Date;
  onSelectWeek: (date: Date) => void;
};

export function MonthView({ monthAnchor, today, onSelectWeek }: MonthViewProps) {
  const days = useMemo(
    () => getMonthGridDays(monthAnchor),
    [monthAnchor.getFullYear(), monthAnchor.getMonth()],
  );
  const { blocked, loading } = useMonthBlockedHours(days);
  const [contentVisible, setContentVisible] = useState(!loading);
  useEffect(() => {
    if (loading) {
      setContentVisible(false);
    } else {
      setContentVisible(true);
    }
  }, [loading]);
  const weekCount = days.length / 7;
  const anchorMonth = monthAnchor.getMonth();
  const todayIdx = days.findIndex((d) => isSameDate(d, today));
  const currentWeekRow = todayIdx === -1 ? -1 : Math.floor(todayIdx / 7);
  const curMonday = useMemo(() => startOfWeekMonday(today), [today]);

  const [shudder, setShudder] = useState<{ key: string; count: number } | null>(null);
  const triggerShudder = (key: string) => {
    setShudder((prev) => ({ key, count: prev && prev.key === key ? prev.count + 1 : 1 }));
  };

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  const nowFraction = (now.getHours() + now.getMinutes() / 60) / 24;

  return (
    <div
      className="monthWrap"
      style={
        {
          gridTemplateRows: `auto repeat(${weekCount}, 1fr)`,
          "--content-visible": contentVisible ? 1 : 0,
        } as CSSProperties
      }
    >
      {DAY_LABELS.map((label, i) => (
        <div key={`mh-${i}`} className="monthHeaderCell" style={{ gridColumn: i + 1, gridRow: 1 }}>
          {label}
        </div>
      ))}

      {days.map((d, i) => {
        const dayBlocked = blocked[i] ?? new Array(24).fill(false);
        const runs = toBusyRuns(dayBlocked);
        const inMonth = d.getMonth() === anchorMonth;
        const isPast = isPastDate(d, today);
        const hasAnyBooking = dayBlocked.some(Boolean);
        const isFullyBooked = dayBlocked.every(Boolean);
        const isPartial = hasAnyBooking && !isFullyBooked;
        const col = (i % 7) + 1;
        const rowIdx = Math.floor(i / 7);
        const row = rowIdx + 2;
        const isCurrentWeek = rowIdx === currentWeekRow;
        const cellKey = `mw-${i}`;
        const isShuddering = shudder?.key === cellKey;
        const shudderCount = isShuddering ? shudder!.count : 0;
        const isPastWeek = startOfWeekMonday(d).getTime() < curMonday.getTime();
        const handleTap = () => {
          if (isPastWeek) {
            triggerShudder(cellKey);
          } else {
            onSelectWeek(d);
          }
        };
        return (
          <div
            key={isShuddering ? `md-${i}-${shudderCount}` : `md-${i}`}
            className={[
              "monthDayCell",
              inMonth ? "" : "isOutside",
              inMonth && isPast ? "isPastDay" : "",
              isSameDate(d, today) ? "isToday" : "",
              isCurrentWeek ? "isCurrentWeek" : "",
              col === 1 ? "isWeekStart" : "",
              col === 7 ? "isWeekEnd" : "",
              isShuddering ? "isShuddering" : "",
            ]
              .join(" ")
              .trim()}
            style={
              {
                gridColumn: col,
                gridRow: row,
                "--shudder-power": shudderCount || 1,
              } as CSSProperties
            }
            onClick={handleTap}
            onAnimationEnd={() => setShudder((cur) => (cur?.key === cellKey ? null : cur))}
          >
            <span
              className={[
                "monthDayNum",
                isPartial ? "isPartial" : "",
                isFullyBooked ? "isFull" : "",
              ]
                .join(" ")
                .trim()}
            >
              {d.getDate()}
            </span>
            <div className="monthFillTrack">
              {isSameDate(d, today) ? (
                <div className="monthNowLine" style={{ top: `${nowFraction * 100}%` }} />
              ) : null}
              {runs.map((run, runIdx) => (
                <div
                  key={`fill-${i}-${runIdx}`}
                  className={[
                    "blockRun",
                    isPast ? "isPast" : "",
                    isFullyBooked ? "isFull" : "",
                  ]
                    .join(" ")
                    .trim()}
                  style={{
                    position: "absolute",
                    left: "2%",
                    right: 0,
                    top: `${(run.start / 24) * 100}%`,
                    height: `${(run.length / 24) * 100}%`,
                    transitionDelay: `${(col - 1) * 40}ms`,
                  }}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
