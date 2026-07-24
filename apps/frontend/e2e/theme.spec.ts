import { test, expect } from './fixtures';

test.describe('Theme', () => {
  test('toggles dark mode on the document element', async ({ page }) => {
    await page.goto('/');
    const toggle = page.getByRole('button', { name: /switch to (dark|light) mode/i });
    await expect(toggle).toBeVisible();

    await toggle.click();
    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect(page.getByRole('button', { name: /switch to light mode/i })).toBeVisible();

    await toggle.click();
    await expect(page.locator('html')).not.toHaveClass(/dark/);
  });

  test('keyboard users can reach and activate the theme toggle', async ({ page }) => {
    await page.goto('/');
    const toggle = page.getByRole('button', { name: /switch to (dark|light) mode/i });
    await toggle.focus();
    await expect(toggle).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('html')).toHaveClass(/dark/);
  });
});
