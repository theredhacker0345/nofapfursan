import React, { createContext, useContext, useEffect, useMemo, useState, useRef, useCallback } from "react";
import {
  THEMES,
  ThemeDefinition,
  DEFAULT_THEME_ID,
  DARK_THEME_ID,
  themeColor,
  parseStoredThemeId,
} from "@/data/themes";
import { Preferences } from "@capacitor/preferences";
import { getStreakData, daysSinceStart } from "@/lib/streakUtils";

interface ThemeContextType {
  currentTheme: ThemeDefinition;
  setTheme: (themeId: string) => Promise<void>;
  previewTheme: (themeId: string) => void;
  unlockedThemes: string[];
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const STORE_KEY = "user_theme";

/** Applies the palette plus everything the OS chrome has to agree with. */
const applyTheme = (theme: ThemeDefinition) => {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(theme.vars)) {
    root.style.setProperty(key, value);
  }
  root.style.colorScheme = theme.scheme;

  // Keep the Android status bar / browser chrome in step with the surface.
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) meta.content = themeColor(theme, "--bg");

  // Tailwind's dark: variants follow the same signal.
  root.classList.toggle("dark", theme.scheme === "dark");
};

const readStoredTheme = async (): Promise<ThemeDefinition> => {
  try {
    const { value } = await Preferences.get({ key: STORE_KEY });
    const found = THEMES.find((t) => t.id === parseStoredThemeId(value));
    if (found) return found;
  } catch {
    // Unreadable preference — fall through to the OS preference.
  }
  const prefersDark =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  return THEMES.find((t) => t.id === (prefersDark ? DARK_THEME_ID : DEFAULT_THEME_ID)) ?? THEMES[0];
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentThemeState] = useState<ThemeDefinition>(
    () => THEMES.find((t) => t.id === DEFAULT_THEME_ID) ?? THEMES[0],
  );
  const [unlockedThemes, setUnlockedThemes] = useState<string[]>([DEFAULT_THEME_ID, DARK_THEME_ID]);

  const currentThemeRef = useRef(currentTheme);
  const previewTimeoutRef = useRef<number | null>(null);
  const streakDaysRef = useRef<number | null>(null);

  useEffect(() => {
    currentThemeRef.current = currentTheme;
  }, [currentTheme]);

  /** Streak length drives theme unlocks; recompute on every streak write. */
  const refreshUnlocks = useCallback(async () => {
    try {
      const data = await getStreakData();
      const days = daysSinceStart(data.startDate);
      if (days === streakDaysRef.current) return;
      streakDaysRef.current = days;
      setUnlockedThemes(THEMES.filter((t) => days >= t.minDays).map((t) => t.id));
    } catch {
      // Keep the last known set — an unreadable streak must not lock the UI.
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const theme = await readStoredTheme();
      if (cancelled) return;
      setCurrentThemeState(theme);
      applyTheme(theme);
      await refreshUnlocks();
    })();

    window.addEventListener("fursan_streak_updated", refreshUnlocks);
    return () => {
      cancelled = true;
      window.removeEventListener("fursan_streak_updated", refreshUnlocks);
      if (previewTimeoutRef.current) window.clearTimeout(previewTimeoutRef.current);
    };
  }, [refreshUnlocks]);

  const setTheme = useCallback(async (themeId: string) => {
    if (previewTimeoutRef.current) {
      window.clearTimeout(previewTimeoutRef.current);
      previewTimeoutRef.current = null;
    }
    const theme = THEMES.find((t) => t.id === themeId);
    if (!theme) return;
    setCurrentThemeState(theme);
    applyTheme(theme);
    try {
      await Preferences.set({ key: STORE_KEY, value: themeId });
    } catch {
      // Theme still applies for this session even if persistence fails.
    }
  }, []);

  const previewTheme = useCallback((themeId: string) => {
    const theme = THEMES.find((t) => t.id === themeId);
    if (!theme) return;
    if (previewTimeoutRef.current) window.clearTimeout(previewTimeoutRef.current);
    applyTheme(theme);
    previewTimeoutRef.current = window.setTimeout(() => {
      applyTheme(currentThemeRef.current);
      previewTimeoutRef.current = null;
    }, 3000);
  }, []);

  const value = useMemo(
    () => ({ currentTheme, setTheme, previewTheme, unlockedThemes }),
    [currentTheme, setTheme, previewTheme, unlockedThemes],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

/* eslint-disable-next-line react-refresh/only-export-components -- the hook is
   the only supported way to read the provider it belongs to. */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
};