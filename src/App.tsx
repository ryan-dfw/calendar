import { useEffect, useMemo, useRef, useState, type TouchEvent } from "react";
import "./styles/index.css";
import "./styles/theme.css";
import "./styles/calendar.css";
import { WeekNav } from "./components/WeekNav";
import { CalendarGrid } from "./components/CalendarGrid";
import { TodayIcon } from "./components/TodayIcon";
import { useBackgroundDrift } from "./hooks/useBackgroundDrift";
import { startOfWeekMonday, addDays, formatWeekRange } from "./lib/week";

export default function App() {
  useBackgroundDrift();

  const today = useMemo(() => new Date(), []);
  const currentMonday = useMemo(() => startOfWeekMonday(today), [today]);

  const [weekOffset, setWeekOffset] = useState(0);

  const monday = useMemo(
    () => addDays(currentMonday, weekOffset * 7),
    [currentMonday, weekOffset],
  );
  const label = useMemo(() => formatWeekRange(monday), [monday]);

  const goPrev = () => setWeekOffset((w) => Math.max(0, w - 1));
  const goNext = () => setWeekOffset((w) => w + 1);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isEditable =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (isEditable) return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: TouchEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    const SWIPE_THRESHOLD = 48;
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    if (dx < 0) goNext();
    else goPrev();
  };

  return (
    <div className="stage" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="headerRow">
        <WeekNav
          label={label}
          onPrev={goPrev}
          onNext={goNext}
          canGoPrev={weekOffset > 0}
        />
        <button
          type="button"
          className="todayBtn"
          onClick={() => setWeekOffset(0)}
          disabled={weekOffset === 0}
          aria-label="Go to this week"
        >
          <TodayIcon day={today.getDate()} />
        </button>
      </div>

      <CalendarGrid monday={monday} today={today} />
    </div>
  );
}
