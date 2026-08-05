import { test, expect } from '@playwright/test';

test('User Guide desktop', async ({ page }) => {
  await page.goto('http://localhost:5173/#user-guide', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/home/chris/Paperclip-Projects/Nexus/reports/userguide-desktop.png', fullPage: true });
  expect(page.locator('h1:text-is("User Guide")')).toBeVisible();
});

test('User Guide mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://localhost:5173/#user-guide', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/home/chris/Paperclip-Projects/Nexus/reports/userguide-mobile.png', fullPage: true });
  expect(page.locator('h1:text-is("User Guide")')).toBeVisible();
});
