import {
    Coordinates,
    CalculationMethod,
    PrayerTimes as AdhanPrayerTimes,
    SunnahTimes,
    Prayer as AdhanPrayer,
    Madhab
} from 'adhan';
import { Geolocation } from '@capacitor/geolocation';

const STORAGE_KEY = 'fursan_prayer_checkins';
const METHOD_STORAGE_KEY = 'fursan_prayer_method';
const MADHAB_STORAGE_KEY = 'fursan_prayer_madhab';
const LOCATION_MODE_KEY = 'fursan_location_mode';
const MANUAL_LAT_KEY = 'fursan_manual_lat';
const MANUAL_LNG_KEY = 'fursan_manual_lng';
const MANUAL_TZ_KEY = 'fursan_manual_timezone';
const MANUAL_CITY_KEY = 'fursan_manual_city';

export const CALCULATION_METHODS = [
    { id: 'MuslimWorldLeague', name: 'Muslim World League' },
    { id: 'Egyptian', name: 'Egyptian General Authority of Survey' },
    { id: 'Karachi', name: 'University of Islamic Sciences, Karachi' },
    { id: 'UmmAlQura', name: 'Umm al-Qura University, Makkah' },
    { id: 'Dubai', name: 'Dubai' },
    { id: 'MoonsightingCommittee', name: 'Moonsighting Committee' },
    { id: 'NorthAmerica', name: 'ISNA (North America)' },
    { id: 'Kuwait', name: 'Kuwait' },
    { id: 'Qatar', name: 'Qatar' },
    { id: 'Singapore', name: 'Singapore' },
    { id: 'Turkey', name: 'Turkey' },
    { id: 'Tehran', name: 'Institute of Geophysics, University of Tehran' },
];

export const MADHABS = [
    { id: 'Shafi', name: 'Shafi / Maliki / Hanbali' },
    { id: 'Hanafi', name: 'Hanafi' },
];

export interface PrayerTimes {
    Fajr: Date;
    Sunrise: Date;
    Dhuhr: Date;
    Asr: Date;
    Maghrib: Date;
    Isha: Date;
}

export interface PrayerCheckin {
    date: string; // ISO date string (YYYY-MM-DD)
    prayers: {
        fajr: boolean;
        dhuhr: boolean;
        asr: boolean;
        maghrib: boolean;
        isha: boolean;
    };
    timestamp: number;
}

let cachedTimeOffset: number | null = null;
let lastTimeCheck = 0;

/**
 * Get Network Verified Time (Anti-Cheat)
 * Calculates the offset between local time and network time once per hour.
 */
export async function getVerifiedTime(): Promise<number> {
    const now = Date.now();

    // Refresh offset every hour (3600000ms) or if not yet cached.
    // If it failed previously, wait at least 5 minutes (300000ms) before retrying.
    const isCacheEmpty = cachedTimeOffset === null;
    const isCacheOld = now - lastTimeCheck > 3600000;
    const isRetryDelayed = now - lastTimeCheck > 300000;

    if (isCacheEmpty ? isRetryDelayed : isCacheOld) {
        lastTimeCheck = now; // Mark attempt immediately to prevent concurrent floods
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);

            // Note: Google has strict CORS. If this fails, we fall back to local time.
            const response = await fetch('https://www.google.com', {
                method: 'HEAD',
                cache: 'no-cache',
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            const dateStr = response.headers.get('Date');
            if (dateStr) {
                const networkTime = new Date(dateStr).getTime();
                cachedTimeOffset = networkTime - now;
                console.log(`[Anti-Cheat] Time offset calibrated: ${cachedTimeOffset}ms`);
            } else {
                throw new Error('No Date header');
            }
        } catch (e) {
            console.warn('[Anti-Cheat] Network time check failed (likely CORS), using local clock.');
            if (cachedTimeOffset === null) cachedTimeOffset = 0;
        }
    }

    return Date.now() + (cachedTimeOffset || 0);
}

// Cache for prayer times to avoid recalculating 5 times per second
let cachedPrayerTimes: { date: string, times: PrayerTimes } | null = null;

/**
 * Get prayer times locally using Adhan.js
 */
