import { cn } from "@/lib/utils";

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: number | "sm" | "md" | "lg" | "xl";
  className?: string;
  alt?: string;
}

/**
 * Reusable Avatar component with fallback initials.
 * Uses a deterministic color based on the name hash.
 */
const SIZE_MAP = {
  sm: 24,
  md: 32,
  lg: 40,
  xl: 56,
} as const;

const AVATAR_COLORS = [
  "bg-accent text-accent-ink",
  "bg-success text-white",
  "bg-warning text-white",
  "bg-danger text-white",
  "bg-primary text-primary-foreground",
  "bg-purple-500 text-white",
  "bg-pink-500 text-white",
  "bg-teal-500 text-white",
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = Math.imul(31, hash) + str.charCodeAt(i) | 0;
  }
  return Math.abs(hash);
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getColorClass(name: string): string {
  const hash = hashString(name);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function Avatar({ src, name, size = "md", className, alt }: AvatarProps) {
  const sizePx = typeof size === "number" ? size : SIZE_MAP[size];
  const showImage = src && src.length > 0;
  const initials = name ? getInitials(name) : "?";
  const colorClass = name ? getColorClass(name) : "bg-ink-muted";

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center overflow-hidden rounded-full flex-shrink-0",
        className
      )}
      style={{ width: sizePx, height: sizePx }}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt || name || "Avatar"}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div
          className={cn(
            "w-full h-full flex items-center justify-center font-semibold select-none",
            colorClass,
            "text-sm",
            size === "sm" && "text-[10px]",
            size === "md" && "text-[12px]",
            size === "lg" && "text-[14px]",
            size === "xl" && "text-[18px]",
          )}
        >
          {initials}
        </div>
      )}
    </div>
  );
}

export default Avatar;