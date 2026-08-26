/**
 * Nostr-based Private Persistence Layer with Offline Queue
 * 
 * This service implements:
 * - NIP-44 encryption for private streak data
 * - Key management using @capacitor/preferences
 * - Publishing encrypted notes to relays
 * - Fetching and decrypting streak data
 * - OFFLINE QUEUE: Stores events when offline, auto-syncs when back online
 */

import { Preferences } from "@capacitor/preferences";
import { Network, ConnectionStatus } from "@capacitor/network";
import {
    generateSecretKey,
    getPublicKey,
    finalizeEvent,
    SimplePool,
    VerifiedEvent,
    nip19,
    nip44,
} from "nostr-tools";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";

// Relay configuration - multiple relays for redundancy
export const RELAYS = ["wss://nos.lol", "wss://relay.damus.io", "wss://relay.snort.social"];
const DEFAULT_RELAYS = RELAYS;

// Minimum number of relay acknowledgments needed for success
const MIN_RELAY_CONFIRMATIONS = 1;

const pool = new SimplePool();

/**
 * Get the current relay list, including user-defined ones
 */
async function getRelays(): Promise<string[]> {
    try {
        const { value } = await Preferences.get({ key: 'user_relays' });
        if (value) {
            return JSON.parse(value);
        }
    } catch (e) {
        // Corrupted relay list - fall back to defaults below
    }
    return RELAYS;
}

// Private kind for encrypted streak data (NIP-78)
const STREAK_CLOUD_KIND = 30078;
const STREAK_CLOUD_D_TAG = "nofapfursan-streak";

// Storage key for pending offline events
const PENDING_SYNC_KEY = "pending_sync";

// ============================================================================
// TYPES
// ============================================================================

export interface StreakPayload {
    days: number;
    startDate: string | null;
    longestStreak: number;
    totalRelapses: number;
    timestamp: number;
}

export interface NostrKeys {
    privateKey: Uint8Array;
    publicKey: string;
    privateKeyHex: string;
}

export interface PendingEvent {
    id: string;
    signedEvent: VerifiedEvent;
    createdAt: number;
    retryCount: number;
}

export interface NetworkState {
    isOnline: boolean;
    isSyncing: boolean;
    pendingCount: number;
}

// ============================================================================
// NETWORK STATE MANAGEMENT
// ============================================================================

// Global network state
let networkState: NetworkState = {
    isOnline: true,
    isSyncing: false,
    pendingCount: 0,
};

// Subscribers for network state changes
type NetworkStateListener = (state: NetworkState) => void;
const networkStateListeners: Set<NetworkStateListener> = new Set();

/**
 * Subscribe to network state changes
 */
export function subscribeToNetworkState(listener: NetworkStateListener): () => void {
    networkStateListeners.add(listener);
    // Immediately notify with current state
    listener(networkState);

    return () => {
        networkStateListeners.delete(listener);
    };
}

/**
 * Update network state and notify all listeners
 */
function updateNetworkState(updates: Partial<NetworkState>): void {
    networkState = { ...networkState, ...updates };
    networkStateListeners.forEach((listener) => listener(networkState));
}

/**
 * Get current network state
 */
export function getNetworkState(): NetworkState {
    return { ...networkState };
}

// ============================================================================
// OFFLINE QUEUE MANAGEMENT
// ============================================================================

/**
 * Get pending events from storage
 */
async function getPendingEvents(): Promise<PendingEvent[]> {
    try {
        const { value } = await Preferences.get({ key: PENDING_SYNC_KEY });
        if (value) {
            return JSON.parse(value);
        }
    } catch (error) {
        console.error("[Nostr] Error reading pending events:", error);
    }
    return [];
}

/**
 * Save pending events to storage
 */
async function savePendingEvents(events: PendingEvent[]): Promise<void> {
    await Preferences.set({
        key: PENDING_SYNC_KEY,
        value: JSON.stringify(events),
    });
    updateNetworkState({ pendingCount: events.length });
}

/**
 * Add an event to the offline queue
 */
