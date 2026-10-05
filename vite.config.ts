import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { createRequire } from "node:module";

const pkg = createRequire(import.meta.url)("./package.json") as { version: string };

/**
 * Production builds used `esbuild.drop: ["console"]`, which deleted every
 * `console.error` along with the `console.log` noise. That is why real failures
 * were invisible in deployed builds. Only the chatty levels are dropped now —
 * errors and warnings survive so a shipped build can still be diagnosed.
 */
const dropVerboseConsole = (): Plugin => ({
  name: "fursan:drop-verbose-console",
  apply: "build",
  enforce: "post",
  generateBundle(_options, bundle) {
    const noisy = /\bconsole\.(log|debug|info|table|trace|dir)\s*\(/g;
    for (const chunk of Object.values(bundle)) {
      if (chunk.type !== "chunk") continue;
      chunk.code = chunk.code.replace(noisy, "void 0(");
    }
  },
});

export default defineConfig(({ mode }) => ({
  base: "/",
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), dropVerboseConsole()],
  define: {
    // One version, from package.json. The APK reads the same field via
    // build.gradle, so the web build, the in-app label and the installer can
    // never report different numbers.
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    target: "es2020",
    // HashRouter needs no server rewrite, so every route resolves to the shell.
    assetsInlineLimit: 4096,
    reportCompressedSize: true,
    rollupOptions: {
      output: {
        // Long-lived, rarely-changing dependencies get their own chunk so an app
        // deploy does not invalidate vendor JS. Returning `undefined` for
        // everything else is deliberate: a catch-all "vendor-misc" bucket
        // reorders the module graph and breaks React's initialisation
        // ("Cannot read properties of undefined (reading 'createContext')").
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (/[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(id))
            return "vendor-react";
          if (/[\\/]node_modules[\\/](nostr-tools|@noble)[\\/]/.test(id)) return "vendor-nostr";
          if (/[\\/]node_modules[\\/](framer-motion|motion-dom|motion-utils)[\\/]/.test(id))
            return "vendor-motion";
          if (/[\\/]node_modules[\\/](@tanstack|sonner|@radix-ui)[\\/]/.test(id)) return "vendor-ui";
          return undefined;
        },
      },
    },
  },
  esbuild: {
    drop: mode === "development" ? [] : ["debugger"],
  },
}));