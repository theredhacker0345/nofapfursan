import { NavLink } from "@/components/NavLink";
import { Shield, Activity, BookOpen, Radio } from "lucide-react";

/**
 * Five destinations, grid-laid-out. The previous bar carried seven items with
 * `min-w-[56px]`, which needed 392px and clipped "History" off-screen at 320px
 * — `scrollWidth === clientWidth`, so it was silently unreachable.
 */
const items = [
  { to: "/", label: "Today", icon: Shield, end: true },
  { to: "/vitals", label: "Vitals", icon: Activity, end: false },
  { to: "/journal", label: "Journal", icon: BookOpen, end: false },
  { to: "/vanguard", label: "Vanguard", icon: Radio, end: false },
  { to: "/library", label: "Library", icon: BookOpen, end: false },
] as const;

export function BottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-bg/92 backdrop-blur-md"
      aria-label="Primary"
    >
      <ul className="mx-auto grid w-full max-w-content grid-cols-5 px-2">
        {items.map((item) => (
          <li key={item.to} className="min-w-0">
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-md px-1 transition-colors duration-fast ${
                  isActive ? "text-accent" : "text-ink-faint hover:text-ink-muted"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`flex h-6 w-10 items-center justify-center rounded-full transition-colors duration-fast ${
                      isActive ? "bg-accent/12" : "bg-transparent"
                    }`}
                  >
                    <item.icon
                      className="h-[18px] w-[18px]"
                      strokeWidth={isActive ? 2.25 : 1.75}
                      aria-hidden="true"
                    />
                  </span>
                  <span
                    className={`w-full truncate text-center text-[11px] leading-tight ${
                      isActive ? "font-semibold" : "font-medium"
                    }`}
                  >
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
      <div className="safe-bottom" aria-hidden="true" />
    </nav>
  );
}