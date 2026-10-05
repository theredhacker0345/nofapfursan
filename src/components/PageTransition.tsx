import { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

/**
 * Route changes render instantly. The previous implementation ran a 400ms exit
 * plus a 400ms enter in `mode="wait"` — roughly 800ms of blank screen per
 * navigation, which reads as lag on every tap. A 120ms opacity fade keeps the
 * continuity without the dead time, and it is disabled entirely under
 * `prefers-reduced-motion`.
 */
export function PageTransition({ children }: PageTransitionProps) {
  return (
    <div className="relative flex min-h-dvh flex-col animate-fade-in">{children}</div>
  );
}