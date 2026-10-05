import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { Header } from "@/components/Header";
import { cn } from "@/lib/utils";

interface ScreenProps {
  children: ReactNode;
  /** Page title. Renders the screen's only <h1>. */
  title?: string;
  /** Short uppercase qualifier shown under the title. */
  subtitle?: string;
  /** Renders the standard app header. Disable for full-bleed screens. */
  withHeader?: boolean;
  withNav?: boolean;
  /** Adds a back affordance (defaults to "go back in history"). */
  back?: boolean;
  /** Bare layout without the screen padding (e.g. chat). */
  bare?: boolean;
  className?: string;
  /** Rendered between the header and the content. */
  action?: ReactNode;
}

/**
 * The single layout shell.
 *
 * Before this existed the app had six different content widths, six different
 * page-title designs, two hand-copied sticky headers and two different
 * bottom-nav clearances. Every screen now inherits one of each.
 */
export function Screen({
  children,
  title,
  subtitle,
  withHeader = true,
  withNav = true,
  back = false,
  bare = false,
  className,
  action,
}: ScreenProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:text-label focus:uppercase focus:text-bg"
      >
        Skip to content
      </a>

      {withHeader && <Header action={action} />}

      <main
        id="main"
        className={cn(
          "mx-auto w-full max-w-content flex-1",
          !bare && "px-5",
          withNav && "nav-clearance",
          className,
        )}
      >
        {(title || subtitle || back) && (
          <div className={cn("flex items-start gap-3", !bare && "pt-6", bare && "px-5 pt-4")}>
            {back && (
              <Link
                to="/"
                aria-label="Back to today"
                className="-ml-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </Link>
            )}
            <div className="min-w-0 flex-1">
              {title && (
                <h1 className="text-display-l font-semibold text-ink">{title}</h1>
              )}
              {subtitle && (
                <p className="mt-1 text-label uppercase text-ink-faint">{subtitle}</p>
              )}
            </div>
          </div>
        )}
        <div className={cn(title || subtitle || back ? "pt-6" : undefined)}>{children}</div>
      </main>

      {withNav && <BottomNav />}
    </div>
  );
}

/** `<h2>` section label. Always a heading so screen readers can navigate. */
export function SectionHead({
  children,
  action,
  className,
}: {
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-3 pt-8 pb-2", className)}>
      <h2 className="text-label uppercase text-ink-faint">{children}</h2>
      {action}
    </div>
  );
}