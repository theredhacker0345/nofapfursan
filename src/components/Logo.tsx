import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: number;
  showWordmark?: boolean;
}

/**
 * Fursan brand mark — a square 8-point geometric mark inspired by
 * an Islamic star, with an F-shaped negative-space cut. Rendered
 * inline as SVG so it scales crisply and takes the current text
 * color via `currentColor`.
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
        className="text-accent"
      >
        {/* 8-point star with F-shaped negative space */}
        <path
          d="M16 1.5 L18.5 6.7 L24 4.4 L23.5 10.2 L29.5 11.5 L26.2 16 L29.5 20.5 L23.5 21.8 L24 27.6 L18.5 25.3 L16 30.5 L13.5 25.3 L8 27.6 L8.5 21.8 L2.5 20.5 L5.8 16 L2.5 11.5 L8.5 10.2 L8 4.4 L13.5 6.7 Z"
          fill="currentColor"
        />
        <path
          d="M11 10 H21 V12.5 H13.25 V15 H19 V17.5 H13.25 V22 H11 Z"
          fill="hsl(var(--bg))"
        />
      </svg>

      {showWordmark && (
        <span
          className="font-display text-[19px] font-extrabold tracking-[0.18em] text-ink"
          style={{ fontStretch: "condensed" }}
        >
          FURSAN
        </span>
      )}
    </div>
  );
}

export default Logo;