async function queueEvent(signedEvent: VerifiedEvent): Promise<void> {
    const pending = await getPendingEvents();

    // Check for duplicate (by event id)
    if (pending.some((e) => e.id === signedEvent.id)) {
        console.log("[Nostr] Event already in queue, skipping:", signedEvent.id);
        return;
    }

    const newEvent: PendingEvent = {
        id: signedEvent.id,
        signedEvent,
        createdAt: Date.now(),
        retryCount: 0,
    };

    pending.push(newEvent);
    await savePendingEvents(pending);

    console.log("[Nostr] Event queued for offline sync:", signedEvent.id);
    console.log("[Nostr] Pending queue size:", pending.length);
}

/**
 * Remove an event from the queue after successful publish
 */
async function removeFromQueue(eventId: string): Promise<void> {
    const pending = await getPendingEvents();
    const filtered = pending.filter((e) => e.id !== eventId);
    await savePendingEvents(filtered);
}

/**
 * Flush all pending events to relays
 */
async function flushPendingEvents(): Promise<void> {
    const pending = await getPendingEvents();

    if (pending.length === 0) {
        console.log("[Nostr] No pending events to flush");
        return;
    }

    console.log(`[Nostr] Flushing ${pending.length} pending events...`);
    updateNetworkState({ isSyncing: true });

    for (const pendingEvent of pending) {
        try {
            const success = await resilientPublish(pendingEvent.signedEvent);

            if (success) {
                console.log("[FURSAN-DEBUG]: Nostr Event Published (from queue)", pendingEvent.signedEvent.id);
                console.log("[Nostr] Flushed queued event:", pendingEvent.signedEvent.id);
                await removeFromQueue(pendingEvent.id);
            } else {
                console.error("[Nostr] Failed to flush event (no relay confirmations):", pendingEvent.id);
                pendingEvent.retryCount++;
            }
        } catch (error) {
            console.error("[Nostr] Failed to flush event:", pendingEvent.id, error);
            pendingEvent.retryCount++;
        }
    }

    updateNetworkState({ isSyncing: false });

    // Update pending count after flush
    const remaining = await getPendingEvents();
    updateNetworkState({ pendingCount: remaining.length });

    console.log("[Nostr] Flush complete. Remaining:", remaining.length);
}

// ============================================================================
// RESILIENT PUBLISH
// ============================================================================

interface RelayResult {
    relay: string;
    success: boolean;
    error?: string;
}

/**
 * Publish to multiple relays with fault tolerance.
 * Success is determined by at least one relay acknowledgment (Promise.any style).
 */
async function resilientPublish(signedEvent: VerifiedEvent): Promise<boolean> {
    const currentRelays = await getRelays();
    const results: RelayResult[] = [];

    try {
        // Create individual promises for each relay
        const relayPromises = currentRelays.map(async (relay): Promise<RelayResult> => {
            try {
                // SimplePool.publish returns an array of promises for each relay
                // We need to handle each relay individually for better error handling
                const promise = pool.publish([relay], signedEvent);
                await Promise.race([
                    Promise.all(promise),
                    // Timeout after 10 seconds per relay
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error("Timeout")), 10000)
                    )
                ]);

                return { relay, success: true };
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Unknown error";
                console.warn(`[Nostr] Relay ${relay} failed:`, errorMessage);
                return { relay, success: false, error: errorMessage };
            }
        });

        // Wait for all relay attempts to complete (don't fail early)
        const allResults = await Promise.allSettled(relayPromises);

        // Process results
        for (const result of allResults) {
            if (result.status === "fulfilled") {
                results.push(result.value);
            } else {
                // This shouldn't happen since we catch errors inside, but handle it
                results.push({ relay: "unknown", success: false, error: result.reason });
            }
        }

        // Count successful relays
        const successfulRelays = results.filter(r => r.success);
        const failedRelays = results.filter(r => !r.success);

        // Log detailed results
        console.log(`[Nostr] Publish results: ${successfulRelays.length}/${currentRelays.length} relays succeeded`);

        if (successfulRelays.length > 0) {
            console.log("[Nostr] ✓ Successful relays:", successfulRelays.map(r => r.relay).join(", "));
        }

        if (failedRelays.length > 0) {
            console.log("[Nostr] ✗ Failed relays:", failedRelays.map(r => `${r.relay} (${r.error})`).join(", "));
        }

        // Success if at least MIN_RELAY_CONFIRMATIONS relays acknowledged
        return successfulRelays.length >= MIN_RELAY_CONFIRMATIONS;

    } catch (e) {
        console.error("[Nostr] Fatal error in resilientPublish:", e);
        return false;
    }
}

