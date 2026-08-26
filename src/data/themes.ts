export interface ThemeDefinition {
  id: string;
  name: string;
  minDays: number;
  description: string;
  preview: string;
  vars: Record<string, string>;
}

/* Each theme overrides the 3-tier tokens. Only the accent and surfaces
   shift — the design language stays identical. */
export const THEMES: ThemeDefinition[] = [
  {
    id: "fursan",
    name: "Fursan",
    minDays: 0,
    description: "Warm off-white with a bronze accent.",
    preview: "#7a4a23",
    vars: {
      "--bg": "40 30% 97%",
      "--surface": "40 25% 99%",
      "--surface-2": "36 18% 94%",
      "--border": "33 14% 88%",
      "--border-strong": "30 12% 78%",
      "--ink": "25 22% 12%",
      "--ink-muted": "25 12% 38%",
      "--ink-faint": "28 8% 58%",
      "--accent": "28 62% 38%",
      "--accent-hover": "28 62% 32%",
      "--accent-ink": "40 30% 97%",
    },
  },
  {
    id: "fursan_dark",
    name: "Fursan Dark",
    minDays: 0,
    description: "Soft dark mode with warm bronze.",
    preview: "#0f0d0b",
    vars: {
      "--bg": "30 8% 6%",
      "--surface": "30 8% 9%",
      "--surface-2": "30 8% 13%",
      "--border": "30 8% 18%",
      "--border-strong": "30 8% 26%",
      "--ink": "40 18% 92%",
      "--ink-muted": "35 10% 68%",
      "--ink-faint": "32 8% 48%",
      "--accent": "32 70% 56%",
      "--accent-hover": "32 70% 62%",
      "--accent-ink": "30 10% 8%",
    },
  },
  {
    id: "midnight",
    name: "Midnight",
    minDays: 60,
    description: "Deep blue with cool white accent.",
    preview: "#1e293b",
    vars: {
      "--bg": "222 47% 9%",
      "--surface": "222 40% 12%",
      "--surface-2": "222 35% 16%",
      "--border": "222 30% 22%",
      "--border-strong": "222 25% 32%",
      "--ink": "210 35% 95%",
      "--ink-muted": "212 20% 70%",
      "--ink-faint": "214 15% 52%",
      "--accent": "200 90% 70%",
      "--accent-hover": "200 90% 78%",
      "--accent-ink": "222 47% 9%",
    },
  },
  {
    id: "solar",
    name: "Solar",
    minDays: 90,
    description: "Bright, warm light theme.",
    preview: "#f59e0b",
    vars: {
      "--bg": "40 35% 98%",
      "--surface": "40 30% 100%",
      "--surface-2": "40 25% 95%",
      "--border": "38 20% 86%",
      "--border-strong": "35 22% 74%",
      "--ink": "30 50% 8%",
      "--ink-muted": "30 20% 32%",
      "--ink-faint": "30 15% 50%",
      "--accent": "28 88% 44%",
      "--accent-hover": "28 88% 38%",
      "--accent-ink": "40 30% 98%",
    },
  },
  {
    id: "void",
    name: "Void",
    minDays: 180,
    description: "Pure black with violet accent.",
    preview: "#000000",
    vars: {
      "--bg": "0 0% 0%",
      "--surface": "0 0% 4%",
      "--surface-2": "0 0% 8%",
      "--border": "280 30% 18%",
      "--border-strong": "280 30% 28%",
      "--ink": "280 30% 92%",
      "--ink-muted": "280 20% 68%",
      "--ink-faint": "280 10% 48%",
      "--accent": "282 90% 68%",
      "--accent-hover": "282 90% 74%",
      "--accent-ink": "0 0% 0%",
    },
  },
];
