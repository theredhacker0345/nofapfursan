import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "/", // Critical for Vercel
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    target: "es2020", // Modern target is fine for Nostr crypto
    rollupOptions: {
      output: {
        // Split stable vendor libs so app-code changes don't invalidate their cache
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-nostr": ["nostr-tools", "@noble/hashes"],
          "vendor-motion": ["framer-motion"],
        },
      },
    },
  },
  esbuild: {
    // Strip debug logging from production bundles
    drop: mode === "production" ? ["console", "debugger"] : [],
  },
}));