// ============================================================================
// NETWORK LISTENER
// ============================================================================

let networkListenerInitialized = false;

/**
 * Initialize network status listener
 */
export async function initNetworkListener(): Promise<void> {
    if (networkListenerInitialized) {
        return;
    }

    networkListenerInitialized = true;

    // Get initial network status
    try {
        const status = await Network.getStatus();
        updateNetworkState({ isOnline: status.connected });
        console.log("[Nostr] Initial network status:", status.connected ? "online" : "offline");

        // Flush any pending events if we're online at startup
        if (status.connected) {
            const pending = await getPendingEvents();
            updateNetworkState({ pendingCount: pending.length });

            if (pending.length > 0) {
                console.log("[Nostr] Found pending events on startup, flushing...");
                await flushPendingEvents();
            }
        }
    } catch (error) {
        console.error("[Nostr] Error getting initial network status:", error);
        // Assume online if we can't check
        updateNetworkState({ isOnline: true });
    }

    // Listen for network changes
    Network.addListener("networkStatusChange", async (status: ConnectionStatus) => {
        const wasOffline = !networkState.isOnline;
        const isNowOnline = status.connected;

        console.log("[Nostr] Network status changed:", isNowOnline ? "online" : "offline");
        updateNetworkState({ isOnline: isNowOnline });

        // If we just came back online, flush pending events
        if (wasOffline && isNowOnline) {
            console.log("[Nostr] Connection restored! Flushing pending events...");
            await flushPendingEvents();
        }
    });

    console.log("[Nostr] Network listener initialized");
}

// ============================================================================
// KEY MANAGEMENT - FORTRESS PROTOCOL
// ============================================================================

import { SecureStorage } from "./secureStorage";

/**
 * Generate new Nostr keys or load existing ones from Secure Storage
 */
export async function generateOrLoadKeys(): Promise<NostrKeys> {
    try {
        // 1. MIGRATION PHASE: Check for legacy keys in insecure storage
        // We check common legacy keys and consolidate them to 'user_nsec' in SecureStorage
        await SecureStorage.migrateFromInsecure('user_private_key');
        await SecureStorage.migrateFromInsecure('nostr_private_key');

        // Also check if they are in Preferences but under old keys, and migrate to standard 'user_nsec'
        // (only when no active identity exists yet, so imports are never clobbered)
        const existingNsec = await SecureStorage.get('user_nsec');
        if (!existingNsec) {
            const oldPrefKey = await SecureStorage.get('user_private_key');
            if (oldPrefKey) {
                await SecureStorage.set('user_nsec', oldPrefKey);
                await SecureStorage.remove('user_private_key');
            }

            const oldPrefKey2 = await SecureStorage.get('nostr_private_key');
            if (oldPrefKey2) {
                await SecureStorage.set('user_nsec', oldPrefKey2);
                await SecureStorage.remove('nostr_private_key');
            }
        }

        // 2. LOAD PHASE: Try to get the standard key from Secure Storage
        const value = await SecureStorage.get('user_nsec');

        if (value) {
            // console.log("[FURSAN] Fortress Identity Loaded."); // Commented out for max privacy logs
            const privKey = hexToBytes(value);
            return {
                privateKey: privKey,
                publicKey: getPublicKey(privKey),
                privateKeyHex: value
            };
        }

        // 3. GENERATION PHASE: Create new identity if none exists
        const newKey = generateSecretKey();
        const hex = bytesToHex(newKey);
        await SecureStorage.set('user_nsec', hex);

        console.log("[FURSAN] New Fortress Identity Created.");
        return {
            privateKey: newKey,
            publicKey: getPublicKey(newKey),
            privateKeyHex: hex
        };
    } catch (error) {
        console.error("[Nostr] Critical Identity Error:", error);
        throw error;
    }
}

