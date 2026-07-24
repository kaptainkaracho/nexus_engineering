import { test, expect } from './fixtures';

const SHOWCASE_SECTIONS = ['overview', 'buttons', 'forms', 'cards', 'artefacts'] as const;

test.describe('Navigation', () => {
  test('app header is always present on load', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('The Bike App')).toBeVisible();
  });

  test('discovery dashboard section renders its heading', async ({ page }) => {
    await page.goto('/#discovery');
    await expect(page.getByRole('heading', { name: 'Discovery Dashboard' })).toBeVisible();
  });

  test('repository section renders the file tree panel', async ({ page }) => {
    await page.goto('/#repository');
    await expect(page.getByRole('heading', { name: 'Files', level: 2 })).toBeVisible();
  });

  test('graph builder section renders its heading', async ({ page }) => {
    await page.goto('/#graph');
    await expect(page.getByRole('heading', { name: 'Graph Builder' })).toBeVisible();
  });

  test('no uncaught page errors during navigation', async ({ page, pageErrors }) => {
    await page.goto('/#overview');
    for (const section of ['buttons', 'cards', 'repository', 'discovery', 'graph', 'overview']) {
      await page.goto('/#' + section);
    }
    expect(pageErrors).toEqual([]);
  });
});

test.describe('Navigation — desktop main nav', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('hash navigation switches sections via the main nav', async ({ page }) => {
    for (const section of SHOWCASE_SECTIONS) {
      await page.goto('/#overview');
      const link = page
        .locator('nav[aria-label="Main navigation"] a[href="#' + section + '"]')
        .filter({ visible: true });
      await expect(link).toBeVisible();
      await link.click();
      await expect(page).toHaveURL(new RegExp('#' + section + '$'));
    }
  });
});

test.describe('Navigation — mobile hamburger menu', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('mobile hamburger menu navigates between sections', async ({ page }) => {
    await page.goto('/#overview');
    const menu = page.getByRole('button', { name: /open navigation menu/i });
    await expect(menu).toBeVisible();

    await menu.click();
    const link = page
      .getByRole('menu')
      .getByRole('link', { name: 'Discovery' })
      .filter({ visible: true });
    await expect(link).toBeVisible();
    await link.click();

    await expect(page).toHaveURL(/#discovery$/);
    await expect(page.getByRole('heading', { name: 'Discovery Dashboard' })).toBeVisible();
  });
});
