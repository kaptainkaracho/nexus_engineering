import { test, expect } from './fixtures';

test.describe('Self-Hosted Deployment Smoke', () => {
  test('app shell renders without errors', async ({ page, pageErrors }) => {
    await page.goto('/');
    await expect(page.getByText('The Bike App')).toBeVisible();
    expect(pageErrors).toEqual([]);
  });

  test('hash navigation works for all basic sections', async ({ page }) => {
    const sections = [
      { hash: '#overview', heading: 'Button component' },
      { hash: '#discovery', heading: 'Discovery Dashboard' },
      { hash: '#repository', heading: 'Files' },
      { hash: '#graph', heading: 'Graph Builder' },
    ];

    for (const { hash, heading } of sections) {
      await page.goto('/' + hash);
      await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible({ timeout: 10_000 });
    }
  });

  test('no console errors on critical pages', async ({ page, consoleErrors }) => {
    const pages = ['/', '/#overview', '/#discovery', '/#repository'];
    for (const url of pages) {
      await page.goto(url);
      await page.waitForLoadState('networkidle');
    }
    expect(consoleErrors.filter((msg) => !msg.includes('favicon'))).toEqual([]);
  });

  test('app header and navigation are present', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('navigation')).toBeVisible();
    await expect(page.getByText('Design System v0.1')).toBeVisible();
  });
});
