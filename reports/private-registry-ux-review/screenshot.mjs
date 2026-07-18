import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const url = 'http://localhost:5173';
const outputDir = '/home/chris/Paperclip-Projects/Nexus/reports/private-registry-ux-review';

mkdirSync(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });

// Desktop
const desktopCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const desktopPage = await desktopCtx.newPage();
await desktopPage.goto(url, { waitUntil: 'networkidle' });
await desktopPage.evaluate(() => { window.location.hash = '#registries'; });
await desktopPage.waitForTimeout(2000);
await desktopPage.waitForLoadState('networkidle');
await desktopPage.screenshot({ path: `${outputDir}/registries-desktop.png`, fullPage: true });

const addBtn = desktopPage.locator('text=Add Registry');
if (await addBtn.isVisible()) {
  await addBtn.click();
  await desktopPage.waitForTimeout(500);
  await desktopPage.screenshot({ path: `${outputDir}/registries-modal-desktop.png`, fullPage: true });
}

// Mobile
const mobileCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const mobilePage = await mobileCtx.newPage();
await mobilePage.goto(url, { waitUntil: 'networkidle' });
await mobilePage.evaluate(() => { window.location.hash = '#registries'; });
await mobilePage.waitForTimeout(2000);
await mobilePage.screenshot({ path: `${outputDir}/registries-mobile.png`, fullPage: true });

await browser.close();
console.log('Done');
