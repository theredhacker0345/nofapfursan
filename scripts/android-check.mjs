/**
 * Android project integrity check.
 *
 * The APK cannot be compiled in a sandbox that blocks Maven Central, so this
 * asserts the invariants a Gradle build would otherwise only catch after a long
 * download: every resource the manifest and the Capacitor plugins name actually
 * exists, the identity/version is consistent across Capacitor, Gradle, the app
 * label and package.json, and the signing material can never be committed.
 *
 * This is not a substitute for building. It is the part that fails silently.
 *
 *   node scripts/android-check.mjs
 */
import { readFile, readdir, stat } from "node:fs/promises";
import { join } from "node:path";

const ROOT = "android";
const RES = join(ROOT, "app/src/main/res");
const APP_BUILD_GRADLE = join(ROOT, "app/build.gradle");

let failures = 0;
let passes = 0;
const log = (ok, name, detail) => {
  if (ok) {
    passes++;
    console.log(`  ok   ${name}`);
  } else {
    failures++;
    console.log(`  FAIL ${name}${detail ? `\n       ${detail}` : ""}`);
  }
};

const walk = async (dir, out = []) => {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) await walk(full, out);
    else out.push(full);
  }
  return out;
};

const main = async () => {
  const pkg = JSON.parse(await readFile("package.json", "utf8"));
  const resFiles = await walk(RES);
  const values = await readFile(join(RES, "values/strings.xml"), "utf8");
  const manifest = await readFile(join(ROOT, "app/src/main/AndroidManifest.xml"), "utf8");
  const gradle = await readFile(APP_BUILD_GRADLE, "utf8");
  const capConfig = await readFile("capacitor.config.ts", "utf8");
  const gitignore = await readFile(join(ROOT, ".gitignore"), "utf8");
  const releaseWorkflow = await readFile(".github/workflows/release.yml", "utf8");

  /* ── 1. Every resource the manifest names must exist ────────────────── */
  const refs = [...manifest.matchAll(/"@([a-z]+)\/([A-Za-z0-9_]+)"/g)].map((m) => ({
    type: m[1],
    name: m[2],
  }));
  // Android resolves a resource either from a file in a `<type>[-qualifier]`
  // directory (mipmap-anydpi-v26, drawable-night, …) or from a `<type name="…">`
  // declaration inside any values XML. Matching on an exact directory name
  // misses every qualified variant, and @string/* never matches a filename at
  // all because it lives in values/strings.xml.
  const valuesXml = [];
  for (const file of resFiles) {
    if (file.includes("/values") && file.endsWith(".xml")) {
      valuesXml.push(await readFile(file, "utf8"));
    }
  }

  const hasResource = (type, name) => {
    const fileHit = resFiles.some((f) => {
      const dir = f.slice(0, f.lastIndexOf("/")).split("/").pop();
      const base = f.slice(f.lastIndexOf("/") + 1).replace(/\.[^.]+$/, "");
      return dir === type || dir.startsWith(`${type}-`);
    }) && resFiles.some((f) => {
      const dir = f.slice(0, f.lastIndexOf("/")).split("/").pop();
      const base = f.slice(f.lastIndexOf("/") + 1).replace(/\.[^.]+$/, "");
      return (dir === type || dir.startsWith(`${type}-`)) && base === name;
    });

    const valueHit = valuesXml.some((xml) =>
      new RegExp(`<${type}\\s[^>]*name="${name}"`).test(xml),
    );
    return fileHit || valueHit;
  };

  const missing = refs.filter((r) => !hasResource(r.type, r.name));
  log(
    refs.length > 0 && missing.length === 0,
    `every @type/name in AndroidManifest.xml resolves (${refs.length} refs)`,
    JSON.stringify(missing),
  );

  /* ── 2. Resources the app's code names must exist ───────────────────── */
  // `smallIcon` is passed as a bare string, so nothing type-checks it. A
  // non-existent drawable makes every native schedule() call throw, and the
  // catch swallows it — reminders silently never work.
  // Only Capacitor's `smallIcon` option names an Android drawable from a
  // string. A looser `icon:` pattern also matches the lucide icon map in
  // MilestoneIcon.tsx, which has nothing to do with Android.
  const sourceFiles = (await walk("src")).filter((f) => f.endsWith(".ts") || f.endsWith(".tsx"));
  const drawableRefs = new Set();
  for (const file of sourceFiles) {
    const text = await readFile(file, "utf8");
    for (const m of text.matchAll(/smallIcon:\s*"([A-Za-z0-9_]+)"/g)) drawableRefs.add(m[1]);
  }
  const missingIcons = [...drawableRefs].filter((name) => !hasResource("drawable", name));
  log(
    drawableRefs.size > 0 && missingIcons.length === 0,
    `every notification icon named in src/ exists as a drawable (${drawableRefs.size} refs)`,
    JSON.stringify(missingIcons),
  );

  /* ── 3. Identity is consistent everywhere ────────────────────────────── */
  const appId = (capConfig.match(/appId:\s*'([^']+)'/) ?? [])[1];
  const appName = (capConfig.match(/appName:\s*'([^']+)'/) ?? [])[1];
  const gradleAppId = (gradle.match(/applicationId\s+"([^"]+)"/) ?? [])[1];
  const namespace = (gradle.match(/namespace\s*=\s*"([^"]+)"/) ?? [])[1];
  const stringsPackage = (values.match(/<string name="package_name">([^<]+)</) ?? [])[1];
  const stringsAppName = (values.match(/<string name="app_name">([^<]+)</) ?? [])[1];

  log(
    !!appId && appId === gradleAppId && appId === namespace && appId === stringsPackage,
    "the applicationId matches Capacitor, Gradle, the namespace and strings.xml",
    `${appId} / ${gradleAppId} / ${namespace} / ${stringsPackage}`,
  );
  log(
    !!appName && appName === stringsAppName,
    "the launcher label matches capacitor.config.ts appName",
    `${appName} vs ${stringsAppName}`,
  );

  /* ── 4. One version, from package.json ──────────────────────────────── */
  const hardCodedVersion = (gradle.match(/versionName\s+"([^"]+)"/) ?? [])[1];
  log(
    !hardCodedVersion,
    "versionName is not hard-coded in build.gradle",
    hardCodedVersion ? `found ${hardCodedVersion}` : "derived from package.json",
  );
  log(
    gradle.includes('rootProject.file("../package.json")'),
    "build.gradle reads the version from package.json",
  );
  log(
    !/APP_VERSION\s*=\s*"[0-9]/.test(await readFile("src/data/version.ts", "utf8")),
    "the in-app version is injected at build time, not a second hard-coded copy",
  );

  /* ── 5. Signing material can never be committed ─────────────────────── */
  for (const pattern of ["*.jks", "*.keystore", "keystore.properties"]) {
    log(
      new RegExp(`^${pattern.replace(/[.*]/g, "\\$&")}$`, "m").test(gitignore),
      `android/.gitignore ignores ${pattern}`,
    );
  }
  const ciWritesKeystore = releaseWorkflow.includes("release-keystore.jks");
  log(ciWritesKeystore, "release.yml writes the keystore into the android/ tree");
  log(
    releaseWorkflow.includes("android/app/release-keystore.jks") &&
      /storeFile file\(keystoreProperties/.test(gradle) &&
      !gradle.includes('storeFile file("app/'),
    "the keystore path CI writes is the one build.gradle reads",
    "build.gradle previously prefixed it with app/, resolving to android/app/app/",
  );
  log(
    gradle.includes("GradleException"),
    "a release build fails loudly when signing material is absent",
  );

  /* ── 6. Permissions the app's features need ─────────────────────────── */
  log(
    manifest.includes("android.permission.POST_NOTIFICATIONS"),
    "POST_NOTIFICATIONS is declared (reminders are a shipped feature)",
  );
  log(
    manifest.includes('android:usesCleartextTraffic="false"'),
    "cleartext traffic stays disabled",
  );

  /* ── 7. Web assets are copied, not stale ────────────────────────────── */
  const capAssets = join(ROOT, "app/src/main/assets/public/index.html");
  const capExists = await stat(capAssets).then(
    (s) => s.size > 0,
    () => false,
  );
  log(capExists, "capacitor has copied the built web assets into android/");

  console.log(`\n── android ───────────────────────────────────────────`);
  console.log(`${passes} passed, ${failures} failed`);
  console.log(
    "\nnote: this does not compile the APK. Gradle needs Maven Central, which a\n" +
      "sandboxed environment usually blocks — treat a green run here as 'the\n" +
      "configuration is coherent', not as 'the app builds'.\n",
  );
  if (failures > 0) process.exitCode = 1;
};

await main();