type TodayIconProps = {
  day: number;
};

export function TodayIcon({ day }: TodayIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <line x1="7.3" y1="2" x2="7.3" y2="6.5" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="16.7" y1="2" x2="16.7" y2="6.5" strokeWidth="1.6" strokeLinecap="round" />

      <rect x="2.5" y="4.5" width="19" height="17" rx="2.5" strokeWidth="1.4" />

      <line x1="2.5" y1="9" x2="21.5" y2="9" strokeWidth="1.4" />

      <text
        x="12"
        y="17.6"
        textAnchor="middle"
        fontSize="9.5"
        fontWeight="700"
        stroke="none"
        fill="currentColor"
        fontFamily="inherit"
      >
        {day}
      </text>
    </svg>
  );
}
