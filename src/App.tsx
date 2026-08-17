import { useEffect, useMemo, useRef, useState, type TouchEvent } from "react";
import "./styles/index.css";
import "./styles/theme.css";
import "./styles/calendar.css";
import { WeekNav } from "./components/WeekNav";
import { CalendarGrid } from "./components/CalendarGrid";
import { MonthView } from "./components/MonthView";
import { YearView } from "./components/YearView";
import { TodayIcon } from "./components/TodayIcon";
import { UpLevelIcon } from "./components/UpLevelIcon";
import { SearchIcon } from "./components/SearchIcon";
import { CloseIcon } from "./components/CloseIcon";
import { ViewSwitcher, type ViewMode } from "./components/ViewSwitcher";
import { useBackgroundDrift } from "./hooks/useBackgroundDrift";
import {
  startOfWeekMonday,
  addDays,
  formatWeekRange,
  formatWeekRangeCompact,
  formatDayLabel,
  formatMonthLabel,
  formatYearLabel,
  toCompactDate,
  parseCompactDate,
  parseUrlParams,
  buildUrlParams,
} from "./lib/week";

function weekOffsetFor(target: Date, currentMonday: Date): number {
  const targetMonday = startOfWeekMonday(target);
  const diffDays = Math.round((targetMonday.getTime() - currentMonday.getTime()) / 86_400_000);
  return Math.max(0, Math.round(diffDays / 7));
}

function monthOffsetFor(target: Date, today: Date): number {
  const diff =
    (target.getFullYear() - today.getFullYear()) * 12 + (target.getMonth() - today.getMonth());
  return Math.max(0, diff);
}

function yearOffsetFor(target: Date, today: Date): number {
  return Math.max(0, target.getFullYear() - today.getFullYear());
}

function dayOffsetFor(target: Date, today: Date): number {
  const a = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const b = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diffDays = Math.round((a.getTime() - b.getTime()) / 86_400_000);
  return Math.max(0, diffDays);
}

