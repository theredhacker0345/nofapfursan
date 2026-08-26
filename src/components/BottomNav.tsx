import { Shield, Radio, Library, Book, Activity, User } from "lucide-react";
import { NavLink } from "@/components/NavLink";

const navItems = [
  { to: "/", icon: Shield, label: "Home" },
  { to: "/journal", icon: Book, label: "Journal" },
  { to: "/vitals", icon: Activity, label: "Health" },
  { to: "/vanguard", icon: Radio, label: "Chat" },
  { to: "/archives", icon: Library, label: "History" },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bottom-nav">
      {/* Glass background with semantic color */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/98 to-background/95 backdrop-blur-xl" />

      {/* Top border with gradient */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent shadow-[0_-1px_10px_rgba(245,200,66,0.1)]" />

      {/* Content area with proper safe-area handling */}
      <div
        className="relative flex items-center justify-around h-full max-w-lg mx-auto"
      >
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            aria-label={item.label}
            className="flex flex-col items-center justify-center gap-1 px-2 sm:px-4 py-2 text-muted-foreground transition-all duration-300 hover:text-primary min-w-[48px] min-h-[48px] active:scale-95"
            activeClassName="text-primary"
          >
            {({ isActive }) => (
              <>
                <div className={`relative ${isActive ? 'scale-110' : ''} transition-transform duration-300`}>
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                  {isActive && (
                    <div className="absolute -inset-1.5 bg-primary/20 rounded-full blur-md -z-10" />
                  )}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-primary' : ''}`}>
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