/**
 * Check if keys exist in Secure Storage
 */
export async function hasKeys(): Promise<boolean> {
    const value = await SecureStorage.get('user_nsec');
    return !!value;
}

/**
 * Clear stored keys (PANIC BUTTON USE ONLY)
 */
export async function clearKeys(): Promise<void> {
    await SecureStorage.remove('user_nsec');
    // Double tap to be sure
    await SecureStorage.remove('user_private_key');
    await SecureStorage.remove('nostr_private_key');
    localStorage.clear(); // NUKE LOCAL STORAGE
}

/**
 * Export keys in NIP-19 format
 */
export async function exportKeys(): Promise<{ nsec: string; npub: string } | null> {
    try {
        const keys = await generateOrLoadKeys();

        // Encode to NIP-19
        const nsec = nip19.nsecEncode(keys.privateKey);
        const npub = nip19.npubEncode(keys.publicKey);

        return { nsec, npub };
    } catch (error) {
        console.error("[Nostr] Failed to export keys:", error);
        return null;
    }
}

/**
 * Import an identity from an nsec string
 */
export async function importKey(nsec: string): Promise<boolean> {
    try {
        // Decode and validate
        const { type, data } = nip19.decode(nsec);

        if (type !== 'nsec') {
            throw new Error("Invalid key type. Expected 'nsec'.");
        }

        const privateKey = data as Uint8Array;
        const privateKeyHex = bytesToHex(privateKey);
        const publicKey = getPublicKey(privateKey);

        // Save new identity directly to the active fortress key so it takes
        // effect immediately on the next identity load
        await SecureStorage.set('user_nsec', privateKeyHex);
        await SecureStorage.remove('nostr_private_key');
        await SecureStorage.remove('user_private_key');

        // Reset any state if necessary
        networkState = {
            isOnline: networkState.isOnline,
            isSyncing: false,
            pendingCount: 0
        };

        console.log("[Nostr] Imported new identity:", publicKey);
        return true;
    } catch (error) {
        console.error("[Nostr] Failed to import key:", error);
        throw error;
    }
}

// Re-export nip19 for UI components
export { nip19 };

// ============================================================================
// ENCRYPTION/DECRYPTION
// ============================================================================

/**
 * Encrypt streak data using NIP-44
 */
function encryptStreakData(
    data: StreakPayload,
    privateKey: Uint8Array,
    publicKey: string
): string {
    const plaintext = JSON.stringify(data);
    const conversationKey = nip44.v2.utils.getConversationKey(
        privateKey,
        publicKey
    );
    return nip44.v2.encrypt(plaintext, conversationKey);
}

/**
 * Decrypt streak data using NIP-44
 */
function decryptStreakData(
    ciphertext: string,
    privateKey: Uint8Array,
    publicKey: string
): StreakPayload | null {
    try {
        const conversationKey = nip44.v2.utils.getConversationKey(
            privateKey,
            publicKey
        );
        const plaintext = nip44.v2.decrypt(ciphertext, conversationKey);
        return JSON.parse(plaintext);
    } catch (error) {
        console.error("[Nostr] Failed to decrypt streak data:", error);
        return null;
    }
}

// ============================================================================
// MAIN API
// ============================================================================

/**
 * Save streak data to Nostr relays using Kind 30078 (NIP-78)
 */
export async function saveStreak(streakData: StreakPayload): Promise<boolean> {
    try {
        const keys = await generateOrLoadKeys();

        // Encrypt the streak data
        const encryptedContent = encryptStreakData(
            streakData,
            keys.privateKey,
            keys.publicKey
        );

        // Create the event (Kind 30078)
        const eventTemplate = {
            kind: STREAK_CLOUD_KIND,
            created_at: Math.floor(Date.now() / 1000),
            tags: [
                ["d", STREAK_CLOUD_D_TAG],
                ["t", "nofapfursan"],
                ["encrypted", "nip44"],
            ],
            content: encryptedContent,
        };

        // Sign the event
        const signedEvent = finalizeEvent(eventTemplate, keys.privateKey);

        // Check network status
        if (!networkState.isOnline) {
            console.log("[Nostr] Offline - queueing cloud sync for later");
            await queueEvent(signedEvent);
            return true;
        }

        const success = await resilientPublish(signedEvent);

        if (success) {
            console.log("[Nostr] Streak synced to cloud (Kind 30078):", signedEvent.id);
            return true;
        } else {
            console.warn("[Nostr] Relay publish failed, queueing for later");
            await queueEvent(signedEvent);
            return true;
        }
    } catch (error) {
        console.error("[Nostr] Error saving streak:", error);
        return false;
    }
}

