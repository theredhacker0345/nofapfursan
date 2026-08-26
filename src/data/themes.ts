export interface ThemeDefinition {
    id: string;
    name: string;
    minDays: number;
    description: string;
    preview: string; // Color code for preview
    vars: Record<string, string>;
}

export const THEMES: ThemeDefinition[] = [
    {
        id: "fursan",
        name: "Fursan",
        minDays: 0,
        description: "The default warm and calm theme.",
        preview: "#9a6b3f",
        vars: {
            "--background": "40 33% 97%",
            "--foreground": "25 15% 14%",
            "--primary": "33 45% 40%",
            "--primary-foreground": "40 30% 97%",
            "--secondary": "38 25% 92%",
            "--secondary-foreground": "25 15% 20%",
            "--border": "33 15% 86%",
            "--accent": "152 30% 34%",
            "--ring": "33 45% 40%",
            "--card": "40 30% 99%",
            "--card-foreground": "25 15% 14%",
            "--muted": "38 20% 90%",
            "--muted-foreground": "28 10% 42%"
        }
    },
    {
        id: "fursan_dark",
        name: "Fursan Dark",
        minDays: 0,
        description: "A soft dark theme for night use.",
        preview: "#0a0a0a",
        vars: {
            "--background": "30 8% 6%",
            "--foreground": "40 20% 92%",
            "--primary": "38 55% 55%",
            "--primary-foreground": "30 10% 8%",
            "--secondary": "30 8% 12%",
            "--secondary-foreground": "40 20% 85%",
            "--border": "30 8% 18%",
            "--accent": "152 35% 45%",
            "--ring": "38 55% 55%",
            "--card": "30 8% 8%",
            "--card-foreground": "40 20% 92%",
            "--muted": "30 8% 14%",
            "--muted-foreground": "35 10% 60%"
        }
    },
    {
        id: "midnight",
        name: "Midnight",
        minDays: 60,
        description: "A deep blue night theme.",
        preview: "#1e293b",
        vars: {
            "--background": "222 47% 11%",
            "--foreground": "210 40% 98%",
            "--primary": "210 40% 98%",
            "--primary-foreground": "222 47% 11%",
            "--secondary": "217 32% 17%",
            "--secondary-foreground": "210 40% 90%",
            "--border": "217 32% 25%",
            "--accent": "210 40% 98%",
            "--ring": "210 40% 98%",
            "--card": "222 47% 13%",
            "--card-foreground": "210 40% 98%",
            "--muted": "217 32% 15%",
            "--muted-foreground": "215 20% 65%"
        }
    },
    {
        id: "solar",
        name: "Solar",
        minDays: 90,
        description: "A bright, warm light theme.",
        preview: "#f59e0b",
        vars: {
            "--background": "30 20% 98%",
            "--foreground": "30 50% 5%",
            "--primary": "38 92% 50%",
            "--primary-foreground": "0 0% 100%",
            "--secondary": "30 20% 94%",
            "--secondary-foreground": "30 50% 10%",
            "--border": "30 20% 85%",
            "--accent": "38 92% 50%",
            "--ring": "38 92% 50%",
            "--card": "30 20% 99%",
            "--card-foreground": "30 50% 5%",
            "--muted": "30 20% 90%",
            "--muted-foreground": "30 20% 40%"
        }
    },
    {
        id: "void",
        name: "Void",
        minDays: 180,
        description: "A pure black theme with violet accents.",
        preview: "#000000",
        vars: {
            "--background": "0 0% 0%",
            "--foreground": "280 100% 70%",
            "--primary": "280 100% 70%",
            "--primary-foreground": "0 0% 0%",
            "--secondary": "0 0% 10%",
            "--secondary-foreground": "280 100% 60%",
            "--border": "280 100% 30%",
            "--accent": "280 100% 70%",
            "--ring": "280 100% 70%",
            "--card": "0 0% 5%",
            "--card-foreground": "280 100% 70%",
            "--muted": "0 0% 15%",
            "--muted-foreground": "280 50% 40%"
        }
    }
];
