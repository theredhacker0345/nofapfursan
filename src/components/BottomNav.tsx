import { Shield, BookOpen, Book, MessageCircle, Activity, Library } from "lucide-react";
import { NavLink } from "@/components/NavLink";

const navItems = [
  { to: "/", icon: Shield, label: "Home" },
  { to: "/journal", icon: BookOpen, label: "Journal" },
  { to: "/vitals", icon: Activity, label: "Health" },
  { to: "/vanguard", icon: MessageCircle, label: "Chat" },
  { to: "/library", icon: Library, label: "Library" },
  { to: "/archives", icon: Book, label: "History" },
];

export function BottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 bg-bg/95 backdrop-blur-md border-t border-border safe-bottom"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex h-14 max-w-screen-sm items-center justify-around px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            aria-label={item.label}
            className="flex min-h-[44px] min-w-[56px] flex-col items-center justify-center gap-0.5 text-ink-faint transition-colors"
            activeClassName="text-accent"
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className="h-[22px] w-[22px]"
                  strokeWidth={isActive ? 2.4 : 1.6}
                  fill={isActive ? "currentColor" : "none"}
                  fillOpacity={isActive ? 0.12 : 0}
                  aria-hidden="true"
                />
                <span
                  className={`text-[10.5px] tracking-tight ${
                    isActive ? "font-semibold" : "font-medium"
                  }`}
                >
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