/**
 * Fetch the latest streak data from Nostr relays (Kind 30078)
 */
export async function fetchStreak(): Promise<StreakPayload | null> {
    if (!networkState.isOnline) return null;

    try {
        const keys = await generateOrLoadKeys();
        const currentRelays = await getRelays();

        const filter = {
            kinds: [STREAK_CLOUD_KIND],
            authors: [keys.publicKey],
            "#d": [STREAK_CLOUD_D_TAG],
            limit: 1,
        };

        const events = await pool.querySync(currentRelays, filter);

        if (events.length === 0) {
            console.log("[Nostr] No cloud streak data found (Kind 30078)");
            return null;
        }

        const latestEvent = events[0];
        const streakData = decryptStreakData(
            latestEvent.content,
            keys.privateKey,
            keys.publicKey
        );

        return streakData;
    } catch (error) {
        console.error("[Nostr] Error fetching streak from cloud:", error);
        return null;
    }
}

/**
 * Sync local streak with relay - fetches remote and merges smartly
 */
export async function syncStreak(
    localStreak: StreakPayload
): Promise<StreakPayload> {
    const remoteStreak = await fetchStreak();

    if (!remoteStreak) {
        await saveStreak(localStreak);
        return localStreak;
    }

    const merged: StreakPayload = {
        days: Math.max(localStreak.days, remoteStreak.days),
        startDate:
            localStreak.timestamp > remoteStreak.timestamp
                ? localStreak.startDate
                : remoteStreak.startDate,
        longestStreak: Math.max(
            localStreak.longestStreak,
            remoteStreak.longestStreak
        ),
        totalRelapses: Math.max(
            localStreak.totalRelapses,
            remoteStreak.totalRelapses
        ),
        timestamp: Math.max(localStreak.timestamp, remoteStreak.timestamp),
    };

    if (merged.timestamp > remoteStreak.timestamp) {
        await saveStreak(merged);
    }

    return merged;
}

/**
 * Get the user's public key (npub) for display
 */
export async function getPublicKeyNpub(): Promise<string | null> {
    try {
        const keys = await generateOrLoadKeys();
        return keys.publicKey;
    } catch {
        return null;
    }
}

/**
 * Manually trigger a flush of pending events
 */
export async function manualFlush(): Promise<void> {
    if (networkState.isOnline) {
        await flushPendingEvents();
    } else {
        console.log("[Nostr] Cannot flush - still offline");
    }
}

/**
 * Get count of pending events
 */
export async function getPendingCount(): Promise<number> {
    const pending = await getPendingEvents();
    return pending.length;
}

// ============================================================================
// HEALTH CHECK FEATURE
// ============================================================================

export interface HealthCheck {
    id?: string;
    npt: boolean; // Did you wake up with NPT?
    mindset: 'sharp' | 'foggy' | 'stormy';
    timestamp: number;
}

const HEALTH_CHECK_TAG = "nofapfursan-health";

/**
 * Save an encrypted health check entry
 */
export async function saveHealthCheck(entry: HealthCheck): Promise<boolean> {
    try {
        const keys = await generateOrLoadKeys();

        // Encrypt the JSON entry
        const plaintext = JSON.stringify(entry);
        const conversationKey = nip44.v2.utils.getConversationKey(keys.privateKey, keys.publicKey);
        const ciphertext = nip44.v2.encrypt(plaintext, conversationKey);

        const eventTemplate = {
            kind: 1, // Using kind 1 with a specific tag for health logs
            created_at: Math.floor(Date.now() / 1000),
            tags: [
                ["t", HEALTH_CHECK_TAG],
                ["encrypted", "nip44"],
            ],
            content: ciphertext,
        };

        const signedEvent = finalizeEvent(eventTemplate, keys.privateKey);

        if (!networkState.isOnline) {
            await queueEvent(signedEvent);
            return true;
        }

        const success = await resilientPublish(signedEvent);
        if (!success) {
            await queueEvent(signedEvent);
        }

        return true;
    } catch (error) {
        console.error("Failed to save health check:", error);
        return false;
    }
}

