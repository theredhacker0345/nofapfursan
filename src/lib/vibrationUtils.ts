/**
 * Vibration Utilities for Native UX
 * 
 * Provides consistent haptic feedback patterns across the app.
 * Uses Web Vibration API with Capacitor Haptics fallback.
 */

import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

/**
 * Single short tap vibration - for button presses and logs
 */
export async function tapVibrate(): Promise<void> {
    try {
        if (Capacitor.isNativePlatform()) {
            await Haptics.impact({ style: ImpactStyle.Light });
        } else if ('vibrate' in navigator) {
            navigator.vibrate(50);
        }
    } catch (e) {
        // Silently fail - haptics are optional
    }
}

/**
 * Medium impact vibration - for confirmations
 */
export async function confirmVibrate(): Promise<void> {
    try {
        if (Capacitor.isNativePlatform()) {
            await Haptics.impact({ style: ImpactStyle.Medium });
        } else if ('vibrate' in navigator) {
            navigator.vibrate(100);
        }
    } catch (e) {
        // Silently fail
    }
}

/**
 * Luxury Click - Heavy mechanical click feel
 * Mimics the tactile feedback of a high-end watch complication or mechanical switch.
 */
export async function luxuryClickVibrate(): Promise<void> {
    try {
        if (Capacitor.isNativePlatform()) {
            // Heavy impact for that "expensive" mechanical feel
            await Haptics.impact({ style: ImpactStyle.Heavy });
        } else if ('vibrate' in navigator) {
            // Short but sharp
            navigator.vibrate(15);
        }
    } catch (e) {
        // Silently fail
    }
}

/**
 * Double "" pulse - for milestone achievements
 * Pattern: short-pause-short (like a )
 */
export async function heartbeatVibrate(): Promise<void> {
    try {
        if (Capacitor.isNativePlatform()) {
            await Haptics.impact({ style: ImpactStyle.Heavy });
            await new Promise(r => setTimeout(r, 100));
            await Haptics.impact({ style: ImpactStyle.Heavy });
        } else if ('vibrate' in navigator) {
            // Pattern: 100ms vibrate, 50ms pause, 100ms vibrate
            navigator.vibrate([100, 50, 100]);
        }
    } catch (e) {
        // Silently fail
    }
}

/**
 * Celebration vibration - for major milestones
 * Pattern: triple pulse with increasing intensity
 */
export async function milestoneVibrate(): Promise<void> {
    try {
        if (Capacitor.isNativePlatform()) {
            await Haptics.notification({ type: NotificationType.Success });
        } else if ('vibrate' in navigator) {
            // Pattern: short-pause-medium-pause-long
            navigator.vibrate([50, 50, 100, 50, 150]);
        }
    } catch (e) {
        // Silently fail
    }
}

/**
 * Warning vibration - for resets and destructive actions
 */
export async function warningVibrate(): Promise<void> {
    try {
        if (Capacitor.isNativePlatform()) {
            await Haptics.notification({ type: NotificationType.Warning });
        } else if ('vibrate' in navigator) {
            navigator.vibrate([100, 30, 100, 30, 100]);
        }
    } catch (e) {
        // Silently fail
    }
}

/**
 * Error vibration - for failures
 */
export async function errorVibrate(): Promise<void> {
    try {
        if (Capacitor.isNativePlatform()) {
            await Haptics.notification({ type: NotificationType.Error });
        } else if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200]);
        }
    } catch (e) {
        // Silently fail
    }
}
