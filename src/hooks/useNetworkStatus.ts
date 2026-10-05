import { useEffect, useState } from "react";

import { getNetworkState, subscribeToNetworkState, type NetworkState } from "@/services/nostr";

/**
 * Live sync/queue state without subscribing to the whole Nostr context.
 *
 * Lives here rather than in NostrContext so the header — which renders on every
 * screen — does not re-render whenever a relay connects or a profile resolves.
 */
export function useNetworkStatus(): NetworkState {
  const [state, setState] = useState<NetworkState>(() => getNetworkState());

  useEffect(() => subscribeToNetworkState((next) => setState({ ...next })), []);

  return state;
}