/**
 * Fetch health check entries
 */
export async function fetchHealthChecks(): Promise<HealthCheck[]> {
    if (!networkState.isOnline) return [];

    try {
        const keys = await generateOrLoadKeys();
        const currentRelays = await getRelays();

        const filter = {
            kinds: [1],
            authors: [keys.publicKey],
            "#t": [HEALTH_CHECK_TAG],
            limit: 100, // Fetch enough to cover more than 14 days
        };

        const events = await pool.querySync(currentRelays, filter);
        const entries: HealthCheck[] = [];
        const conversationKey = nip44.v2.utils.getConversationKey(keys.privateKey, keys.publicKey);

        for (const event of events) {
            try {
                const plaintext = nip44.v2.decrypt(event.content, conversationKey);
                const data = JSON.parse(plaintext);
                entries.push({ ...data, id: event.id });
            } catch (e) {
                console.warn("Failed to decrypt health check", event.id);
            }
        }

        return entries.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
        console.error("Failed to fetch health checks:", error);
        return [];
    }
}

// ============================================================================
// JOURNAL FEATURE
// ============================================================================

export interface JournalEntry {
    id?: string;
    content: string; // "Learnings"
    mood: number; // 1-10
    energy: number; // 1-10
    timestamp: number;
}

const JOURNAL_TAG = "nofapfursan-journal";

/**
 * Save an encrypted journal entry
 */
export async function saveJournalEntry(entry: JournalEntry): Promise<boolean> {
    try {
        const keys = await generateOrLoadKeys();

        // Encrypt the JSON entry
        const plaintext = JSON.stringify(entry);
        const conversationKey = nip44.v2.utils.getConversationKey(keys.privateKey, keys.publicKey);
        const ciphertext = nip44.v2.encrypt(plaintext, conversationKey);

        const eventTemplate = {
            kind: 1, // Standard note, but encrypted content
            created_at: Math.floor(Date.now() / 1000),
            tags: [
                ["t", JOURNAL_TAG],
                ["encrypted", "nip44"],
            ],
            content: ciphertext,
        };

        const signedEvent = finalizeEvent(eventTemplate, keys.privateKey);

        if (!networkState.isOnline) {
            await queueEvent(signedEvent);
            return true;
        }

        const success = await resilientPublish(signedEvent);
        if (!success) {
            await queueEvent(signedEvent);
        }

        return true;
    } catch (error) {
        console.error("Failed to save journal entry:", error);
        return false;
    }
}

/**
 * Fetch journal entries
 */
export async function fetchJournalEntries(): Promise<JournalEntry[]> {
    if (!networkState.isOnline) return [];

    try {
        const keys = await generateOrLoadKeys();
        const currentRelays = await getRelays();

        try {
            const filter = {
                kinds: [1],
                authors: [keys.publicKey],
                "#t": [JOURNAL_TAG],
                limit: 50,
            };

            const events = await pool.querySync(currentRelays, filter);
            const entries: JournalEntry[] = [];
            const conversationKey = nip44.v2.utils.getConversationKey(keys.privateKey, keys.publicKey);

            for (const event of events) {
                try {
                    const plaintext = nip44.v2.decrypt(event.content, conversationKey);
                    const data = JSON.parse(plaintext);
                    entries.push({ ...data, id: event.id });
                } catch (e) {
                    console.warn("Failed to decrypt journal entry", event.id);
                }
            }

            return entries.sort((a, b) => b.timestamp - a.timestamp);
        } finally {
            // pool.close(RELAYS);
        }
    } catch (error) {
        console.error("Failed to fetch journal entries:", error);
        return [];
    }
}
// End of Nostr Service
