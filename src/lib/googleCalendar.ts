const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const CALENDAR_ID = import.meta.env.VITE_GOOGLE_CALENDAR_ID;
const TIME_ZONE = "America/Chicago";

type GCalDateTime = { date?: string; dateTime?: string };

type GCalEvent = {
  status?: string;
  start?: GCalDateTime;
  end?: GCalDateTime;
};

function emptyGrid(n: number): boolean[][] {
  return Array.from({ length: n }, () => new Array(24).fill(false));
}

function hourInTZ(iso: string): number {
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? "0") % 24;
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return h + m / 60;
}

function dateKeyInTZ(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(new Date(iso));
}

function dateKeyOf(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function fetchBlockedHoursForDays(days: Date[], maxResults?: number): Promise<boolean[][]> {
  const grid = emptyGrid(days.length);

  if (!API_KEY || !CALENDAR_ID) {
    console.warn("raincal: missing VITE_GOOGLE_API_KEY / VITE_GOOGLE_CALENDAR_ID; showing an empty range.");
    return grid;
  }
  if (days.length === 0) return grid;

  const timeMin = new Date(days[0]);
  timeMin.setHours(0, 0, 0, 0);
  const timeMax = new Date(days[days.length - 1]);
  timeMax.setHours(0, 0, 0, 0);
  timeMax.setDate(timeMax.getDate() + 1);

  const url = new URL(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events`,
  );
  url.searchParams.set("key", API_KEY);
  url.searchParams.set("timeMin", timeMin.toISOString());
  url.searchParams.set("timeMax", timeMax.toISOString());
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");
  url.searchParams.set("timeZone", TIME_ZONE);
  if (maxResults) url.searchParams.set("maxResults", String(maxResults));

  const events: GCalEvent[] = [];
  let pageToken: string | undefined;
  do {
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    else url.searchParams.delete("pageToken");

    const res = await fetch(url.toString());
    if (!res.ok) {
      throw new Error(`Google Calendar fetch failed (${res.status})`);
    }
    const data = (await res.json()) as { items?: GCalEvent[]; nextPageToken?: string };
    events.push(...(data.items ?? []));
    pageToken = data.nextPageToken;
  } while (pageToken);

  const dayKeys = days.map(dateKeyOf);

  for (const ev of events) {
    if (ev.status === "cancelled") continue;

    if (ev.start?.date && !ev.start?.dateTime) {
      const startKey = ev.start.date;
      const endKeyExclusive = ev.end?.date ?? startKey;
      dayKeys.forEach((key, dayIdx) => {
        if (key >= startKey && key < endKeyExclusive) grid[dayIdx].fill(true);
      });
      continue;
    }

    const startIso = ev.start?.dateTime;
    const endIso = ev.end?.dateTime;
    if (!startIso || !endIso) continue;

    const startKey = dateKeyInTZ(startIso);
    const endKey = dateKeyInTZ(endIso);
    const startHour = hourInTZ(startIso);
    const endHour = hourInTZ(endIso);

    if (startKey === endKey) {
      const dayIdx = dayKeys.indexOf(startKey);
      if (dayIdx === -1) continue;
      const from = Math.floor(startHour);
      const to = Math.max(from + 1, Math.ceil(endHour));
      for (let h = from; h < Math.min(to, 24); h++) grid[dayIdx][h] = true;
      continue;
    }

    const startDayIdx = dayKeys.indexOf(startKey);
    if (startDayIdx !== -1) {
      const from = Math.floor(startHour);
      for (let h = from; h < 24; h++) grid[startDayIdx][h] = true;
    }
    const endDayIdx = dayKeys.indexOf(endKey);
    if (endDayIdx !== -1) {
      const to = Math.ceil(endHour);
      for (let h = 0; h < Math.min(to, 24); h++) grid[endDayIdx][h] = true;
    }
    dayKeys.forEach((key, dayIdx) => {
      if (key > startKey && key < endKey) grid[dayIdx].fill(true);
    });
  }

  return grid;
}

export async function fetchWeekBlockedHours(monday: Date): Promise<boolean[][]> {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return d;
  });
  return fetchBlockedHoursForDays(days);
}

export async function fetchRangeBlockedHours(days: Date[]): Promise<boolean[][]> {
  return fetchBlockedHoursForDays(days, 2500);
}
