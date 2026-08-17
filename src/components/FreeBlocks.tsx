import { isPastDate } from "../lib/week";
import { toBusyRuns } from "../lib/busyRuns";
import { formatHour } from "../lib/hours";

type FreeBlocksProps = {
  days: Date[];
  today: Date;
  blocked: boolean[][];
  onSelectHour: (key: string) => void;
};

export function FreeBlocks({ days, today, blocked, onSelectHour }: FreeBlocksProps) {
  const isDayView = days.length === 1;

  return (
    <>
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
                    onSelectHour(`${dayIdx}-${run.start + offset}`);
                  }
            }
            onKeyDown={
              isPast
                ? undefined
                : (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelectHour(`${dayIdx}-${run.start}`);
                    }
                  }
            }
          >
            {isDayView && run.length === 24 ? (
              <span className="pseudoBlockLabel">
                <span className="pseudoBlockLabelText">Free</span>
              </span>
            ) : null}
          </div>
        ));
      })}
    </>
  );
}
