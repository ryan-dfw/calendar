export type BusyRun = {
  start: number;
  length: number;
};

export function toBusyRuns(blocked: boolean[]): BusyRun[] {
  const runs: BusyRun[] = [];
  let runStart: number | null = null;

  for (let h = 0; h < blocked.length; h++) {
    if (blocked[h] && runStart === null) {
      runStart = h;
    }
    const runEnds = !blocked[h] || h === blocked.length - 1;
    if (runStart !== null && runEnds) {
      const end = blocked[h] ? h + 1 : h;
      runs.push({ start: runStart, length: end - runStart });
      runStart = null;
    }
  }

  return runs;
}
