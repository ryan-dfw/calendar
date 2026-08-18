import { useEffect, useState, type CSSProperties } from "react";
import { isSameDate } from "../lib/week";
import { useWeekBlockedHours } from "../hooks/useWeekBlockedHours";
import { GridSkeleton } from "./GridSkeleton";
import { DayScrubber } from "./DayScrubber";
import { NowIndicator } from "./NowIndicator";
import { BusyBlocks } from "./BusyBlocks";
import { FreeBlocks } from "./FreeBlocks";
import { TapEchoes } from "./TapEchoes";
import { MidWeekMarks } from "./MidWeekMarks";
import { ShimmerLayer } from "./ShimmerLayer";

type CalendarGridProps = {
  days: Date[];
  today: Date;
  onSelectDay?: (d: Date) => void;
};

export function CalendarGrid({ days, today, onSelectDay }: CalendarGridProps) {
  const { blocked, loading } = useWeekBlockedHours(days);
  const [contentVisible, setContentVisible] = useState(!loading);
  useEffect(() => {
    if (loading) {
      setContentVisible(false);
    } else {
      setContentVisible(true);
    }
  }, [loading]);

  const [tapped, setTapped] = useState<Set<string>>(new Set());
  const [activeEchoes, setActiveEchoes] = useState<Set<string>>(new Set());

  const toggleTapped = (key: string) => {
    setTapped((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    setActiveEchoes((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
        setTimeout(() => {
          setActiveEchoes((cur) => {
            const after = new Set(cur);
            after.delete(key);
            return after;
          });
        }, 2000);
      }
      return next;
    });
  };

  const [shudder, setShudder] = useState<{ key: string; count: number } | null>(null);
  const triggerShudder = (key: string) => {
    setShudder((prev) => ({ key, count: prev && prev.key === key ? prev.count + 1 : 1 }));
  };

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const todayIdx = days.findIndex((d) => isSameDate(d, today));
  const nowHour = now.getHours();
  const nowFraction = now.getMinutes() / 60;

  return (
    <div
      className={["calendarWrap", days.length === 1 ? "isSingleDay" : ""].join(" ").trim()}
      style={
        {
          "--day-count": days.length,
          "--content-visible": contentVisible ? 1 : 0,
        } as CSSProperties
      }
    >
      <GridSkeleton days={days} today={today} onSelectDay={onSelectDay} blocked={blocked} />

      {days.length === 1 && onSelectDay ? (
        <DayScrubber
          today={today}
          selectedDay={days[0]}
          onSelect={onSelectDay}
          style={{ gridColumn: "1 / -1", gridRow: 1 }}
        />
      ) : null}

      <NowIndicator
        todayIdx={todayIdx}
        dayCount={days.length}
        nowHour={nowHour}
        nowFraction={nowFraction}
      />

      <BusyBlocks
        days={days}
        today={today}
        blocked={blocked}
        shudder={shudder}
        triggerShudder={triggerShudder}
        onShudderEnd={(key) => setShudder((cur) => (cur?.key === key ? null : cur))}
      />

      <FreeBlocks days={days} today={today} blocked={blocked} onSelectHour={toggleTapped} />

      <TapEchoes tapped={tapped} onToggle={toggleTapped} />

      {days.length === 7 ? <MidWeekMarks blocked={blocked} activeEchoes={activeEchoes} /> : null}

      <ShimmerLayer days={days} today={today} blocked={blocked} />
    </div>
  );
}
