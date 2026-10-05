import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { Filter, Event, finalizeEvent } from "nostr-tools";
import { hexToBytes } from "@noble/hashes/utils";

import {
  getPool,
  getRelays,
  addRelay as addRelayToPool,
  removeRelay as removeRelayFromPool,
  publishEvent,
  initNetworkListener,
  getNetworkState,
  subscribeToNetworkState,
  setRelays,
  type NetworkState,
} from "@/services/nostr";

interface RelayMetadata {
  name?: string;
  description?: string;
  pubkey?: string;
  contact?: string;
  supported_nips?: number[];
  software?: string;
  version?: string;
}

interface UserMetadata {
  name?: string;
  display_name?: string;
  picture?: string;
}

interface NostrContextType {
  relays: string[];
  connectedRelays: string[];
  relayMetadata: Record<string, RelayMetadata>;
  profiles: Record<string, string>;
  network: NetworkState;
  addRelay: (url: string) => Promise<boolean>;
  removeRelay: (url: string) => Promise<boolean>;
  publish: (event: Event) => Promise<boolean>;
  subscribe: (filter: Filter, onEvent: (event: Event) => void) => () => void;
  updateProfileName: (newName: string, privateKey: string) => Promise<boolean>;
}

const NostrContext = createContext<NostrContextType | null>(null);

const METADATA_TIMEOUT_MS = 3000;

/** Kind-0 lookups are cached app-wide; a chat scroll must not refetch per row. */
const profileCache = new Map<string, string>();
const profilesInFlight = new Set<string>();

