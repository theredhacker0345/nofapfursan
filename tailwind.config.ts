import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const token = (name: string) => `hsl(var(--${name}))`;

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "Inter Fallback",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif",
        ],
        display: ["Inter Tight", "Inter Tight Fallback", "Inter", "system-ui", "sans-serif"],
        data: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },

      fontSize: {
        // Three roles only: display, UI, data. Nothing below 11px.
        "display-xl": ["3.5rem", { lineHeight: "0.95", letterSpacing: "-0.03em" }],
        "display-l": ["2rem", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        title: ["1.375rem", { lineHeight: "1.25", letterSpacing: "-0.015em" }],
        section: ["1rem", { lineHeight: "1.35", letterSpacing: "-0.01em" }],
        body: ["0.9375rem", { lineHeight: "1.55" }],
        "body-s": ["0.875rem", { lineHeight: "1.5" }],
        label: ["0.6875rem", { lineHeight: "1.3", letterSpacing: "0.16em" }],
        data: ["0.8125rem", { lineHeight: "1.4", letterSpacing: "-0.01em" }],
        "data-lg": ["1.125rem", { lineHeight: "1.2", letterSpacing: "-0.02em" }],
        meta: ["0.75rem", { lineHeight: "1.4" }],
      },

      fontWeight: {
        normal: "400",
        medium: "500",
        semibold: "600",
        bold: "700",
        // Legacy aliases collapse onto 700: a display cut cannot legally carry
        // 800/900 without turning the whole interface into a poster.
        extrabold: "700",
        black: "700",
      },

      colors: {
        // Semantic layer — every surface and every piece of ink.
        bg: token("bg"),
        surface: {
          DEFAULT: token("surface"),
          2: token("surface-2"),
          3: token("surface-3"),
        },
        line: {
          DEFAULT: token("border"),
          strong: token("border-strong"),
        },
        ink: {
          DEFAULT: token("ink"),
          muted: token("ink-muted"),
          faint: token("ink-faint"),
        },
        accent: {
          DEFAULT: token("accent"),
          hover: token("accent-hover"),
          ink: token("on-accent"),
        },
        "on-accent": token("on-accent"),
        success: token("success"),
        warning: token("warning"),
        danger: token("danger"),
        ring: token("accent"),

        // shadcn-compatible aliases so the primitive library renders in the
        // Fursan palette instead of inventing colours of its own.
        background: token("bg"),
        foreground: token("ink"),
        card: {
          DEFAULT: token("surface"),
          foreground: token("ink"),
        },
        popover: {
          DEFAULT: token("surface"),
          foreground: token("ink"),
        },
        primary: {
          DEFAULT: token("accent"),
          foreground: token("on-accent"),
        },
        secondary: {
          DEFAULT: token("surface-2"),
          foreground: token("ink"),
        },
        muted: {
          DEFAULT: token("surface-2"),
          foreground: token("ink-muted"),
        },
        destructive: {
          DEFAULT: token("danger"),
          foreground: token("on-accent"),
        },
        border: {
          DEFAULT: token("border"),
          strong: token("border-strong"),
          input: token("border-strong"),
        },
        input: token("border-strong"),
      },

      borderRadius: {
        none: "0",
        sm: "var(--radius-sm)",
        DEFAULT: "var(--radius-md)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-lg)",
        full: "9999px",
      },

      boxShadow: {
        e1: "var(--e1)",
        e2: "var(--e2)",
        e3: "var(--e3)",
        none: "none",
      },

      maxWidth: {
        content: "var(--content)",
        prose: "68ch",
      },

      spacing: {
        "nav-clearance": "var(--nav-clearance)",
      },

      transitionDuration: {
        fast: "var(--dur-fast)",
        base: "var(--dur-base)",
        slow: "var(--dur-slow)",
      },

      transitionTimingFunction: {
        standard: "var(--ease-standard)",
        exit: "var(--ease-exit)",
      },

      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-rise": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "sync-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
      },

      animation: {
        "fade-in": "fade-in var(--dur-base) var(--ease-standard)",
        "fade-rise": "fade-rise var(--dur-base) var(--ease-standard)",
        "sync-pulse": "sync-pulse 1.6s var(--ease-standard) infinite",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;