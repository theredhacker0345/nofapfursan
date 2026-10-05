import { Logo } from "@/components/Logo";

interface LoadingScreenProps {
  message?: string;
  subMessage?: string;
}

/**
 * Token-driven and calm. The previous version hard-coded a cream background
 * (unreadable on all three dark themes), ran three infinite rings plus a 12s
 * rotation, and its progress bar had no positioned parent so the sweep covered
 * the whole page.
 */
export function LoadingScreen({
  message = "Loading",
  subMessage = "Preparing your records",
}: LoadingScreenProps) {
  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-bg px-6 text-center"
      role="status"
      aria-live="polite"
    >
      <Logo size={40} showWordmark={false} />

      <div className="space-y-2">
        <p className="text-section font-semibold text-ink">{message}</p>
        <p className="text-meta text-ink-muted">{subMessage}</p>
      </div>

      <div className="relative h-px w-40 overflow-hidden bg-border" aria-hidden="true">
        <div className="absolute inset-y-0 left-0 w-1/3 animate-sync-pulse bg-accent" />
      </div>
    </div>
  );
}

/** In-page variant — keeps layout stable while a region resolves. */
export function LoadingBlock({ label = "Loading" }: { label?: string }) {
  return (
    <div
      className="flex items-center justify-center gap-3 rounded-lg border border-border bg-surface px-5 py-8"
      role="status"
      aria-live="polite"
    >
      <div className="h-3 w-3 animate-sync-pulse rounded-full bg-accent" aria-hidden="true" />
      <span className="text-meta text-ink-muted">{label}</span>
    </div>
  );
}