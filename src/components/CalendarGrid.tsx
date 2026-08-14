import { useState, type CSSProperties } from "react";
import { DAY_LABELS, addDays, isPastDate, isSameDate } from "../lib/week";
import { toBusyRuns } from "../lib/busyRuns";
import { useWeekBlockedHours } from "../hooks/useWeekBlockedHours";

type CalendarGridProps = {
  monday: Date;
  today: Date;
};

const HOUR_LABEL_STEP = 3;

function formatHour(h: number): string {
  const hh = h % 24;
  const period = hh < 12 ? "a" : "p";
  const hour12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${hour12}${period}`;
}

export function CalendarGrid({ monday, today }: CalendarGridProps) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const { blocked } = useWeekBlockedHours(monday);

  const [tapped, setTapped] = useState<Set<string>>(new Set());

  const toggleTapped = (key: string) => {
    setTapped((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const [shudder, setShudder] = useState<{ key: string; count: number } | null>(null);
  const triggerShudder = (key: string) => {
    setShudder((prev) => ({ key, count: prev && prev.key === key ? prev.count + 1 : 1 }));
  };

  return (
    <div className="calendarWrap">
      <div className="gridCell headerGutter" style={{ gridColumn: 1, gridRow: 1 }} />

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

      {days.map((d, dayIdx) => {
        const today_ = isSameDate(d, today);
        return Array.from({ length: 24 }, (_, h) => (
          <div
            key={`c-${dayIdx}-${h}`}
            className={["gridCell", "hourCell", today_ ? "isToday" : ""].join(" ").trim()}
            style={{ gridColumn: dayIdx + 2, gridRow: h + 2 }}
          />
        ));
      })}

      {(() => {
        const dayRuns = days.map((_, dayIdx) => toBusyRuns(blocked[dayIdx] ?? new Array(24).fill(false)));
        const dayIsPast = days.map((d) => isPastDate(d, today));
        const claimed = dayRuns.map((runs) => new Array(runs.length).fill(false));
        const merged: { dayIdx: number; start: number; length: number; span: number; isPast: boolean }[] = [];

        for (let dayIdx = 0; dayIdx < days.length; dayIdx++) {
          dayRuns[dayIdx].forEach((run, runIdx) => {
            if (claimed[dayIdx][runIdx]) return;
            let span = 1;
            while (dayIdx + span < days.length && dayIsPast[dayIdx + span] === dayIsPast[dayIdx]) {
              const nextIdx = dayRuns[dayIdx + span].findIndex(
                (r, i) => !claimed[dayIdx + span][i] && r.start === run.start && r.length === run.length,
              );
              if (nextIdx === -1) break;
              claimed[dayIdx + span][nextIdx] = true;
              span++;
            }
            claimed[dayIdx][runIdx] = true;
            merged.push({ dayIdx, start: run.start, length: run.length, span, isPast: dayIsPast[dayIdx] });
          });
        }

        return merged.map((block, i) => {
          const key = `b-${block.dayIdx}-${i}`;
          const isTarget = shudder?.key === key;
          const count = isTarget ? shudder!.count : 0;
          const startIsRedundantMidnight = block.length > 1 && formatHour(block.start) === "12a";
          const endIsRedundantMidnight = formatHour(block.start + block.length) === "12a";
          return (
            <div
              key={isTarget ? `${key}-${count}` : key}
              className={[
                "blockRun",
                block.isPast ? "isPast" : "",
                isTarget ? "isShuddering" : "",
              ]
                .join(" ")
                .trim()}
              style={
                {
                  gridColumn: `${block.dayIdx + 2} / span ${block.span}`,
                  gridRow: `${block.start + 2} / span ${block.length}`,
                  "--shudder-power": count || 1,
                } as CSSProperties
              }
              onClick={() => triggerShudder(key)}
              onAnimationEnd={() => setShudder((cur) => (cur?.key === key ? null : cur))}
            >
              <span
                className={[
                  "blockLabel",
                  block.length === 1 ? "blockLabel--center" : "blockLabel--start",
                  startIsRedundantMidnight ? "labelHidden" : "",
                ]
                  .join(" ")
                  .trim()}
              >
                {formatHour(block.start)}
              </span>
              {block.length > 1 ? (
                <span
                  className={["blockLabel", "blockLabel--end", endIsRedundantMidnight ? "labelHidden" : ""]
                    .join(" ")
                    .trim()}
                >
                  {formatHour(block.start + block.length)}
                </span>
              ) : null}
            </div>
          );
        });
      })()}

      {days.map((d, dayIdx) => {
        const dayBlocked = blocked[dayIdx] ?? new Array(24).fill(false);
        const freeRuns = toBusyRuns(dayBlocked.map((b) => !b));
        const isPast = isPastDate(d, today);
        return freeRuns.map((run, i) => (
          <div
            key={`p-${dayIdx}-${i}`}
            className={["pseudoBlock", isPast ? "isPast" : ""].join(" ").trim()}
            style={{
              gridColumn: dayIdx + 2,
              gridRow: `${run.start + 2} / span ${run.length}`,
            }}
            role={isPast ? undefined : "button"}
            tabIndex={isPast ? undefined : 0}
            aria-label={
              isPast
                ? undefined
                : `${formatHour(run.start)} to ${formatHour(run.start + run.length)}, open — tap an hour to select it`
            }
            onClick={
              isPast
                ? undefined
                : (e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const relativeY = e.clientY - rect.top;
                    const hourHeight = rect.height / run.length;
                    const offset = Math.min(
                      run.length - 1,
                      Math.max(0, Math.floor(relativeY / hourHeight)),
                    );
                    toggleTapped(`${dayIdx}-${run.start + offset}`);
                  }
            }
            onKeyDown={
              isPast
                ? undefined
                : (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleTapped(`${dayIdx}-${run.start}`);
                    }
                  }
            }
          />
        ));
      })}

      {Array.from(tapped).map((key) => {
        const [dayIdxStr, hourStr] = key.split("-");
        const dayIdx = Number(dayIdxStr);
        const hour = Number(hourStr);
        return (
          <div
            key={`tap-${key}`}
            className="tapEcho"
            style={{ gridColumn: dayIdx + 2, gridRow: hour + 2 }}
            role="button"
            tabIndex={0}
            aria-label={`${formatHour(hour)} selected — tap to remove`}
            onClick={() => toggleTapped(key)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggleTapped(key);
              }
            }}
          >
            {formatHour(hour)}
          </div>
        );
      })}

      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <defs>
          <mask id="freeHoursMask" maskContentUnits="objectBoundingBox">
            {days.map((d, dayIdx) => {
              if (isPastDate(d, today)) return null;
              const dayBlocked = blocked[dayIdx] ?? new Array(24).fill(false);
              const freeRuns = toBusyRuns(dayBlocked.map((b) => !b));
              return freeRuns.map((run, i) => (
                <rect
                  key={`mask-${dayIdx}-${i}`}
                  x={dayIdx / 7}
                  y={run.start / 24}
                  width={1 / 7}
                  height={run.length / 24}
                  fill="white"
                />
              ));
            })}
          </mask>
        </defs>
      </svg>
      <div
        className="shimmerOverlay"
        style={{ gridColumn: "2 / -1", gridRow: "2 / -1" }}
        aria-hidden="true"
      />
    </div>
  );
}
