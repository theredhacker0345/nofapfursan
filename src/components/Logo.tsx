import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: number;
  showWordmark?: boolean;
}

/**
 * Fursan brand mark: the Rub el Hizb — two squares sharing a centre, the
 * canonical eight-pointed figure in Islamic geometry.
 *
 * It replaced an eight-point star whose inner "F" counter-form was only 10×12
 * units, so at the 22px the header renders it disappeared and the mark read as
 * a generic sparkle. Two strokes and a centre dot survive any size and any
 * theme, and they inherit `currentColor` from the accent token.
 */
export function Logo({ className, size = 28, showWordmark = true }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
        className="shrink-0 text-accent"
      >
        <rect
          x="5.25"
          y="5.25"
          width="21.5"
          height="21.5"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="2.25"
        />
        <rect
          x="5.25"
          y="5.25"
          width="21.5"
          height="21.5"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="2.25"
          transform="rotate(45 16 16)"
        />
        <circle cx="16" cy="16" r="2.1" fill="currentColor" />
      </svg>

      {showWordmark && (
        <span className="font-display text-[17px] font-semibold uppercase tracking-[0.22em] text-ink">
          Fursan
        </span>
      )}
    </div>
  );
}

export default Logo;