export default function App() {
  useBackgroundDrift();

  const today = useMemo(() => new Date(), []);
  const currentMonday = useMemo(() => startOfWeekMonday(today), [today]);
  const initialParams = useMemo(() => parseUrlParams(window.location.search), []);

  const [weekOffset, setWeekOffset] = useState(() => {
    if (!initialParams.date) return 0;
    return weekOffsetFor(initialParams.date, currentMonday);
  });
  const [dayOffset, setDayOffset] = useState(() => {
    if (!initialParams.date) return 0;
    const a = new Date(
      initialParams.date.getFullYear(),
      initialParams.date.getMonth(),
      initialParams.date.getDate(),
    );
    const b = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const diffDays = Math.round((a.getTime() - b.getTime()) / 86_400_000);
    return Math.max(0, diffDays);
  });
  const [monthOffset, setMonthOffset] = useState(() => {
    if (!initialParams.date) return 0;
    return monthOffsetFor(initialParams.date, today);
  });
  const [yearOffset, setYearOffset] = useState(() => {
    if (!initialParams.date) return 0;
    return yearOffsetFor(initialParams.date, today);
  });
  const [compactLabel, setCompactLabel] = useState(false);
  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia("(max-width: 600px)").matches,
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 600px)");
    const onChange = () => setIsMobile(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [searchInvalid, setSearchInvalid] = useState(false);
  const searchAnchorRef = useRef<HTMLDivElement>(null);
  const closeSearch = () => {
    setSearchOpen(false);
    setSearchValue("");
    setSearchInvalid(false);
  };

  useEffect(() => {
    if (!searchOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!searchAnchorRef.current?.contains(e.target as Node)) closeSearch();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [searchOpen]);
  const [view, setView] = useState<ViewMode>(initialParams.view);

  const monday = useMemo(
    () => addDays(currentMonday, weekOffset * 7),
    [currentMonday, weekOffset],
  );
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(monday, i)),
    [monday],
  );
  const selectedDay = useMemo(() => addDays(today, dayOffset), [today, dayOffset]);
  const monthAnchor = useMemo(() => {
    const base = new Date(today.getFullYear(), today.getMonth(), 1);
    base.setMonth(base.getMonth() + monthOffset);
    return base;
  }, [today, monthOffset]);
  const yearAnchor = useMemo(
    () => new Date(today.getFullYear() + yearOffset, 0, 1),
    [today, yearOffset],
  );

  const anchorForView = (v: ViewMode): Date => {
    if (v === "D") return selectedDay;
    if (v === "W") return monday;
    if (v === "M") return monthAnchor;
    return yearAnchor;
  };
  const applyViewOffset = (mode: ViewMode, anchor: Date) => {
    if (mode === "D") setDayOffset(dayOffsetFor(anchor, today));
    else if (mode === "W") setWeekOffset(weekOffsetFor(anchor, currentMonday));
    else if (mode === "M") setMonthOffset(monthOffsetFor(anchor, today));
    else setYearOffset(yearOffsetFor(anchor, today));
  };
  const handleViewSelect = (mode: ViewMode) => {
    if (mode !== view) applyViewOffset(mode, anchorForView(view));
    setView(mode);
  };

  const label = useMemo(() => {
    if (view === "D") {
      return compactLabel ? toCompactDate(selectedDay) : formatDayLabel(selectedDay, today);
    }
    if (view === "M") {
      return formatMonthLabel(monthAnchor, today.getFullYear());
    }
    if (view === "Y") {
      return formatYearLabel(yearAnchor);
    }
    return compactLabel ? formatWeekRangeCompact(monday) : formatWeekRange(monday);
  }, [view, selectedDay, monday, monthAnchor, yearAnchor, compactLabel, today]);

  useEffect(() => {
    const dateForView =
      view === "D"
        ? dayOffset === 0
          ? null
          : selectedDay
        : view === "M"
          ? monthOffset === 0
            ? null
            : monthAnchor
          : view === "Y"
            ? yearOffset === 0
              ? null
              : yearAnchor
            : weekOffset === 0
              ? null
              : monday;

    const params = buildUrlParams(view, dateForView);
    const url = params ? `${window.location.pathname}?${params}` : window.location.pathname;
    window.history.replaceState(null, "", url);
  }, [view, monday, weekOffset, dayOffset, selectedDay, monthOffset, monthAnchor, yearOffset, yearAnchor]);

  const goPrev = () => {
    if (view === "D") setDayOffset((d) => Math.max(0, d - 1));
    else if (view === "M") setMonthOffset((m) => Math.max(0, m - 1));
    else if (view === "Y") setYearOffset((y) => Math.max(0, y - 1));
    else setWeekOffset((w) => Math.max(0, w - 1));
  };
  const goNext = () => {
    if (view === "D") setDayOffset((d) => d + 1);
    else if (view === "M") setMonthOffset((m) => m + 1);
    else if (view === "Y") setYearOffset((y) => y + 1);
    else setWeekOffset((w) => w + 1);
  };
  const goToWeek = (date: Date) => {
    setWeekOffset(weekOffsetFor(date, currentMonday));
    setView("W");
  };
  const goToDay = (date: Date) => {
    const a = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const b = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const diffDays = Math.round((a.getTime() - b.getTime()) / 86_400_000);
    setDayOffset(Math.max(0, diffDays));
    setView("D");
  };
  const goToMonth = (date: Date) => {
    setMonthOffset(monthOffsetFor(date, today));
    setView("M");
  };
  const submitSearch = () => {
    const parsed = parseCompactDate(searchValue);
    if (!parsed) {
      setSearchInvalid(true);
      window.setTimeout(() => {
        setSearchInvalid(false);
        setSearchValue("");
      }, 550);
      return;
    }
    if (view === "D") goToDay(parsed);
    else goToWeek(parsed);
    closeSearch();
  };
  const canGoPrev =
    view === "D"
      ? dayOffset > 0
      : view === "M"
        ? monthOffset > 0
        : view === "Y"
          ? yearOffset > 0
          : weekOffset > 0;
  const isAtToday =
    view === "D"
      ? dayOffset === 0
      : view === "M"
        ? monthOffset === 0
        : view === "Y"
          ? yearOffset === 0
          : weekOffset === 0;
  const goToday = () => {
    setWeekOffset(0);
    setDayOffset(0);
    setMonthOffset(0);
    setYearOffset(0);
  };
  const goUpLevel = () => {
    if (view === "D") handleViewSelect("W");
    else if (view === "W") handleViewSelect("M");
    else if (view === "M") handleViewSelect("Y");
    else alert("don't do that");
  };

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
  }, [view]);

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

  const viewSwitcherEl = <ViewSwitcher view={view} onSelect={handleViewSelect} />;

  const todayGroupEl = (
    <div className="todayGroup">
      <button
        type="button"
        className={["upBtn", view === "Y" ? "isDimmed" : ""].join(" ").trim()}
        onClick={goUpLevel}
        aria-label="Go up a level"
      >
        <UpLevelIcon />
      </button>
      <div className="searchAnchor" ref={searchAnchorRef}>
        <button
          type="button"
          className="upBtn"
          onClick={() => setSearchOpen((o) => !o)}
          aria-label="Search"
        >
          <SearchIcon />
        </button>
        {searchOpen ? (
          <div className="searchDialog">
            <div
              className={["searchInputPill", searchInvalid ? "isInvalid" : ""].join(" ").trim()}
            >
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                autoFocus
                disabled={searchInvalid}
                placeholder="YYMMDD"
                className="searchInput"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value.replace(/\D/g, "").slice(0, 6))}
                onKeyDown={(e) => {
                  if (e.key === "Escape") closeSearch();
                  else if (e.key === "Enter") submitSearch();
                }}
              />
              <button
                type="button"
                className="searchIconBtn searchIconBtn--go"
                onClick={submitSearch}
                aria-label="Search"
              >
                <SearchIcon />
              </button>
            </div>
            <button
              type="button"
              className="searchIconBtn"
              onClick={closeSearch}
              aria-label="Close search"
            >
              <CloseIcon />
            </button>
          </div>
        ) : null}
      </div>
      <button
        type="button"
        className="todayBtn"
        onClick={goToday}
        disabled={isAtToday}
        aria-label="Go to this week"
      >
        <TodayIcon day={today.getDate()} />
      </button>
    </div>
  );

  return (
    <div className="stage" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="headerRow">
        {isMobile ? null : viewSwitcherEl}
        <WeekNav
          label={label}
          onPrev={goPrev}
          onNext={goNext}
          canGoPrev={canGoPrev}
          onLabelClick={() => setCompactLabel((c) => !c)}
        />
        {isMobile ? null : todayGroupEl}
      </div>

      {isMobile ? (
        <div className="bottomBar">
          {viewSwitcherEl}
          {todayGroupEl}
        </div>
      ) : null}

      {view === "Y" ? (
        <YearView yearAnchor={yearAnchor} today={today} onSelectMonth={goToMonth} />
      ) : view === "M" ? (
        <MonthView monthAnchor={monthAnchor} today={today} onSelectWeek={goToWeek} />
      ) : view === "D" ? (
        <CalendarGrid days={[selectedDay]} today={today} onSelectDay={goToDay} />
      ) : (
        <CalendarGrid days={weekDays} today={today} onSelectDay={goToDay} />
      )}
    </div>
  );
}
