/**
 * Injects the real build manifest into the service worker.
 *
 * The shell (public/sw.js) ships with `__PRECACHE__` and `__BUILD_ID__`
 * placeholders. Without this step the worker only ever knows about the handful
 * of URLs written by hand, and any route whose chunk was never fetched fails to
 * resolve while offline.
 *
 * Run automatically by `npm run build` (see package.json) and by the F-Droid /
 * CI recipes.
 */
import { readFile, writeFile, readdir, stat } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { createHash } from "node:crypto";

const DIST = process.env.DIST_DIR || "dist";
const SW = join(DIST, "sw.js");

/** Always available offline, even if an icon is missing from the build. */
const ALWAYS = ["/", "/index.html", "/manifest.webmanifest", "/pwa-192.png", "/favicon.ico"];

const walk = async (dir, root = dir) => {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full, root)));
    else out.push("/" + relative(root, full).split(sep).join("/"));
  }
  return out;
};

const main = async () => {
  let files;
  try {
    files = await walk(DIST);
  } catch {
    console.error(`[build-sw] ${DIST} not found — run vite build first`);
    process.exit(1);
  }

  const precache = [
    ...new Set([
      ...ALWAYS,
      ...files.filter((f) => /\.(js|css|woff2|png|jpg|jpeg|svg|webmanifest)$/i.test(f) && f !== "/sw.js"),
    ]),
  ].sort();

  const buildId = createHash("sha256").update(precache.join("|")).digest("hex").slice(0, 12);

  const template = await readFile(join("public", "sw.js"), "utf8");
  // The placeholder must occur exactly once. It used to appear in the file's
  // leading comment too, so a single-occurrence replace rewrote the comment and
  // shipped a worker whose precache list was still an unsubstituted token.
  const token = "__FURSAN_PRECACHE__";
  const occurrences = template.split(token).length - 1;
  if (occurrences !== 1) {
    console.error(`[build-sw] expected exactly one ${token} placeholder, found ${occurrences}`);
    process.exit(1);
  }

  const worker = template
    .replace(token, JSON.stringify(precache, null, 2))
    .replace("__BUILD_ID__", buildId);

  // A nested array here silently turns every precache URL into a malformed
  // request that resolves 404s, which is exactly what shipped once already.
  if (!/const PRECACHE = \[/m.test(worker) || /const PRECACHE = \[\s*\[/m.test(worker)) {
    console.error("[build-sw] precache list was not substituted correctly");
    process.exit(1);
  }

  await writeFile(SW, worker, "utf8");

  const size = (await stat(SW)).size;
  console.log(`[build-sw] precaching ${precache.length} assets (build ${buildId}), sw.js ${size} B`);
};

await main();