export type ViewMode = "D" | "W" | "M" | "Y";

const MODES: ViewMode[] = ["D", "W", "M", "Y"];

type ViewSwitcherProps = {
  view: ViewMode;
  onSelect: (view: ViewMode) => void;
};

export function ViewSwitcher({ view, onSelect }: ViewSwitcherProps) {
  return (
    <div className="viewSwitcher" role="group" aria-label="Calendar view">
      {MODES.map((mode) => (
        <button
          key={mode}
          type="button"
          className={["viewSwitcherBtn", mode === view ? "isActive" : ""].join(" ").trim()}
          onClick={() => onSelect(mode)}
          aria-pressed={mode === view}
        >
          {mode}
        </button>
      ))}
    </div>
  );
}
