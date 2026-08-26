export interface StreakData {
  startDate: string | null;
  longestStreak: number;
  totalRelapses: number;
}

export interface AvatarLevel {
  name: string;
  emoji: string;
  minDays: number;
  maxDays: number;
  color: string;
  description: string;
}

export const MILESTONES: AvatarLevel[] = [
  { name: "The Start", emoji: "📿", minDays: 0, maxDays: 7, color: "text-emerald-400", description: "Your promise to yourself. Every journey starts with one step." },
  { name: "The Fighter", emoji: "⚔️", minDays: 8, maxDays: 40, color: "text-emerald-500", description: "You are fighting for change. Keep pushing forward." },
  { name: "The Guardian", emoji: "🛡️", minDays: 41, maxDays: 90, color: "text-amber-500", description: "You protect your progress. Discipline has become your shield." },
  { name: "The Champion", emoji: "👑", minDays: 91, maxDays: Infinity, color: "text-ink", description: "You are in full control. Be proud of how far you have come." },
];

export const MOTIVATIONAL_QUOTES = [
  "Every day you resist is a day you grow stronger.",
  "Your future self will thank you for the discipline you show today.",
  "The pain of discipline is far less than the pain of regret.",
  "You're not just breaking a habit, you're building a new you.",
  "Champions are made when no one is watching.",
  "The only way out is through. Keep going.",
  "Your streak is proof of your inner strength.",
  "One day at a time, one victory at a time.",
  "Discipline is choosing what you want most over what you want now.",
  "You are stronger than your urges.",
  "Every moment of resistance is a step toward freedom.",
  "The best time to start was yesterday. The next best time is now.",
];

import { SecureStorage } from "@/services/secureStorage";

export async function getStreakData(): Promise<StreakData> {
  // Try secure storage first
  const stored = await SecureStorage.get('fursan_streak_data');
  if (stored) {
    return JSON.parse(stored);
  }

  // Fallback/Migration: Check localStorage
  const legacy = localStorage.getItem('fursan_streak_data');
  if (legacy) {
    // Migrating to fortress
    await SecureStorage.set('fursan_streak_data', legacy);
    localStorage.removeItem('fursan_streak_data');
    return JSON.parse(legacy);
  }

  return {
    startDate: null,
    longestStreak: 0,
    totalRelapses: 0,
  };
}

export async function saveStreakData(data: StreakData): Promise<void> {
  await SecureStorage.set('fursan_streak_data', JSON.stringify(data));
  window.dispatchEvent(new Event('fursan_streak_updated'));
}

export function calculateStreak(startDate: string | null): { days: number; hours: number; minutes: number } {
  if (!startDate) {
    return { days: 0, hours: 0, minutes: 0 };
  }

  const start = new Date(startDate);
  if (isNaN(start.getTime())) {
    return { days: 0, hours: 0, minutes: 0 };
  }

  const now = new Date();
  const diff = now.getTime() - start.getTime();

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return { days: Math.max(0, days), hours: Math.max(0, hours), minutes: Math.max(0, minutes) };
}

export function getAvatarLevel(days: number): AvatarLevel {
  for (let i = MILESTONES.length - 1; i >= 0; i--) {
    if (days >= MILESTONES[i].minDays) {
      return MILESTONES[i];
    }
  }
  return MILESTONES[0];
}

export function getNextAvatarLevel(days: number): AvatarLevel | null {
  const currentIndex = MILESTONES.findIndex(level => days >= level.minDays && days <= level.maxDays);
  if (currentIndex < MILESTONES.length - 1) {
    return MILESTONES[currentIndex + 1];
  }
  return null;
}

export function getRandomQuote(): string {
  return MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
}

export function getDaysUntilNextLevel(days: number): number {
  const nextLevel = getNextAvatarLevel(days);
  if (!nextLevel) return 0;
  return nextLevel.minDays - days;
}

/**
 * Calculate consecutive days of check-ins from health history
 */
export function calculateConsecutiveCheckins(history: { timestamp: number }[]): number {
  if (!history || history.length === 0) return 0;

  // Sort by timestamp descending
  const sorted = [...history].sort((a, b) => b.timestamp - a.timestamp);

  // Get unique days (toDateString)
  const days = new Set<string>();
  sorted.forEach(h => days.add(new Date(h.timestamp).toDateString()));

  const uniqueDays = Array.from(days);
  if (uniqueDays.length === 0) return 0;

  let consecutive = 0;
  const today = new Date();
  const todayStr = today.toDateString();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  // If no check-in today or yesterday, consecutive is 0 (broken streak)
  if (uniqueDays[0] !== todayStr && uniqueDays[0] !== yesterdayStr) {
    return 0;
  }

  // Count backwards
  let lastDate = new Date(uniqueDays[0]);
  consecutive = 1;

  for (let i = 1; i < uniqueDays.length; i++) {
    const currentDate = new Date(uniqueDays[i]);
    const diffTime = Math.abs(lastDate.getTime() - currentDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      consecutive++;
      lastDate = currentDate;
    } else {
      break;
    }
  }

  return consecutive;
}

/**
 * Check if the user qualifies for the Aura bonus (5+ consecutive check-ins)
 */
export function hasAuraBonus(history: { timestamp: number }[]): boolean {
  return calculateConsecutiveCheckins(history) >= 5;
}
