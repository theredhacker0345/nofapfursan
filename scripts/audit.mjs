/* Playwright audit: crawl all routes, capture console errors, page errors,
   failed requests, and run basic UX checks (touch targets, horizontal
   overflow, missing labels). Run with: node scripts/audit.mjs */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE = process.env.AUDIT_BASE || 'http://localhost:4173';
const ROUTES = ['/', '/auth', '/journal', '/vitals', '/archives', '/vanguard', '/community', '/profile', '/join', '/does-not-exist'];

const outDir = path.join(process.cwd(), 'scripts', 'shots');
fs.mkdirSync(outDir, { recursive: true });

const results = [];

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 }, // iPhone-ish mobile viewport
});

for (const route of ROUTES) {
  const page = await context.newPage();
  const entry = { route, consoleErrors: [], pageErrors: [], failedRequests: [], notes: [] };

  page.on('console', (msg) => {
    if (msg.type() === 'error') entry.consoleErrors.push(msg.text().slice(0, 300));
  });
  page.on('pageerror', (err) => entry.pageErrors.push(String(err).slice(0, 300)));
  page.on('requestfailed', (req) => {
    const failure = req.failure()?.errorText || '';
    if (!failure.includes('ERR_ABORTED')) {
      entry.failedRequests.push(`${req.url().slice(0, 120)} -> ${failure}`);
    }
  });

  try {
    await page.goto(`${BASE}/#${route}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(3500); // allow lazy chunks + async loads

    // Horizontal overflow check (mobile)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (overflow > 2) entry.notes.push(`HORIZONTAL OVERFLOW: ${overflow}px`);

    // Small touch targets check on buttons/links
    const smallTargets = await page.evaluate(() => {
      const els = [...document.querySelectorAll('button, a, [role="button"]')];
      return els.filter(el => {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return false;
        return r.width < 32 || r.height < 32;
      }).map(el => ({
        tag: el.tagName.toLowerCase(),
        text: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 40),
        w: Math.round(el.getBoundingClientRect().width),
        h: Math.round(el.getBoundingClientRect().height),
      }));
    });
    if (smallTargets.length) entry.notes.push(`SMALL TOUCH TARGETS (<32px): ${JSON.stringify(smallTargets.slice(0, 8))}`);

    // Icon-only buttons without accessible name
    const unnamedButtons = await page.evaluate(() => {
      return [...document.querySelectorAll('button')].filter(b => {
        const name = (b.getAttribute('aria-label') || b.textContent || '').trim();
        const hasImg = b.querySelector('img');
        return !name && !hasImg;
      }).map(b => (b.innerHTML || '').slice(0, 60));
    });
    if (unnamedButtons.length) entry.notes.push(`UNNAMED BUTTONS: ${JSON.stringify(unnamedButtons.slice(0, 6))}`);

    // Images without alt
    const badImages = await page.evaluate(() =>
      [...document.querySelectorAll('img:not([alt])')].map(i => i.src.slice(0, 100))
    );
    if (badImages.length) entry.notes.push(`IMAGES WITHOUT ALT: ${JSON.stringify(badImages)}`);

    // Screenshot for the record
    await page.screenshot({ path: path.join(outDir, `${route.replace(/\//g, '_') || 'root'}.png`), fullPage: false });
  } catch (e) {
    entry.notes.push(`NAVIGATION/TIMEOUT ISSUE: ${String(e).slice(0, 200)}`);
  }

  results.push(entry);
  await page.close();
}

await browser.close();

// Summary
let issues = 0;
for (const r of results) {
  const hasProblems = r.consoleErrors.length || r.pageErrors.length || r.failedRequests.length || r.notes.length;
  console.log(`\n=== ${r.route} ${hasProblems ? '[ISSUES]' : '[OK]'} ===`);
  if (r.pageErrors.length) { issues++; console.log('  PAGE ERRORS:', JSON.stringify(r.pageErrors, null, 1)); }
  if (r.consoleErrors.length) { issues++; console.log('  CONSOLE ERRORS:', JSON.stringify([...new Set(r.consoleErrors)].slice(0, 5), null, 1)); }
  if (r.failedRequests.length) { console.log('  FAILED REQUESTS:', JSON.stringify([...new Set(r.failedRequests)].slice(0, 5), null, 1)); }
  for (const n of r.notes) { issues++; console.log('  NOTE:', n); }
}
console.log(`\nTotal findings: ${issues}`);
fs.writeFileSync(path.join(outDir, 'audit-results.json'), JSON.stringify(results, null, 2));
