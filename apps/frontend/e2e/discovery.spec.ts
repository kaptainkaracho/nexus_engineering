import { test, expect, makeArtifact, makeSummary } from './fixtures';

test.describe('Discovery Dashboard', () => {
  test('renders artifacts returned by the registry', async ({ page, api }) => {
    api.registry({
      data: [
        makeArtifact({
          id: 'a1',
          fileName: 'REQ-1.md',
          relativePath: 'requirements/REQ-1.md',
          type: 'requirement',
          lifecycle: 'discovered',
        }),
        makeArtifact({
          id: 'a2',
          fileName: 'ARCH-1.md',
          relativePath: 'architecture/ARCH-1.md',
          type: 'architecture',
          lifecycle: 'parsed',
        }),
      ],
      summary: makeSummary({
        total: 2,
        byType: { requirement: 1, architecture: 1, adr: 0, spec: 0, unknown: 0 },
        byLifecycle: { discovered: 1, parsed: 1, indexed: 0, related: 0, error: 0 },
      }),
    });

    await page.goto('/#discovery');
    await expect(page.getByRole('heading', { name: 'Discovery Dashboard' })).toBeVisible();
    await expect(page.getByRole('listitem').filter({ hasText: 'REQ-1.md' })).toBeVisible();
    await expect(page.getByRole('listitem').filter({ hasText: 'ARCH-1.md' })).toBeVisible();
  });

  test('opens the artifact detail panel when an artifact is selected', async ({ page, api }) => {
    api.registry({ data: [makeArtifact({ id: 'a1', fileName: 'REQ-1.md' })] });

    await page.goto('/#discovery');
    await page.getByRole('listitem').filter({ hasText: 'REQ-1.md' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('REQ-1.md');
    await expect(dialog).toContainText('a1');

    await dialog.getByRole('button', { name: /close artifact details/i }).click();
    await expect(dialog).toHaveCount(0);
  });

  test('closes the detail panel with the Escape key', async ({ page, api }) => {
    api.registry({ data: [makeArtifact({ id: 'a1', fileName: 'REQ-1.md' })] });

    await page.goto('/#discovery');
    await page.getByRole('listitem').filter({ hasText: 'REQ-1.md' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
  });

  test('shows an error state when the registry request fails', async ({ page, api }) => {
    api.registryError();
    await page.goto('/#discovery');
    await expect(page.getByText(/error loading artifact registry/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /retry/i })).toBeVisible();
  });

  test('shows an empty state when the registry is empty', async ({ page, api }) => {
    api.registry({ data: [] });
    await page.goto('/#discovery');
    await expect(page.getByRole('heading', { name: 'Discovery Dashboard' })).toBeVisible();
    await expect(page.locator('#artifact-browser-heading')).toBeVisible();
  });
});
