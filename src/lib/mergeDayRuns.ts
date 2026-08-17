import { isPastDate } from "./week";
import { toBusyRuns } from "./busyRuns";

export type MergedBlock = {
  dayIdx: number;
  start: number;
  length: number;
  span: number;
  isPast: boolean;
};

export function mergeDayRuns(days: Date[], blocked: boolean[][], today: Date): MergedBlock[] {
  const dayRuns = days.map((_, dayIdx) => toBusyRuns(blocked[dayIdx] ?? new Array(24).fill(false)));
  const dayIsPast = days.map((d) => isPastDate(d, today));
  const claimed = dayRuns.map((runs) => new Array(runs.length).fill(false));
  const merged: MergedBlock[] = [];

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

  return merged;
}
