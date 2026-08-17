import { DAY_LABELS, isSameDate } from "../lib/week";
import { formatHour, gridLineTier, HOUR_LABEL_STEP } from "../lib/hours";

type GridSkeletonProps = {
  days: Date[];
  today: Date;
};

export function GridSkeleton({ days, today }: GridSkeletonProps) {
  return (
    <>
      <div className="gridCell headerGutter" style={{ gridColumn: 1, gridRow: 1 }} />
      <div className="gridCell headerGutter headerGutter--right" style={{ gridColumn: 9, gridRow: 1 }} />

      {days.map((d, i) => (
        <div
          key={`h-${i}`}
          className={["gridCell", "dayHeader", isSameDate(d, today) ? "isToday" : ""]
            .join(" ")
            .trim()}
          style={{ gridColumn: i + 2, gridRow: 1 }}
        >
          <span className="dayName">{DAY_LABELS[i]}</span>
          <span className="dayNum">{d.getDate()}</span>
        </div>
      ))}

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
          style={{ gridColumn: 9, gridRow: h + 2 }}
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
