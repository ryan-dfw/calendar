type WeekNavProps = {
  label: string;
  onPrev: () => void;
  onNext: () => void;
  canGoPrev: boolean;
  onLabelClick: () => void;
};

export function WeekNav({ label, onPrev, onNext, canGoPrev, onLabelClick }: WeekNavProps) {
  return (
    <div className="weekNav">
      <button
        type="button"
        className="navBtn"
        onClick={onPrev}
        disabled={!canGoPrev}
        aria-label="Previous week"
      >
        &#8249;
      </button>

      <div
        className="weekLabel"
        role="button"
        tabIndex={0}
        onClick={onLabelClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onLabelClick();
          }
        }}
        aria-label="Toggle date format"
      >
        {label}
      </div>

      <button
        type="button"
        className="navBtn"
        onClick={onNext}
        aria-label="Next week"
      >
        &#8250;
      </button>
    </div>
  );
}
