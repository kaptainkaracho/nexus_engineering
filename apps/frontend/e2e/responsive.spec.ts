import { test, expect, makeArtifact } from './fixtures';

const MOBILE_VIEWPORT = { width: 375, height: 812 };
const SECTIONS = ['overview', 'forms', 'cards', 'repository', 'discovery', 'graph'] as const;

test.describe('Responsive layout', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  for (const section of SECTIONS) {
    test(`no horizontal overflow on #${section} at 375px`, async ({ page, api }) => {
      api.registry();
      api.graph();
      await page.goto('/#' + section);
      await page.getByRole('heading', { level: 1 }).first().waitFor();

      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth - document.documentElement.clientWidth;
      });
      expect(overflow, `horizontal overflow of ${overflow}px on #${section}`).toBeLessThanOrEqual(1);
    });
  }

  test('discovery detail panel fits within the viewport on mobile', async ({ page, api }) => {
    api.registry({ data: [makeArtifact({ id: 'a1', fileName: 'REQ-1.md' })] });
    await page.goto('/#discovery');
    await page.getByRole('listitem').filter({ hasText: 'REQ-1.md' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const box = await dialog.boundingBox();
    expect(box?.width ?? 0).toBeLessThanOrEqual(MOBILE_VIEWPORT.width + 1);
  });
});
