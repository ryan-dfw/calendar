import type { CSSProperties } from "react";
import { formatHour } from "../lib/hours";
import { mergeDayRuns } from "../lib/mergeDayRuns";

type ShudderState = { key: string; count: number } | null;

type BusyBlocksProps = {
  days: Date[];
  today: Date;
  blocked: boolean[][];
  shudder: ShudderState;
  triggerShudder: (key: string) => void;
  onShudderEnd: (key: string) => void;
};

export function BusyBlocks({
  days,
  today,
  blocked,
  shudder,
  triggerShudder,
  onShudderEnd,
}: BusyBlocksProps) {
  const merged = mergeDayRuns(days, blocked, today);

  return (
    <>
      {merged.map((block, i) => {
        const key = `b-${block.dayIdx}-${i}`;
        const isTarget = shudder?.key === key;
        const count = isTarget ? shudder!.count : 0;
        const startIsRedundantMidnight = block.length > 1 && formatHour(block.start) === "12a";
        const endIsRedundantMidnight = formatHour(block.start + block.length) === "12a";
        return (
          <div
            key={isTarget ? `${key}-${count}` : key}
            className={["blockRun", block.isPast ? "isPast" : "", isTarget ? "isShuddering" : ""]
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
            onAnimationEnd={() => onShudderEnd(key)}
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
      })}
    </>
  );
}
