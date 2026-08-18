import { useMemo, useState, type CSSProperties } from "react";
import { addDays, isPastDate, isSameDate } from "../lib/week";
import { getMonthGridDays } from "../lib/month";
import { useMonthBlockedHours } from "../hooks/useMonthBlockedHours";

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

type YearViewProps = {
  yearAnchor: Date;
  today: Date;
  onSelectMonth: (date: Date) => void;
};

export function YearView({ yearAnchor, today, onSelectMonth }: YearViewProps) {
  const year = yearAnchor.getFullYear();

  const yearDays = useMemo(() => {
    const start = new Date(year, 0, 1);
    const days: Date[] = [];
    let cursor = start;
    while (cursor.getFullYear() === year) {
      days.push(cursor);
      cursor = addDays(cursor, 1);
    }
    return days;
  }, [year]);

  const { blocked, loading, resolvedThrough } = useMonthBlockedHours(yearDays);
  const dayIndexByKey = useMemo(() => {
    const map = new Map<string, number>();
    yearDays.forEach((d, i) => {
      map.set(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`, i);
    });
    return map;
  }, [yearDays]);
  const blockedByKey = useMemo(() => {
    const map = new Map<string, boolean[]>();
    yearDays.forEach((d, i) => {
      map.set(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`, blocked[i] ?? new Array(24).fill(false));
    });
    return map;
  }, [yearDays, blocked]);

  const [shudder, setShudder] = useState<{ key: string; count: number } | null>(null);
  const triggerShudder = (key: string) => {
    setShudder((prev) => ({ key, count: prev && prev.key === key ? prev.count + 1 : 1 }));
  };

  const curYearMonth = today.getFullYear() * 12 + today.getMonth();
  const nowFraction = (today.getHours() + today.getMinutes() / 60) / 24;

  return (
    <div className="yearWrap">
      {MONTH_LABELS.map((label, m) => {
        const monthAnchor = new Date(year, m, 1);
        const days = getMonthGridDays(monthAnchor);
        const isCurrentMonth = year === today.getFullYear() && m === today.getMonth();
        const thisMonthValue = year * 12 + m;
        const isPastMonth = thisMonthValue < curYearMonth;
        const cellKey = `ym-${year}-${m}`;
        const isShuddering = shudder?.key === cellKey;
        const shudderCount = isShuddering ? shudder!.count : 0;
        const handleTap = () => {
          if (isPastMonth) triggerShudder(cellKey);
          else onSelectMonth(monthAnchor);
        };
        return (
          <div
            key={isShuddering ? `${cellKey}-${shudderCount}` : cellKey}
            className={[
              "yearMonth",
              isCurrentMonth ? "isCurrentMonth" : "",
              !isPastMonth ? "isBrightMonth" : "",
              isShuddering ? "isShuddering" : "",
            ]
              .join(" ")
              .trim()}
            style={{ "--shudder-power": shudderCount || 1 } as CSSProperties}
            role="button"
            tabIndex={0}
            onClick={handleTap}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleTap();
              }
            }}
            onAnimationEnd={() => setShudder((cur) => (cur?.key === cellKey ? null : cur))}
          >
            <div
              className={[
                "yearMonthLabel",
                !isCurrentMonth && !isPastMonth ? "isUpcoming" : "",
              ]
                .join(" ")
                .trim()}
            >
              {label}
            </div>
            <div className={["yearMonthGrid", !isPastMonth ? "isBrightGrid" : ""].join(" ").trim()}>
              {days.map((d, i) => {
                const inMonth = d.getMonth() === m;
                const isPastDay = inMonth && (isPastMonth || isPastDate(d, today));
                const dayBlocked = inMonth
                  ? blockedByKey.get(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`) ??
                    new Array(24).fill(false)
                  : new Array(24).fill(false);

                const q1 = dayBlocked.slice(0, 6).some(Boolean);
                const q2 = dayBlocked.slice(6, 12).some(Boolean);
                const q3 = dayBlocked.slice(12, 18).some(Boolean);
                const q4 = dayBlocked.slice(18, 24).some(Boolean);
                const hasAnyBooking = q1 || q2 || q3 || q4;
                const isEmpty = inMonth && !isPastDay && !hasAnyBooking;
                const isFullyBooked = inMonth && !isPastDay && dayBlocked.every(Boolean);
                const yearIdx = inMonth
                  ? dayIndexByKey.get(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`)
                  : undefined;
                const isDataReady =
                  isPastDay || !loading || (yearIdx !== undefined && yearIdx <= resolvedThrough);

                return (
                  <div
                    key={i}
                    className={[
                      "yearDayCell",
                      inMonth ? "" : "isOutside",
                      isPastDay ? "isPastDay" : "",
                      isSameDate(d, today) ? "isToday" : "",
                    ]
                      .join(" ")
                      .trim()}
                  >
                    <span className={["yearDayNum", isEmpty ? "isEmptyNum" : ""].join(" ").trim()}>
                      {inMonth ? d.getDate() : ""}
                    </span>
                    {inMonth ? (
                      <span
                        className={[
                          "yearDayDot",
                          isPastDay ? "isPast" : "",
                          isEmpty ? "isEmpty" : "",
                          isFullyBooked ? "isFull" : "",
                        ]
                          .join(" ")
                          .trim()}
                        style={
                          {
                            ...(isPastDay || isEmpty || isFullyBooked
                              ? {}
                              : {
                                  "--q1": q1 ? 1 : 0,
                                  "--q2": q2 ? 1 : 0,
                                  "--q3": q3 ? 1 : 0,
                                  "--q4": q4 ? 1 : 0,
                                }),
                            opacity: isDataReady ? 1 : 0,
                            transition: isDataReady ? "opacity 0.4s ease" : "opacity 0s",
                          } as CSSProperties
                        }
                      >
                        {isSameDate(d, today) ? (
                          <span className="yearNowLine" style={{ top: `${nowFraction * 100}%` }} />
                        ) : null}
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
