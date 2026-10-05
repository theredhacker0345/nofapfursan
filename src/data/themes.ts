export interface ThemeDefinition {
  id: string;
  name: string;
  minDays: number;
  description: string;
  preview: string;
  /** Drives `color-scheme` + the browser/OS chrome colour. */
  scheme: "light" | "dark";
  vars: Record<string, string>;
}

/**
 * Every theme ships the complete token set — including status colours, which
 * used to live only in :root and therefore collapsed on dark surfaces.
 * The design language (hairline rules, flat planes, one bronze accent) is
 * constant; only the palette shifts.
 */
export const THEMES: ThemeDefinition[] = [
  {
    id: "fursan",
    name: "Fursan",
    minDays: 0,
    description: "Warm paper with a bronze accent.",
    preview: "#96601F",
    scheme: "light",
    vars: {
      "--bg": "38 33% 95%",
      "--surface": "40 40% 98%",
      "--surface-2": "38 24% 91%",
      "--surface-3": "38 20% 87%",
      "--border": "38 24% 87%",
      "--border-strong": "36 18% 77%",
      "--ink": "30 22% 6%",
      "--ink-muted": "35 10% 33%",
      "--ink-faint": "38 8% 50%",
      "--accent": "33 68% 35%",
      "--accent-hover": "31 70% 28%",
      "--on-accent": "40 40% 98%",
      "--success": "152 40% 27%",
      "--warning": "41 78% 27%",
      "--danger": "6 62% 38%",
    },
  },
  {
    id: "fursan_dark",
    name: "Fursan Dark",
    minDays: 0,
    description: "Warm charcoal, bronze accent. Default at night.",
    preview: "#1A1714",
    scheme: "dark",
    vars: {
      "--bg": "30 10% 6%",
      "--surface": "32 12% 10%",
      "--surface-2": "36 15% 13%",
      "--surface-3": "36 14% 17%",
      "--border": "34 14% 17%",
      "--border-strong": "34 13% 26%",
      "--ink": "40 33% 94%",
      "--ink-muted": "38 14% 62%",
      "--ink-faint": "38 10% 45%",
      "--accent": "33 60% 51%",
      "--accent-hover": "34 65% 58%",
      "--on-accent": "30 15% 7%",
      "--success": "148 42% 52%",
      "--warning": "40 70% 58%",
      "--danger": "6 65% 60%",
    },
  },
  {
    id: "midnight",
    name: "Midnight",
    minDays: 30,
    description: "Deep navy with a cool accent.",
    preview: "#1B2A41",
    scheme: "dark",
    vars: {
      "--bg": "222 47% 9%",
      "--surface": "222 40% 12%",
      "--surface-2": "222 35% 16%",
      "--surface-3": "222 33% 20%",
      "--border": "222 30% 22%",
      "--border-strong": "222 25% 32%",
      "--ink": "210 35% 95%",
      "--ink-muted": "212 20% 70%",
      "--ink-faint": "214 15% 52%",
      "--accent": "200 80% 62%",
      "--accent-hover": "200 85% 72%",
      "--on-accent": "222 47% 9%",
      "--success": "152 45% 55%",
      "--warning": "40 75% 60%",
      "--danger": "0 70% 65%",
    },
  },
  {
    id: "sage",
    name: "Sage",
    minDays: 60,
    description: "Muted green-grey. Quiet and level.",
    preview: "#7FA37F",
    scheme: "dark",
    vars: {
      "--bg": "150 12% 5%",
      "--surface": "152 12% 8%",
      "--surface-2": "154 12% 12%",
      "--surface-3": "154 11% 16%",
      "--border": "154 12% 19%",
      "--border-strong": "152 10% 30%",
      "--ink": "140 20% 93%",
      "--ink-muted": "145 10% 66%",
      "--ink-faint": "148 8% 48%",
      "--accent": "122 20% 52%",
      "--accent-hover": "122 24% 60%",
      "--on-accent": "150 14% 6%",
      "--success": "145 40% 50%",
      "--warning": "40 60% 56%",
      "--danger": "6 55% 60%",
    },
  },
  {
    id: "solar",
    name: "Solar",
    minDays: 90,
    description: "High-contrast amber on near-black.",
    preview: "#E0A33C",
    scheme: "dark",
    vars: {
      "--bg": "30 25% 3%",
      "--surface": "32 22% 7%",
      "--surface-2": "34 28% 12%",
      "--surface-3": "34 26% 17%",
      "--border": "36 30% 20%",
      "--border-strong": "38 34% 30%",
      "--ink": "40 100% 94%",
      "--ink-muted": "38 32% 66%",
      "--ink-faint": "36 22% 44%",
      "--accent": "37 72% 56%",
      "--accent-hover": "38 80% 64%",
      "--on-accent": "30 25% 5%",
      "--success": "145 45% 52%",
      "--warning": "42 80% 60%",
      "--danger": "8 70% 62%",
    },
  },
  {
    id: "void",
    name: "Void",
    minDays: 180,
    description: "True black for OLED. Maximum restraint.",
    preview: "#000000",
    scheme: "dark",
    vars: {
      "--bg": "0 0% 0%",
      "--surface": "0 0% 4.7%",
      "--surface-2": "0 0% 9%",
      "--surface-3": "0 0% 15%",
      "--border": "0 0% 15%",
      "--border-strong": "0 0% 26%",
      "--ink": "0 0% 93%",
      "--ink-muted": "0 0% 63%",
      "--ink-faint": "0 0% 45%",
      "--accent": "33 52% 50%",
      "--accent-hover": "34 58% 57%",
      "--on-accent": "0 0% 6%",
      "--success": "148 40% 55%",
      "--warning": "42 72% 60%",
      "--danger": "6 68% 63%",
    },
  },
];

export const DEFAULT_THEME_ID = "fursan";

/** Fallback used when the OS preference cannot be read. */
export const DARK_THEME_ID = "fursan_dark";

export const getTheme = (id: string | null | undefined): ThemeDefinition =>
  THEMES.find((t) => t.id === id) ?? THEMES[0];

/** Resolved `hsl()` value for a token — used for `meta[name=theme-color]`. */
export const themeColor = (theme: ThemeDefinition, tokenName: string): string => {
  const raw = theme.vars[tokenName] ?? "0 0% 0%";
  return `hsl(${raw})`;
};
/**
 * Reads the persisted theme id.
 *
 * Capacitor's web `Preferences.get` returns the stored string verbatim, while the
 * native bridge JSON-decodes it, so a legacy build (or a hand-edited
 * localStorage value) can leave the id JSON-quoted. Accept both shapes: a
 * mismatch here silently reverted every user to the OS default theme, and threw
 * inside the pre-paint script in index.html.
 */
export const parseStoredThemeId = (raw: string | null | undefined): string | null => {
  if (raw == null) return null;
  const trimmed = String(raw).trim();
  if (!trimmed.startsWith('"')) return trimmed || null;
  try {
    const parsed: unknown = JSON.parse(trimmed);
    return typeof parsed === "string" ? parsed : null;
  } catch {
    return trimmed.replace(/^"|"$/g, "") || null;
  }
};
