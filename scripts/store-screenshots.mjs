/* Capture store screenshots at 2x for crisp F-Droid listing */
import { chromium } from 'playwright';

const BASE = 'http://localhost:4173';
const OUT = 'fastlane/metadata/android/en-US/images/phoneScreenshots';
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
});
const page = await context.newPage();

// 1. Home (start streak for active view)
await page.goto(`${BASE}/#/`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3500);
const startBtn = page.getByRole('button', { name: /initiate protocol/i });
if (await startBtn.count()) { await startBtn.click(); await page.waitForTimeout(1500); }
await page.screenshot({ path: `${OUT}/1.png` });

// 2. Journal
await page.getByRole('link', { name: 'Journal' }).click();
await page.waitForTimeout(2500);
await page.screenshot({ path: `${OUT}/2.png` });

// 3. Chat
await page.getByRole('link', { name: 'Chat' }).click();
await page.waitForTimeout(3500);
await page.screenshot({ path: `${OUT}/3.png` });

// 4. Health
await page.getByRole('link', { name: 'Health' }).click();
await page.waitForTimeout(4000);
await page.screenshot({ path: `${OUT}/4.png` });

// 5. History
await page.getByRole('link', { name: 'History' }).click();
await page.waitForTimeout(3000);
await page.screenshot({ path: `${OUT}/5.png` });

console.log('screenshots captured');
await browser.close();
