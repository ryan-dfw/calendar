import { formatHour } from "../lib/hours";

const THURSDAY_IDX = 3;
const MARK_HOURS = [6, 12, 18];

type MidWeekMarksProps = {
  blocked: boolean[][];
  activeEchoes: Set<string>;
};

export function MidWeekMarks({ blocked, activeEchoes }: MidWeekMarksProps) {
  return (
    <>
      {MARK_HOURS.filter(
        (h) => !(blocked[THURSDAY_IDX]?.[h] ?? false) && !activeEchoes.has(`${THURSDAY_IDX}-${h}`),
      ).map((h) => (
        <div
          key={`mark-${h}`}
          className="midWeekMark"
          style={{ gridColumn: THURSDAY_IDX + 2, gridRow: h + 2 }}
          aria-hidden="true"
        >
          {formatHour(h)}
        </div>
      ))}
    </>
  );
}
