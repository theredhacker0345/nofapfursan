import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { KeyRound, Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { Logo } from "@/components/Logo";
import { importKey, generateOrLoadKeys } from "@/services/nostr";
import { APP_VERSION } from "@/data/version";

/**
 * "Generate a fresh identity" is the primary action — it is what a new user
 * needs. Importing an nsec is the secondary path, and it now carries the
 * warning it always should have: the key is unrecoverable and it replaces
 * whatever identity is currently on the device.
 */
export default function Auth() {
  const navigate = useNavigate();
  const [nsec, setNsec] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [busy, setBusy] = useState<null | "import" | "generate">(null);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setBusy("generate");
    setError(null);
    try {
      await generateOrLoadKeys();
      toast.success("Identity ready", {
        description: "Your key never leaves this device.",
      });
      navigate("/");
    } catch (err) {
      console.error("[Auth] Generate failed", err);
      setError("Could not create an identity. Device storage may be unavailable.");
    } finally {
      setBusy(null);
    }
  };

  const runImport = async () => {
    setBusy("import");
    setError(null);
    try {
      const ok = await importKey(nsec);
      if (!ok) throw new Error("Rejected");
      toast.success("Identity restored");
      navigate("/");
    } catch (err) {
      console.error("[Auth] Import failed", err);
      setError("That is not a valid nsec. Check the characters and try again.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-bg px-5 py-12">
      <div className="w-full max-w-content">
        <Link
          to="/"
          aria-label="Back to today"
          className="inline-flex h-11 items-center gap-1.5 rounded-md px-1 text-label uppercase text-ink-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Back
        </Link>

        <div className="mt-6 flex flex-col items-center gap-3 text-center">
          <Logo size={40} showWordmark={false} />
          <h1 className="text-display-l font-semibold text-ink">Set up Fursan</h1>
          <p className="max-w-prose text-body-s text-ink-muted">
            There is no account. Fursan generates a cryptographic identity on this
            device and encrypts everything you write with it.
          </p>
        </div>

        <div className="card mt-8 p-5">
          <button
            type="button"
            onClick={() => void generate()}
            disabled={busy !== null}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-ink text-label uppercase text-bg transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {busy === "generate" ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <KeyRound className="h-4 w-4" aria-hidden="true" />
            )}
            Create a new identity
          </button>

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" aria-hidden="true" />
            <span className="text-label uppercase text-ink-faint">or restore</span>
            <span className="h-px flex-1 bg-border" aria-hidden="true" />
          </div>

          <label htmlFor="nsec" className="text-label uppercase text-ink-faint">
            Your nsec
          </label>
          <div className="relative mt-2">
            <input
              id="nsec"
              type={revealed ? "text" : "password"}
              value={nsec}
              autoComplete="off"
              spellCheck={false}
              onChange={(e) => {
                setNsec(e.target.value);
                if (error) setError(null);
              }}
              placeholder="nsec1…"
              aria-describedby={error ? "auth-error" : "auth-hint"}
              className="h-12 w-full rounded-md border border-border bg-surface-2 px-3 pr-12 font-data text-data text-ink placeholder:text-ink-faint"
            />
            <button
              type="button"
              onClick={() => setRevealed((v) => !v)}
              aria-label={revealed ? "Hide the key" : "Show the key"}
              className="absolute right-0 top-0 inline-flex h-12 w-12 items-center justify-center rounded-md text-ink-faint transition-colors hover:text-ink"
            >
              {revealed ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>

          <p id="auth-hint" className="mt-2 text-meta text-ink-muted">
            Your key never leaves this device. Fursan cannot recover it for you — if you
            lose it, the streak stays on the relays but only that key can read it.
          </p>

          {error && (
            <p
              id="auth-error"
              role="alert"
              className="mt-2 text-meta text-danger"
            >
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={() => void runImport()}
            disabled={busy !== null || !nsec.trim()}
            className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md border border-border text-label uppercase text-ink transition-colors hover:bg-surface-2 disabled:opacity-40"
          >
            {busy === "import" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            Restore this identity
          </button>
        </div>

        <p className="mt-8 text-center font-data text-meta text-ink-faint">
          Fursan {APP_VERSION}
        </p>
      </div>
    </div>
  );
}