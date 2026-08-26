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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bottom-nav" aria-label="Main navigation">
      {/* Clean background */}
      <div className="absolute inset-0 bg-background/95 backdrop-blur-lg" />

      {/* Simple top border */}
      <div className="absolute inset-x-0 top-0 h-px bg-border" />

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
            className="flex flex-col items-center justify-center gap-0.5 px-2 sm:px-3 py-1.5 text-muted-foreground transition-colors duration-200 hover:text-foreground min-w-[48px] min-h-[48px]"
            activeClassName="text-on-secondary-container"
          >
            {({ isActive }) => (
              <>
                <div
                  className={`flex items-center justify-center h-7 w-14 rounded-full transition-colors duration-200 ${isActive ? "bg-secondary-container" : ""}`}
                >
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <span className={`text-[11px] ${isActive ? "text-on-secondary-container font-semibold" : "font-medium"}`}>
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
