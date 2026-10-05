import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { Logo } from "@/components/Logo";
import { APP_VERSION } from "@/data/version";

/** Share card. Previously titled with a class (`text-gradient-fire`) that exists nowhere. */
export default function Join() {
  const [params] = useSearchParams();
  const raw = params.get("streak");
  const streak = raw && /^\d{1,4}$/.test(raw) ? Number(raw) : null;

  useEffect(() => {
    document.title = streak
      ? `${streak}-day challenge · Fursan`
      : "You have been invited · Fursan";
    return () => {
      document.title = "Fursan";
    };
  }, [streak]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-bg px-5 py-16">
      <article className="w-full max-w-content text-center">
        <Logo size={32} showWordmark={false} />

        <p className="mt-6 text-label uppercase text-ink-faint">A challenge from your Vanguard</p>
        <h1 className="mt-2 text-display-l font-semibold text-ink">You have been invited.</h1>

        {streak !== null && (
          <div className="mx-auto mt-8 max-w-[280px] rounded-lg border border-border bg-surface px-6 py-8">
            <p className="font-display text-display-xl font-bold tabular text-ink">{streak}</p>
            <p className="mt-1 text-label uppercase text-ink-muted">
              {streak === 1 ? "day held" : "days held"}
            </p>
          </div>
        )}

        <p className="mx-auto mt-8 max-w-prose text-body text-ink-muted">
          Fursan is a private streak tracker. No account, no ads, no trackers — your
          records live on your device and sync encrypted through the Nostr network.
        </p>

        <Link
          to="/"
          className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-ink px-8 text-label uppercase text-bg transition-opacity hover:opacity-90"
        >
          Accept the challenge
        </Link>

        <p className="mt-10 font-data text-meta text-ink-faint">Fursan {APP_VERSION}</p>
      </article>
    </div>
  );
}