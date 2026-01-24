type QuickgoalIconProps = {
  size?: number;
  className?: string;
  title?: string;
};

export default function QuickgoalIcon({
  size = 44,
  className,
  title = "Quickgoal",
}: QuickgoalIconProps) {
  const cx = 100;
  const cy = 100;
  const strokeW = 15;
  const outerR = 65;
  const innerR = 43;
  const outerC = 2 * Math.PI * outerR;
  const innerC = 2 * Math.PI * innerR;
  const outerGap = 52;
  const innerGap = 55;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={title}
    >
      <circle
        cx={cx}
        cy={cy}
        r={outerR}
        stroke="var(--color-logo-outer)"
        strokeWidth={strokeW}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${outerC - outerGap} ${outerGap}`}
        strokeDashoffset={outerC * 0.041}
      />

      <circle
        cx={cx}
        cy={cy}
        r={innerR}
        stroke="var(--color-logo-inner)"
        strokeWidth={strokeW}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${innerC - innerGap} ${innerGap}`}
        strokeDashoffset={innerC * -0.022}
      />

      <path
        d="M 70 104 L 92 126 L 150 60"
        stroke="var(--color-logo-check)"
        strokeWidth={23}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        transform="translate(11, -11)"
      />

      <path
        d="M 172 24 L 176 34 L 187 34 L 178 40 L 181 51 L 172 44 L 163 51 L 166 40 L 157 34 L 168 34 Z"
        fill="var(--color-logo-star)"
        transform="translate(-25, -20)"
      />
      <path
        d="M 156 44 L 159 52 L 168 52 L 161 57 L 164 66 L 156 60 L 148 66 L 151 57 L 144 52 L 153 52 Z"
        fill="var(--color-logo-star)"
        transform="translate(32, -2)"
      />
    </svg>
  );
}
