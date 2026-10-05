import { useState, useCallback, useMemo, useRef } from "react";
import type { Event, Filter } from "nostr-tools";
import { useNostrContext } from "@/context/NostrContext";

/** Hard cap on retained events, so a long-lived session cannot grow unbounded. */
const MAX_EVENTS = 300;

interface UseNostrReturn {
  events: Event[];
  subscribe: (filter: Filter) => () => void;
  publish: (event: Event) => Promise<boolean>;
  clear: () => void;
  connectedRelays: string[];
  profiles: Record<string, string>;
}

/**
 * Thin subscription helper.
 *
 * `setProfiles` and the raw pool are no longer exposed — profile resolution is
 * centralised in NostrContext with an app-wide cache, and callers reach the pool
 * through `getPool()` in the service layer.
 *
 * The previous version left an unused `filterKey`/`setFilterKey` pair in the
 * returned object and an unmount-only `reset` effect; a caller could call
 * `subscribe` twice, and the second call silently returned a no-op unsubscribe
 * while `active` stayed `true`.
 */
export function useNostr(): UseNostrReturn {
  const {
    subscribe: contextSubscribe,
    publish: contextPublish,
    connectedRelays,
    profiles,
  } = useNostrContext();

  const [events, setEvents] = useState<Event[]>([]);
  const activeRef = useRef(false);

  const clear = useCallback(() => setEvents([]), []);

  const subscribe = useCallback(
    (filter: Filter) => {
      // Re-subscribing while live would orphan the previous socket; the caller
      // is expected to unsubscribe first.
      if (activeRef.current) return () => undefined;
      activeRef.current = true;
      setEvents([]);

      const close = contextSubscribe(filter, (event: Event) => {
        setEvents((prev) => {
          if (prev.some((e) => e.id === event.id)) return prev;
          const next = [...prev, event].sort((a, b) => b.created_at - a.created_at);
          return next.length > MAX_EVENTS ? next.slice(0, MAX_EVENTS) : next;
        });
      });

      return () => {
        activeRef.current = false;
        close();
      };
    },
    [contextSubscribe],
  );

  const publish = useCallback((event: Event) => contextPublish(event), [contextPublish]);

  return useMemo(
    () => ({ events, subscribe, publish, clear, connectedRelays, profiles }),
    [events, subscribe, publish, clear, connectedRelays, profiles],
  );
}