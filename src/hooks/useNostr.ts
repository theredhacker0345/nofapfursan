import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { Event, Filter } from "nostr-tools";
import { useNostrContext } from "../context/NostrContext";

/**
 * Thin subscription helper. `setProfiles` and the raw pool were removed from
 * the context — profile resolution is centralised there, and callers reach the
 * pool through `getPool()` in the service layer.
 */
export const useNostr = () => {
  const { subscribe: contextSubscribe, publish: contextPublish, connectedRelays, profiles, updateProfileName } =
    useNostrContext();

  const [events, setEvents] = useState<Event[]>([]);
  const active = useRef(false);

  const reset = useCallback(() => setEvents([]), []);

  const subscribe = useCallback(
    (filter: Filter) => {
      if (active.current) return () => undefined;
      active.current = true;
      setEvents([]);

      const close = contextSubscribe(filter, (event: Event) => {
        setEvents((prev) => {
          if (prev.some((e) => e.id === event.id)) return prev;
          const next = [...prev, event].sort((a, b) => b.created_at - a.created_at);
          return next.length > 500 ? next.slice(0, 500) : next;
        });
      });

      return () => {
        active.current = false;
        close();
      };
    },
    [contextSubscribe],
  );

  // A filter change must tear the old subscription down, not orphan it.
  const [filterKey, setFilterKey] = useState("");
  useEffect(() => () => reset(), [reset]);

  const publish = useCallback((event: Event) => contextPublish(event), [contextPublish]);

  return useMemo(
    () => ({
      events,
      subscribe,
      publish,
      reset,
      connectedRelays,
      profiles,
      updateProfileName,
      filterKey,
      setFilterKey,
    }),
    [events, subscribe, publish, reset, connectedRelays, profiles, updateProfileName, filterKey],
  );
};