export const NostrProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [relays, setRelaysState] = useState<string[]>([]);
  const [connectedRelays, setConnectedRelays] = useState<string[]>([]);
  const [relayMetadata, setRelayMetadata] = useState<Record<string, RelayMetadata>>({});
  const [profiles, setProfiles] = useState<Record<string, string>>(() =>
    Object.fromEntries(profileCache),
  );
  const [network, setNetwork] = useState<NetworkState>(() => getNetworkState());

  const profilesRef = useRef(profiles);
  useEffect(() => {
    profilesRef.current = profiles;
  }, [profiles]);

  /* ── Relay list ────────────────────────────────────────────────────── */
  useEffect(() => {
    let cancelled = false;
    void getRelays().then((list) => {
      if (!cancelled) setRelaysState(list);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  /* ── Network + queue state ─────────────────────────────────────────── */
  useEffect(() => {
    void initNetworkListener();
    return subscribeToNetworkState((state) => setNetwork({ ...state }));
  }, []);

  /* ── Connection health ─────────────────────────────────────────────── */
  useEffect(() => {
    if (relays.length === 0) return;
    let cancelled = false;
    const pool = getPool();

    const check = async () => {
      const status = pool.listConnectionStatus();
      const connected = relays.filter((url) => status.get(url) === true);
      if (!cancelled) setConnectedRelays(connected);
    };

    void check();
    const id = setInterval(check, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [relays]);

  /* ── NIP-11 relay metadata ─────────────────────────────────────────── */
  useEffect(() => {
    if (relays.length === 0) return;
    let cancelled = false;
    const controller = new AbortController();

    for (const url of relays) {
      const httpUrl = url.replace(/^ws/, "http");
      const timer = setTimeout(() => controller.abort(), METADATA_TIMEOUT_MS);
      void fetch(httpUrl, {
        headers: { Accept: "application/nostr+json" },
        signal: controller.signal,
      })
        .then(async (res) => {
          clearTimeout(timer);
          if (!res.ok || cancelled) return;
          const data: RelayMetadata = await res.json();
          if (!cancelled) setRelayMetadata((prev) => ({ ...prev, [url]: data }));
        })
        .catch(() => {
          clearTimeout(timer);
        });
    }

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [relays]);

  /* ── Profile discovery ─────────────────────────────────────────────── */
  const resolveProfiles = useCallback(async (pubkeys: string[]) => {
    const unknown = [...new Set(pubkeys)].filter(
      (pk) => pk && !profileCache.has(pk) && !profilesInFlight.has(pk),
    );
    if (unknown.length === 0) return;

    const targets = await getRelays();
    if (targets.length === 0) return;

    const handle = getPool().subscribe(
      targets,
      { kinds: [0], authors: unknown } as Filter,
      {
        onevent: (event: Event) => {
          try {
            const data = JSON.parse(event.content) as UserMetadata;
            const name = data.display_name?.trim() || data.name?.trim() || "Anon";
            profileCache.set(event.pubkey, name);
            setProfiles((prev) => ({ ...prev, [event.pubkey]: name }));
          } catch {
            profileCache.set(event.pubkey, "Anon");
          }
        },
        oneose: () => handle.close(),
      },
    );

    for (const pk of unknown) profilesInFlight.add(pk);
    // Never let a silent relay pin these open forever.
    setTimeout(() => {
      handle.close();
      profilesInFlight.clear();
    }, METADATA_TIMEOUT_MS * 4);
  }, []);

  const subscribe = useCallback(
    (filter: Filter, onEvent: (event: Event) => void) => {
      if (!filter || relays.length === 0) return () => undefined;

      // Relays reject empty arrays and nulls outright.
      const clean = Array.isArray(filter) ? filter[0] : filter;
      const finalFilter = Object.fromEntries(
        Object.entries(clean).filter(([, v]) => v != null && (!Array.isArray(v) || v.length > 0)),
      ) as Filter;

      const handle = getPool().subscribe(relays, finalFilter, {
        onevent: (event: Event) => {
          if (event.kind === 1 && !profilesRef.current[event.pubkey]) {
            void resolveProfiles([event.pubkey]);
          }
          onEvent(event);
        },
      });

      return () => handle.close();
    },
    [relays, resolveProfiles],
  );

  const addRelay = useCallback(async (url: string) => {
    const next = await addRelayToPool(url);
    if (!next) return false;
    setRelaysState(next);
    return true;
  }, []);

  const removeRelay = useCallback(async (url: string) => {
    const { relays: next, removed } = await removeRelayFromPool(url);
    setRelaysState(next);
    return removed;
  }, []);

  const publish = useCallback(
    async (event: Event) => {
      const targets = connectedRelays.length > 0 ? connectedRelays : relays;
      if (targets.length === 0) return false;
      return publishEvent(event as never, targets);
    },
    [connectedRelays, relays],
  );

  const updateProfileName = useCallback(
    async (newName: string, privateKey: string) => {
      try {
        const sk = hexToBytes(privateKey);
        const signed = finalizeEvent(
          {
            kind: 0,
            created_at: Math.floor(Date.now() / 1000),
            tags: [],
            content: JSON.stringify({
              name: newName,
              display_name: newName,
              about: "Discipline over desire.",
            }),
          },
          sk,
        );
        const ok = await publishEvent(signed);
        if (ok) {
          profileCache.set(signed.pubkey, newName);
          setProfiles((prev) => ({ ...prev, [signed.pubkey]: newName }));
        }
        return ok;
      } catch (error) {
        console.error("[Nostr] Profile update failed", error);
        return false;
      }
    },
    [],
  );

  const value = useMemo<NostrContextType>(
    () => ({
      relays,
      connectedRelays,
      relayMetadata,
      profiles,
      network,
      addRelay,
      removeRelay,
      publish,
      subscribe,
      updateProfileName,
    }),
    [
      relays,
      connectedRelays,
      relayMetadata,
      profiles,
      network,
      addRelay,
      removeRelay,
      publish,
      subscribe,
      updateProfileName,
    ],
  );

  return <NostrContext.Provider value={value}>{children}</NostrContext.Provider>;
};

/* eslint-disable react-refresh/only-export-components -- context + its consumer hook
   belong together; splitting them only hides the dependency. */
export const useNostrContext = () => {
  const context = useContext(NostrContext);
  if (!context) throw new Error("useNostrContext must be used within NostrProvider");
  return context;
};

/** Reads the live sync/queue state without subscribing to the whole context. */
export const useNetworkStatus = () => {
  const [state, setState] = useState<NetworkState>(() => getNetworkState());
  useEffect(() => subscribeToNetworkState((next) => setState({ ...next })), []);
  return state;
};

// Referenced so the helper stays tree-shake-safe if callers stop using setRelays.
export { setRelays };
/* eslint-enable react-refresh/only-export-components */
