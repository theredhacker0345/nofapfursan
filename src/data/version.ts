declare const __APP_VERSION__: string;

/** Single source of truth: `package.json`, injected by Vite at build time. */
export const APP_VERSION: string =
  typeof __APP_VERSION__ === "string" ? __APP_VERSION__ : "0.0.0-dev";

export const APP_TAGLINE = "Discipline over desire.";