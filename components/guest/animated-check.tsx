// The "animated check in emerald ring" the spec asks for wherever a success moment needs marking
// (order placed, request sent, payment successful) — a stroke-drawn SVG using the shared
// `rb-check` keyframe (tokens.css), not a static icon. `ring={false}` drops the circle for a
// small inline checkmark (banners); the default full ring suits a standalone hero moment.
export function AnimatedCheck({ className, ring = true }: { className?: string; ring?: boolean }) {
  return (
    <svg viewBox="0 0 52 52" aria-hidden className={className}>
      {ring && (
        <circle
          cx="26"
          cy="26"
          r="24"
          fill="none"
          strokeWidth="3"
          className="stroke-success animate-check"
          style={{ strokeDasharray: 152, strokeDashoffset: 152 }}
        />
      )}
      <path
        fill="none"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14 27l7 7 16-16"
        className="stroke-success animate-check"
        style={{ strokeDasharray: 40, strokeDashoffset: 40, animationDelay: ring ? '350ms' : '0ms' }}
      />
    </svg>
  );
}
