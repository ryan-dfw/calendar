type NowIndicatorProps = {
  todayIdx: number;
  nowHour: number;
  nowFraction: number;
};

export function NowIndicator({ todayIdx, nowHour, nowFraction }: NowIndicatorProps) {
  if (todayIdx === -1) return null;

  return (
    <>
      {todayIdx > 0 ? (
        <div
          className="nowLineCell"
          style={{ gridColumn: `2 / ${todayIdx + 2}`, gridRow: nowHour + 2 }}
          aria-hidden="true"
        >
          <div
            className="nowLine"
            style={{
              top: `${nowFraction * 100}%`,
              background: `linear-gradient(to right, rgba(59, 130, 246, 0.05) 0%, rgba(59, 130, 246, 0.35) 100%)`,
            }}
          />
        </div>
      ) : null}

      {todayIdx < 6 ? (
        <div
          className="nowLineCell"
          style={{ gridColumn: `${todayIdx + 3} / 9`, gridRow: nowHour + 2 }}
          aria-hidden="true"
        >
          <div
            className="nowLine"
            style={{
              top: `${nowFraction * 100}%`,
              background: `linear-gradient(to right, rgba(59, 130, 246, 0.35) 0%, rgba(59, 130, 246, 0.05) 100%)`,
            }}
          />
        </div>
      ) : null}

      <div
        className="nowLineCell nowLineCell--today"
        style={{ gridColumn: todayIdx + 2, gridRow: nowHour + 2 }}
        aria-hidden="true"
      >
        <div className="nowGlow" style={{ top: `${nowFraction * 100}%` }} />
        <div className="nowDot" style={{ top: `${nowFraction * 100}%` }} />
      </div>
    </>
  );
}
