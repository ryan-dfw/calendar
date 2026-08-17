import { isPastDate } from "../lib/week";
import { toBusyRuns } from "../lib/busyRuns";

type ShimmerLayerProps = {
  days: Date[];
  today: Date;
  blocked: boolean[][];
};

export function ShimmerLayer({ days, today, blocked }: ShimmerLayerProps) {
  const dayCount = days.length;

  return (
    <>
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
                  x={dayIdx / dayCount}
                  y={run.start / 24}
                  width={1 / dayCount}
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
        style={{ gridColumn: `2 / ${dayCount + 2}`, gridRow: "2 / -1" }}
        aria-hidden="true"
      />
    </>
  );
}
