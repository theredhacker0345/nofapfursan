import { useState, type FormEvent } from "react";
import { Plus, Trash2, Loader2, AlertCircle, Wifi } from "lucide-react";
import { toast } from "sonner";

import { useNostrContext } from "@/context/NostrContext";
import { verifyRelay } from "@/services/nostr";
import { cn } from "@/lib/utils";

const hostOf = (url: string) => url.replace(/^wss?:\/\//, "").replace(/\/+$/, "");

export const RelaySettings = () => {
  const { relays, connectedRelays, relayMetadata, addRelay, removeRelay } = useNostrContext();
  const [newRelay, setNewRelay] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    const url = newRelay.trim();
    if (!url) return;

    if (!/^wss?:\/\//i.test(url)) {
      setError("Must start with wss:// (or ws:// for a local relay)");
      return;
    }

    setVerifying(true);
    setError(null);
    try {
      const health = await verifyRelay(url);
      if (!health.reachable) {
        setError("Could not open a connection to that relay");
        return;
      }
      await addRelay(url);
      setNewRelay("");
      toast.success(`Relay added — ${health.metadata?.name || hostOf(url)}`);
    } catch {
      setError("Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const handleRemove = async (url: string) => {
    const removed = await removeRelay(url);
    if (!removed) {
      toast.error("Fursan needs at least one relay to save your records.");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <span className="inline-flex items-center gap-2 text-body-s font-semibold text-ink">
          <Wifi className="h-4 w-4 text-ink-muted" aria-hidden="true" />
          Relay network
        </span>
        <span className="font-data text-meta text-ink-muted">
          {connectedRelays.length}/{relays.length} live
        </span>
      </div>

      <form onSubmit={handleAdd} className="border-b border-border px-5 py-4">
        <label htmlFor="relay-url" className="text-label uppercase text-ink-faint">
          Add a relay
        </label>
        <div className="mt-2 flex gap-2">
          <input
            id="relay-url"
            type="url"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            value={newRelay}
            onChange={(e) => {
              setNewRelay(e.target.value);
              if (error) setError(null);
            }}
            placeholder="wss://relay.example.com"
            disabled={verifying}
            aria-invalid={!!error}
            aria-describedby={error ? "relay-error" : undefined}
            className={cn(
              "h-11 min-w-0 flex-1 rounded-md border bg-surface-2 px-3 font-data text-data text-ink placeholder:text-ink-faint",
              error ? "border-danger" : "border-border",
            )}
          />
          <button
            type="submit"
            disabled={verifying || !newRelay.trim()}
            className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-md bg-ink px-4 text-label uppercase text-bg transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {verifying ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            Add
          </button>
        </div>
        {error && (
          <p
            id="relay-error"
            role="alert"
            className="mt-2 inline-flex items-center gap-1.5 text-meta text-danger"
          >
            <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}
      </form>

      <ul>
        {relays.map((url) => {
          const isConnected = connectedRelays.includes(url);
          const name = relayMetadata[url]?.name || hostOf(url);
          return (
            <li key={url} className="row">
              <span
                className={cn(
                  "h-2 w-2 shrink-0 rounded-full",
                  isConnected ? "bg-success" : "bg-danger",
                )}
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-body-s font-medium text-ink">{name}</span>
                <span className="block truncate font-data text-meta text-ink-muted">{hostOf(url)}</span>
              </span>
              <span className="sr-only">{isConnected ? "Connected" : "Not connected"}</span>
              <button
                type="button"
                aria-label={`Remove relay ${name}`}
                onClick={() => void handleRemove(url)}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-ink-faint transition-colors hover:bg-danger/5 hover:text-danger"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};