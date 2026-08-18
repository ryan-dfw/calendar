import { useEffect, useRef, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { addDays, isSameDate, DAY_LABELS } from "../lib/week";
import { useMonthBlockedHours } from "../hooks/useMonthBlockedHours";

const RANGE_DAYS = 60;
const DRAG_THRESHOLD = 5;
const FRICTION_PER_MS = 0.9965;
const STOP_VELOCITY = 0.02;

type DayScrubberProps = {
  today: Date;
  selectedDay: Date;
  onSelect: (d: Date) => void;
  style?: CSSProperties;
};

type DragState = {
  pointerId: number;
  startX: number;
  startScrollLeft: number;
  moved: number;
  dayIndex: number | null;
  lastX: number;
  lastT: number;
  velocity: number;
};

export function DayScrubber({ today, selectedDay, onSelect, style }: DayScrubberProps) {
  const selectedRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<DragState | null>(null);
  const momentumFrame = useRef<number | null>(null);
  const days = Array.from({ length: RANGE_DAYS }, (_, i) => addDays(today, i));
  const { blocked } = useMonthBlockedHours(days);

  useEffect(() => {
    if (dragState.current || momentumFrame.current !== null) return;
    selectedRef.current?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [selectedDay.getTime()]);

  const stopMomentum = () => {
    if (momentumFrame.current !== null) {
      cancelAnimationFrame(momentumFrame.current);
      momentumFrame.current = null;
    }
    trackRef.current?.classList.remove("isCoasting");
  };

  const runMomentum = (startVelocity: number) => {
    const track = trackRef.current;
    if (!track) return;
    track.classList.add("isCoasting");
    let velocity = startVelocity;
    let lastTs: number | null = null;

    const step = (ts: number) => {
      if (lastTs === null) lastTs = ts;
      const dt = ts - lastTs;
      lastTs = ts;

      velocity *= Math.pow(FRICTION_PER_MS, dt);
      const maxScroll = track.scrollWidth - track.clientWidth;
      const next = track.scrollLeft - velocity * dt;

      if (next <= 0 || next >= maxScroll) {
        track.scrollLeft = Math.max(0, Math.min(maxScroll, next));
        momentumFrame.current = null;
        track.classList.remove("isCoasting");
        return;
      }
      track.scrollLeft = next;

      if (Math.abs(velocity) < STOP_VELOCITY) {
        momentumFrame.current = null;
        track.classList.remove("isCoasting");
        return;
      }
      momentumFrame.current = requestAnimationFrame(step);
    };

    momentumFrame.current = requestAnimationFrame(step);
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return;
    const track = trackRef.current;
    if (!track) return;
    stopMomentum();
    const pillEl = (e.target as HTMLElement).closest("[data-day-index]") as HTMLElement | null;
    const dayIndex = pillEl ? Number(pillEl.dataset.dayIndex) : null;
    dragState.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startScrollLeft: track.scrollLeft,
      moved: 0,
      dayIndex: dayIndex !== null && !Number.isNaN(dayIndex) ? dayIndex : null,
      lastX: e.clientX,
      lastT: e.timeStamp,
      velocity: 0,
    };
    track.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragState.current;
    const track = trackRef.current;
    if (!drag || !track || drag.pointerId !== e.pointerId) return;

    const delta = e.clientX - drag.startX;
    drag.moved = Math.max(drag.moved, Math.abs(delta));
    track.scrollLeft = drag.startScrollLeft - delta;

    const dt = e.timeStamp - drag.lastT;
    if (dt > 0) {
      const instVelocity = (e.clientX - drag.lastX) / dt;
      drag.velocity = drag.velocity * 0.7 + instVelocity * 0.3;
    }
    drag.lastX = e.clientX;
    drag.lastT = e.timeStamp;
  };

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragState.current;
    const track = trackRef.current;
    if (!drag || !track || drag.pointerId !== e.pointerId) return;
    track.releasePointerCapture(e.pointerId);
    dragState.current = null;

    if (drag.moved <= DRAG_THRESHOLD && drag.dayIndex !== null) {
      onSelect(days[drag.dayIndex]);
      return;
    }

    if (Math.abs(drag.velocity) > STOP_VELOCITY) {
      runMomentum(drag.velocity);
    }
  };

  return (
    <div className="dayScrubber" style={style}>
      <div
        className="dayScrubberTrack"
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onPointerCancel={endDrag}
      >
        {days.map((d, i) => {
          const isSelected = isSameDate(d, selectedDay);
          const isToday = isSameDate(d, today);
          const isOtherMonth =
            d.getMonth() !== today.getMonth() || d.getFullYear() !== today.getFullYear();
          const dayBlocked = blocked[i] ?? new Array(24).fill(false);
          const isFree = dayBlocked.every((h) => !h);
          const hasAnyBooking = dayBlocked.some(Boolean);
          const isFullyBooked = dayBlocked.every(Boolean);
          const isPartial = hasAnyBooking && !isFullyBooked;
          return (
            <div
              key={i}
              ref={isSelected ? selectedRef : undefined}
              data-day-index={i}
              className={[
                "dayScrubberPill",
                isSelected ? "isSelected" : "",
                isToday ? "isToday" : "",
                isFree ? "hasFreeHat" : "",
              ]
                .join(" ")
                .trim()}
              role="button"
              tabIndex={0}
              aria-current={isSelected ? "date" : undefined}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(d);
                }
              }}
            >
              {isOtherMonth ? (
                <span className="dayScrubberMonth">
                  {d.toLocaleDateString(undefined, { month: "short" })}
                </span>
              ) : null}
              <span className="dayScrubberName">
                {DAY_LABELS[d.getDay() === 0 ? 6 : d.getDay() - 1]}
              </span>
              <span
                className={[
                  "dayScrubberNum",
                  isPartial ? "isPartial" : "",
                  isFullyBooked ? "isFull" : "",
                ]
                  .join(" ")
                  .trim()}
              >
                {d.getDate()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
