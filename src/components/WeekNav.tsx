type WeekNavProps = {
  label: string;
  onPrev: () => void;
  onNext: () => void;
  canGoPrev: boolean;
};

export function WeekNav({ label, onPrev, onNext, canGoPrev }: WeekNavProps) {
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

      <div className="weekLabel">{label}</div>

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
