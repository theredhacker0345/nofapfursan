import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { THEMES, ThemeDefinition } from '@/data/themes';
import { Preferences } from '@capacitor/preferences';
import { getStreakData } from '@/lib/streakUtils';

interface ThemeContextType {
    currentTheme: ThemeDefinition;
    setTheme: (themeId: string) => Promise<void>;
    previewTheme: (themeId: string) => void;
    unlockedThemes: string[];
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentTheme, setCurrentThemeState] = useState<ThemeDefinition>(THEMES[0]);
    const [unlockedThemes, setUnlockedThemes] = useState<string[]>(["fursan"]);
    const previewTimeoutRef = useRef<number | null>(null);

    useEffect(() => {
        const loadTheme = async () => {
            const { value: storedTheme } = await Preferences.get({ key: 'user_theme' });
            if (storedTheme) {
                const theme = THEMES.find(t => t.id === storedTheme);
                if (theme) {
                    setCurrentThemeState(theme);
                    applyTheme(theme);
                }
            }

            // Check levels for unlocks (streak data lives in SecureStorage)
            try {
                const data = await getStreakData();
                const days = calculateDays(data.startDate);
                const unlocked = THEMES.filter(t => days >= t.minDays).map(t => t.id);
                setUnlockedThemes(unlocked);
            } catch (e) {
                // Keep defaults if streak data can't be read
            }
        };
        loadTheme();

        window.addEventListener('fursan_streak_updated', loadTheme);
        return () => window.removeEventListener('fursan_streak_updated', loadTheme);
    }, []);

    const calculateDays = (startDate: string | null) => {
        if (!startDate) return 0;
        const start = new Date(startDate);
        const now = new Date();
        return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    };

    const applyTheme = (theme: ThemeDefinition) => {
        const root = document.documentElement;
        Object.entries(theme.vars).forEach(([key, value]) => {
            root.style.setProperty(key, value);
        });
    };

    const setTheme = async (themeId: string) => {
        if (previewTimeoutRef.current) {
            window.clearTimeout(previewTimeoutRef.current);
            previewTimeoutRef.current = null;
        }
        const theme = THEMES.find(t => t.id === themeId);
        if (theme) {
            setCurrentThemeState(theme);
            applyTheme(theme);
            await Preferences.set({ key: 'user_theme', value: themeId });
        }
    };

    const currentThemeRef = useRef<ThemeDefinition>(THEMES[0]);
    useEffect(() => {
        currentThemeRef.current = currentTheme;
    }, [currentTheme]);

    const previewTheme = (themeId: string) => {
        if (previewTimeoutRef.current) {
            window.clearTimeout(previewTimeoutRef.current);
        }
        const theme = THEMES.find(t => t.id === themeId);
        if (theme) {
            applyTheme(theme);
            // Revert after 3 seconds
            previewTimeoutRef.current = window.setTimeout(() => {
                applyTheme(currentThemeRef.current);
                previewTimeoutRef.current = null;
            }, 3000);
        }
    };

    return (
        <ThemeContext.Provider value={{ currentTheme, setTheme, previewTheme, unlockedThemes }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within ThemeProvider');
    return context;
};