export async function getLocalPrayerTimes(date: Date = new Date()): Promise<PrayerTimes | null> {
    // Return cache if it's the same day (cache is invalidated via clearPrayerCache()
    // when location or fiqh settings change)
    const dateKey = date.toDateString();
    if (cachedPrayerTimes && cachedPrayerTimes.date === dateKey) {
        return cachedPrayerTimes.times;
    }

    try {
        let latitude: number | null = null;
        let longitude: number | null = null;
        const locationMode = localStorage.getItem(LOCATION_MODE_KEY) || 'auto';

        if (locationMode === 'manual') {
            const latStr = localStorage.getItem(MANUAL_LAT_KEY);
            const lngStr = localStorage.getItem(MANUAL_LNG_KEY);
            if (latStr && lngStr) {
                const pLat = parseFloat(latStr);
                const pLng = parseFloat(lngStr);
                if (!isNaN(pLat) && !isNaN(pLng)) {
                    latitude = pLat;
                    longitude = pLng;
                }
            }
        }

        if (latitude === null || longitude === null) {
            // Try to get GPS coordinates
            try {
                const position = await Geolocation.getCurrentPosition({
                    enableHighAccuracy: false,
                    timeout: 5000
                });
                latitude = position.coords.latitude;
                longitude = position.coords.longitude;
            } catch (e) {
                console.warn('[Prayer] GPS access denied or failed, using default (Mecca)');
                // Default to Mecca coordinates if GPS is unavailable
                latitude = 21.4225;
                longitude = 39.8262;
            }
        }

        const adhanCoords = new Coordinates(latitude, longitude);

        // Load Calculation Method
        const storedMethod = localStorage.getItem(METHOD_STORAGE_KEY) || 'MuslimWorldLeague';
        let params;
        switch (storedMethod) {
            case 'Egyptian': params = CalculationMethod.Egyptian(); break;
            case 'Karachi': params = CalculationMethod.Karachi(); break;
            case 'UmmAlQura': params = CalculationMethod.UmmAlQura(); break;
            case 'Dubai': params = CalculationMethod.Dubai(); break;
            case 'MoonsightingCommittee': params = CalculationMethod.MoonsightingCommittee(); break;
            case 'NorthAmerica': params = CalculationMethod.NorthAmerica(); break;
            case 'Kuwait': params = CalculationMethod.Kuwait(); break;
            case 'Qatar': params = CalculationMethod.Qatar(); break;
            case 'Singapore': params = CalculationMethod.Singapore(); break;
            case 'Turkey': params = CalculationMethod.Turkey(); break;
            case 'Tehran': params = CalculationMethod.Tehran(); break;
            default: params = CalculationMethod.MuslimWorldLeague();
        }

        // Load Madhab
        const storedMadhab = localStorage.getItem(MADHAB_STORAGE_KEY) || 'Shafi';
        params.madhab = storedMadhab === 'Hanafi' ? Madhab.Hanafi : Madhab.Shafi;

        const prayerTimes = new AdhanPrayerTimes(adhanCoords, date, params);

        const result = {
            Fajr: prayerTimes.fajr,
            Sunrise: prayerTimes.sunrise,
            Dhuhr: prayerTimes.dhuhr,
            Asr: prayerTimes.asr,
            Maghrib: prayerTimes.maghrib,
            Isha: prayerTimes.isha
        };

        cachedPrayerTimes = { date: dateKey, times: result };
        return result;
    } catch (error) {
        console.error('[Prayer] Local calculation failed:', error);
        return null;
    }
}

/**
 * Check if a prayer time has been reached
 */
export async function isPrayerActive(prayerId: string): Promise<{ active: boolean; countdown: number }> {
    const times = await getLocalPrayerTimes();
    if (!times) return { active: false, countdown: 0 };

    const verifiedNow = await getVerifiedTime();
    return computePrayerStatus(prayerId, times, verifiedNow);
}

function computePrayerStatus(
    prayerId: string,
    times: PrayerTimes,
    verifiedNow: number
): { active: boolean; countdown: number } {
    // Map prayerId to correct times key
    const prayerMap: Record<string, keyof PrayerTimes> = {
        fajr: 'Fajr',
        dhuhr: 'Dhuhr',
        asr: 'Asr',
        maghrib: 'Maghrib',
        isha: 'Isha'
    };

    const key = prayerMap[prayerId.toLowerCase()] || 'Fajr';
    const prayerTime = times[key].getTime();

    const diff = prayerTime - verifiedNow;

    return {
        active: diff <= 0,
        countdown: diff > 0 ? diff : 0
    };
}

