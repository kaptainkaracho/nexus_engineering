import { test, expect } from './fixtures';

test.describe('Forms', () => {
  test('shows inline validation error for an invalid email', async ({ page }) => {
    await page.goto('/#forms');
    const email = page.getByLabel('Email');
    await expect(email).toBeVisible();

    await email.fill('not-an-email');
    await expect(page.getByText('Please enter a valid email address')).toBeVisible();

    await email.fill('user@example.com');
    await expect(page.getByText('Please enter a valid email address')).toHaveCount(0);
  });

  test('save profile button shows saved feedback after submit', async ({ page }) => {
    await page.goto('/#forms');
    const save = page.getByRole('button', { name: /save profile/i });
    await save.click();
    await expect(page.getByRole('button', { name: /saved/i })).toBeVisible();
  });

  test('disabled inputs are not editable', async ({ page }) => {
    await page.goto('/#forms');
    const disabled = page.getByLabel('Team (disabled)');
    await expect(disabled).toBeDisabled();
  });
});
