/* Interaction test: exercise core flows end-to-end */
import { chromium } from 'playwright';

const BASE = 'http://localhost:4173';
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();

const errors = [];
page.on('pageerror', (err) => errors.push(`PAGEERROR: ${String(err).slice(0, 200)}`));
page.on('console', (msg) => {
  const t = msg.type();
  if (t === 'error' && !msg.text().includes('ERR_CERT') && !msg.text().includes('WebSocket') && !msg.text().includes('503')) {
    errors.push(`CONSOLE: ${msg.text().slice(0, 200)}`);
  }
});

// 1. Home: start streak
await page.goto(`${BASE}/#/`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);
await page.screenshot({ path: 'scripts/shots/flow-1-home.png' });

const startBtn = page.getByRole('button', { name: /initiate protocol/i });
if (await startBtn.count()) {
  await startBtn.click();
  await page.waitForTimeout(1200);
  console.log('START STREAK: clicked');
} else {
  console.log('START STREAK: button not found');
}

const dayText = await page.locator('text=/Protocol Active/i').count();
console.log('PROTOCOL ACTIVE VISIBLE:', dayText > 0 ? 'YES' : 'NO');

// Reset flow via confirm dialog
const resetBtn = page.getByRole('button', { name: /reset sabr count/i }).first();
if (await resetBtn.count()) {
  await resetBtn.click();
  await page.waitForTimeout(600);
  const confirmBtn = page.getByRole('button', { name: /reset count/i }).last();
  if (await confirmBtn.count()) {
    await confirmBtn.click();
    await page.waitForTimeout(800);
    console.log('RESET FLOW: completed');
    await page.screenshot({ path: 'scripts/shots/flow-2-reset.png' });
  } else {
    console.log('RESET FLOW: confirm button not found');
    await page.screenshot({ path: 'scripts/shots/flow-2-reset-dialog.png' });
  }
}

// Start again so app is in active state
if (await page.getByRole('button', { name: /initiate protocol/i }).count()) {
  await page.getByRole('button', { name: /initiate protocol/i }).click();
  await page.waitForTimeout(800);
}

// 2. Settings dialog
await page.getByRole('button', { name: /open settings/i }).click();
await page.waitForTimeout(800);
await page.screenshot({ path: 'scripts/shots/flow-3-settings.png' });

// Expand Sector Settings section
const sector = page.getByRole('button', { name: /sector settings/i }).first();
if (await sector.count()) {
  await sector.click();
  await page.waitForTimeout(500);
  console.log('SETTINGS: sector expanded');
}
await page.keyboard.press('Escape');
await page.waitForTimeout(400);

// 3. Bottom nav to Journal
await page.getByRole('link', { name: 'Journal' }).click();
await page.waitForTimeout(2500);
console.log('JOURNAL NAV: ok');
await page.screenshot({ path: 'scripts/shots/flow-4-journal.png' });

// Open new log form
const newLog = page.getByRole('button', { name: /new log/i });
if (await newLog.count()) {
  await newLog.click();
  await page.waitForTimeout(700);
  const canType = await page.getByPlaceholder(/document your battle/i).count();
  console.log('JOURNAL FORM OPEN:', canType > 0 ? 'YES' : 'NO');
  // Type + save
  if (canType) {
    await page.getByPlaceholder(/document your battle/i).fill('Playwright test entry');
    await page.getByRole('button', { name: /archive log/i }).click();
    await page.waitForTimeout(1500);
    console.log('JOURNAL SAVE: attempted');
  }
}

// 4. Archives via nav
await page.getByRole('link', { name: 'History' }).click();
await page.waitForTimeout(2500);
await page.screenshot({ path: 'scripts/shots/flow-5-archives.png' });
console.log('ARCHIVES NAV: ok');

// 5. Chat page
await page.getByRole('link', { name: 'Chat' }).click();
await page.waitForTimeout(3500);
await page.screenshot({ path: 'scripts/shots/flow-6-chat.png' });
console.log('CHAT NAV: ok');

// 6. Health page chart renders?
await page.getByRole('link', { name: 'Health' }).click();
await page.waitForTimeout(3500);
const svgChart = await page.locator('.recharts-wrapper svg').count();
console.log('VITALS CHART RENDERED:', svgChart > 0 ? 'YES' : 'NO');
await page.screenshot({ path: 'scripts/shots/flow-7-vitals.png' });

// 7. Auth page validation
await page.goto(`${BASE}/#/auth`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1500);
await page.getByRole('button', { name: /generate random id/i }).click();
await page.waitForTimeout(2000);
console.log('AUTH GENERATE: done, url =', page.url());
await page.screenshot({ path: 'scripts/shots/flow-8-auth.png' });

console.log('\nJS ERRORS DURING FLOWS:', errors.length === 0 ? 'NONE' : JSON.stringify(errors, null, 1));
await browser.close();
