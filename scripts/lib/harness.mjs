/** Shared static server for the browser test scripts. */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

/** Serves `dist`, falling back to the SPA shell. */
export const serveDist = (dist, port) =>
  new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      try {
        const url = new URL(req.url, "http://localhost");
        const path = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, "");
        let file = join(dist, path);
        try {
          const info = await stat(file);
          if (info.isDirectory()) file = join(file, "index.html");
        } catch {
          file = join(dist, "index.html");
        }
        const body = await readFile(file);
        res.writeHead(200, { "Content-Type": MIME[extname(file)] || "application/octet-stream" });
        res.end(body);
      } catch (error) {
        res.writeHead(404).end(String(error));
      }
    });
    server.listen(port, () => resolve(server));
  });

/**
 * Launch Chromium, tolerating a cached browser revision that differs from the
 * installed playwright-core.
 */
export const launchBrowser = async (chromium) => {
  try {
    return await chromium.launch();
  } catch (error) {
    const { readdir } = await import("node:fs/promises");
    const { existsSync } = await import("node:fs");
    const { homedir } = await import("node:os");
    const { join } = await import("node:path");

    const binaries = [
      "chrome-headless-shell-linux64/chrome-headless-shell",
      "chrome-linux64/headless_shell",
      "chrome-linux64/chrome",
      "chrome-linux/headless_shell",
      "chrome-linux/chrome",
    ];

    const scan = async (root, depth = 0) => {
      if (depth > 4 || !existsSync(root)) return [];
      let entries;
      try {
        entries = await readdir(root, { withFileTypes: true });
      } catch {
        return [];
      }
      const found = [];
      for (const bin of binaries) {
        const p = join(root, bin);
        if (existsSync(p)) found.push(p);
      }
      for (const entry of entries) {
        if (!entry.isDirectory() || entry.name === "node_modules" || entry.name === ".git") continue;
        found.push(...(await scan(join(root, entry.name), depth + 1)));
      }
      return found;
    };

    const roots = [
      process.env.PLAYWRIGHT_BROWSERS_PATH,
      join(homedir(), ".cache"),
      "/tmp/kilo-worktrees",
      "/tmp",
    ].filter(Boolean);

    for (const root of roots) {
      const candidates = await scan(root);
      if (candidates.length) {
        console.warn(`[flows] using cached browser ${candidates[0]}`);
        return chromium.launch({ executablePath: candidates[0] });
      }
    }

    throw new Error(
      `No Chromium available. Run \`npx playwright install chromium\`. Original: ${error.message}`,
    );
  }
};