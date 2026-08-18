import { DAY_LABELS, isSameDate } from "../lib/week";
import { formatHour, gridLineTier, HOUR_LABEL_STEP } from "../lib/hours";

type GridSkeletonProps = {
  days: Date[];
  today: Date;
  onSelectDay?: (d: Date) => void;
  blocked?: boolean[][];
};

export function GridSkeleton({ days, today, onSelectDay, blocked }: GridSkeletonProps) {
  const rightCol = days.length + 2;
  const clickable = days.length > 1 && !!onSelectDay;

  return (
    <>
      <div className="gridCell headerGutter" style={{ gridColumn: 1, gridRow: 1 }} />
      <div
        className="gridCell headerGutter headerGutter--right"
        style={{ gridColumn: rightCol, gridRow: 1 }}
      />

      {days.map((d, i) => {
        const dayBlocked = blocked?.[i] ?? new Array(24).fill(false);
        const hasAnyBooking = dayBlocked.some(Boolean);
        const isFullyBooked = dayBlocked.every(Boolean);
        const isPartial = hasAnyBooking && !isFullyBooked;
        return (
          <div
            key={`h-${i}`}
            className={[
              "gridCell",
              "dayHeader",
              isSameDate(d, today) ? "isToday" : "",
              clickable ? "isClickable" : "",
            ]
              .join(" ")
              .trim()}
            style={{ gridColumn: i + 2, gridRow: 1 }}
            role={clickable ? "button" : undefined}
            tabIndex={clickable ? 0 : undefined}
            aria-label={clickable ? `Go to ${d.toDateString()} in day view` : undefined}
            onClick={clickable ? () => onSelectDay!(d) : undefined}
            onKeyDown={
              clickable
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelectDay!(d);
                    }
                  }
                : undefined
            }
          >
            {days.length > 1 ? (
              <>
                <span className="dayName">
                  {DAY_LABELS[d.getDay() === 0 ? 6 : d.getDay() - 1]}
                </span>
                <span
                  className={[
                    "dayNum",
                    isPartial ? "isPartial" : "",
                    isFullyBooked ? "isFull" : "",
                  ]
                    .join(" ")
                    .trim()}
                >
                  {d.getDate()}
                </span>
              </>
            ) : null}
          </div>
        );
      })}

      {Array.from({ length: 24 }, (_, h) => (
        <div
          key={`hl-${h}`}
          className={["gridCell", "hourLabel", h % HOUR_LABEL_STEP !== 0 ? "isMinor" : ""]
            .join(" ")
            .trim()}
          style={{ gridColumn: 1, gridRow: h + 2 }}
        >
          {formatHour(h)}
        </div>
      ))}

      {Array.from({ length: 24 }, (_, h) => (
        <div
          key={`hlr-${h}`}
          className={[
            "gridCell",
            "hourLabel",
            "hourLabel--right",
            h % HOUR_LABEL_STEP !== 0 ? "isMinor" : "",
          ]
            .join(" ")
            .trim()}
          style={{ gridColumn: rightCol, gridRow: h + 2 }}
        >
          {formatHour(h)}
        </div>
      ))}

      {days.map((d, dayIdx) => {
        const today_ = isSameDate(d, today);
        return Array.from({ length: 24 }, (_, h) => (
          <div
            key={`c-${dayIdx}-${h}`}
            className={["gridCell", "hourCell", today_ ? "isToday" : "", gridLineTier(h)]
              .join(" ")
              .trim()}
            style={{ gridColumn: dayIdx + 2, gridRow: h + 2 }}
          />
        ));
      })}
    </>
  );
}
