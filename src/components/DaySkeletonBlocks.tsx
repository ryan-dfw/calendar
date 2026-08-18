import type { CSSProperties } from "react";

type DaySkeletonBlocksProps = {
  days: Date[];
  visible: boolean;
};

export function DaySkeletonBlocks({ days, visible }: DaySkeletonBlocksProps) {
  return (
    <>
      {days.map((_, dayIdx) => (
        <div
          key={`sk-${dayIdx}`}
          className={["blockRun", "isSkeleton", visible ? "isVisible" : ""].join(" ").trim()}
          style={
            {
              gridColumn: `${dayIdx + 2} / span 1`,
              gridRow: "2 / span 24",
              transitionDelay: `${dayIdx * 40}ms`,
            } as CSSProperties
          }
        />
      ))}
    </>
  );
}
