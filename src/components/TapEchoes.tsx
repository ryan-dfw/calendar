import { formatHour } from "../lib/hours";

type TapEchoesProps = {
  tapped: Set<string>;
  onToggle: (key: string) => void;
};

export function TapEchoes({ tapped, onToggle }: TapEchoesProps) {
  return (
    <>
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
            onClick={() => onToggle(key)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onToggle(key);
              }
            }}
          >
            {formatHour(hour)}
          </div>
        );
      })}
    </>
  );
}