/**
 * Compute statuses for all prayers in one pass (single time lookup).
 * Much cheaper than calling isPrayerActive for each prayer.
 */
export async function getAllPrayerStatuses(): Promise<Record<string, { active: boolean; countdown: number }>> {
    const times = await getLocalPrayerTimes();
    const verifiedNow = await getVerifiedTime();

    const statuses: Record<string, { active: boolean; countdown: number }> = {};
    const ids = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

    for (const id of ids) {
        statuses[id] = times
            ? computePrayerStatus(id, times, verifiedNow)
            : { active: false, countdown: 0 };
    }
    return statuses;
}


/**
 * Clear the calculated prayer times cache.
 * Call this when location or fiqh settings change.
 */
export function clearPrayerCache() {
    cachedPrayerTimes = null;
    console.log('[Prayer] Calculation cache cleared.');
}

/**
 * Get today's date key (Islamic day - starts at Fajr)
 */
export function getIslamicDateKey(date: Date = new Date()): string {
    // For simplicity, use calendar date
    // A more accurate implementation would use Fajr time
    return date.toISOString().split('T')[0];
}

/**
 * Get stored prayer check-ins
 */
export function getPrayerCheckins(): PrayerCheckin[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

/**
 * Get today's prayer check-in
 */
export function getTodayCheckin(): PrayerCheckin | null {
    const today = getIslamicDateKey();
    const checkins = getPrayerCheckins();
    return checkins.find(c => c.date === today) || null;
}

/**
 * Save a prayer check-in
 */
export function savePrayerCheckin(prayer: keyof PrayerCheckin['prayers'], completed: boolean): void {
    const today = getIslamicDateKey();
    const checkins = getPrayerCheckins();

    let todayCheckin = checkins.find(c => c.date === today);

    if (!todayCheckin) {
        todayCheckin = {
            date: today,
            prayers: {
                fajr: false,
                dhuhr: false,
                asr: false,
                maghrib: false,
                isha: false
            },
            timestamp: Date.now()
        };
        checkins.push(todayCheckin);
    }

    todayCheckin.prayers[prayer] = completed;
    todayCheckin.timestamp = Date.now();

    // Keep only last 30 days
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const filtered = checkins.filter(c => c.timestamp > thirtyDaysAgo);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

/**
 * Calculate prayer streak (consecutive days with all 5 prayers)
 */
export function calculatePrayerStreak(): number {
    const checkins = getPrayerCheckins();
    if (checkins.length === 0) return 0;

    // Sort by date descending
    const sorted = [...checkins].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    let streak = 0;
    const today = new Date();

    for (let i = 0; i < sorted.length; i++) {
        const checkin = sorted[i];
        const expectedDate = new Date(today);
        expectedDate.setDate(today.getDate() - i);
        const expectedKey = getIslamicDateKey(expectedDate);

        // Check if this is the expected consecutive day
        if (checkin.date !== expectedKey) break;

        // Check if all prayers were completed
        const allCompleted = Object.values(checkin.prayers).every(v => v);
        if (!allCompleted) break;

        streak++;
    }

    return streak;
}

/**
 * Get completion percentage for today
 */
export function getTodayCompletionPercentage(): number {
    const today = getTodayCheckin();
    if (!today) return 0;

    const completed = Object.values(today.prayers).filter(v => v).length;
    return Math.round((completed / 5) * 100);
}

/**
 * Get specific dates/times for prayer notifications
 */
export async function getPrayerNotificationTimes(): Promise<{ name: string; time: Date }[]> {
    const times = await getLocalPrayerTimes();
    if (!times) return [];

    const now = new Date();
    const result: { name: string; time: Date }[] = [];

    const prayerNames: (keyof PrayerTimes)[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

    prayerNames.forEach(name => {
        const prayerDate = new Date(times[name]);

        // If the prayer time has already passed today, scheduled for next cycle
        // Not perfectly accurate for midnight cases but works for standard daily reset
        if (prayerDate.getTime() < now.getTime()) {
            prayerDate.setDate(now.getDate() + 1);
        }

        result.push({ name, time: prayerDate });
    });

    return result.sort((a, b) => a.time.getTime() - b.time.getTime());
}
