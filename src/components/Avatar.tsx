import { cn } from "@/lib/utils";

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: number | "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  alt?: string;
}

const SIZE_MAP = { xs: 20, sm: 28, md: 36, lg: 48, xl: 72 } as const;

const FONT_MAP = {
  xs: "text-[9px]",
  sm: "text-[11px]",
  md: "text-meta",
  lg: "text-body",
  xl: "text-display-l",
} as const;

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * One neutral surface treatment. The previous version picked between eight
 * hard-coded Tailwind palette colours (including `bg-purple-500` /
 * `bg-teal-500`) which is exactly the generic-template look this app must not
 * have — and `text-white` on `bg-primary` was invisible on the OLED theme.
 */
export function Avatar({ src, name, size = "md", className, alt }: AvatarProps) {
  const sizePx = typeof size === "number" ? size : SIZE_MAP[size];
  const fontClass = typeof size === "number" ? "text-meta" : FONT_MAP[size];
  const showImage = !!src && src.length > 0;
  const label = name?.trim() || "Anonymous";

  return (
    <span
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full border border-border bg-surface-2",
        className,
      )}
      style={{ width: sizePx, height: sizePx }}
    >
      {showImage ? (
        <img
          src={src as string}
          alt={alt ?? label}
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <span
          aria-hidden={true}
          className={cn("font-semibold uppercase tracking-wide text-ink-muted", fontClass)}
        >
          {getInitials(label)}
        </span>
      )}
    </span>
  );
}

export default Avatar;