import { test, expect, makeGateConfig, makeGateResult, makeGateViolation } from './fixtures';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('auth_session', JSON.stringify({
      user: { id: 'e2e-user', email: 'test@nexus.dev', name: 'E2E Test', role: 'user', createdAt: '2025-01-01T00:00:00Z' },
      token: 'e2e-token',
      expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
    }));
  });
});

test.describe('Trace Gate Configuration', () => {
  test('loads and displays the gate configuration panel', async ({ page, api }) => {
    api.gateConfig(makeGateConfig());

    await page.goto('/#trace-gate');

    await expect(page.getByRole('heading', { name: 'Trace Gate Configuration' })).toBeVisible();
    await expect(page.getByText('Coverage Threshold (%)')).toBeVisible();
    await expect(page.getByText('Maximum Allowed Gaps')).toBeVisible();
    await expect(page.getByText('Required Trace Link Types')).toBeVisible();
    await expect(page.getByText('Gate Mode')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save Configuration' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Test Gate' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reset' })).toBeVisible();
  });

  test('displays the default config in the form fields on load', async ({ page, api }) => {
    api.gateConfig(makeGateConfig({ coverageThreshold: 80, maxGaps: 0, mode: 'warn' }));

    await page.goto('/#trace-gate');

    const threshold = page.getByRole('spinbutton', { name: /coverage threshold/i });
    await expect(threshold).toHaveValue('80');

    const gaps = page.getByRole('spinbutton', { name: /maximum allowed gaps/i });
    await expect(gaps).toHaveValue('0');
  });

  test('shows error when saving configuration fails', async ({ page, api }) => {
    api.gateConfig(makeGateConfig());
    await page.route('**/api/traceability/gate-config', (route) => {
      if (route.request().method() === 'PUT') {
        route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'save failed' }) });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(makeGateConfig()) });
      }
    });

    await page.goto('/#trace-gate');

    await page.getByRole('button', { name: 'Save Configuration' }).click();

    await expect(page.getByRole('alert').filter({ hasText: /500/ })).toBeVisible();
  });

  test('shows a passing gate result with no violations', async ({ page, api }) => {
    api.gateConfig(makeGateConfig());
    api.gateResult(makeGateResult({ pass: true, mode: 'warn' }));

    await page.goto('/#trace-gate');
    await page.getByRole('button', { name: 'Test Gate' }).click();

    await expect(page.getByRole('status', { name: /gate pass/i })).toBeVisible();
    await expect(page.getByText('No violations — all policy rules satisfied.')).toBeVisible();
  });

  test('shows violations when gate fails due to low coverage', async ({ page, api }) => {
    const violation = makeGateViolation({
      rule: 'coverageThreshold',
      message: 'Coverage 45% is below threshold 80%',
      actual: 45,
      expected: 80,
    });
    api.gateConfig(makeGateConfig());
    api.gateResult(makeGateResult({
      pass: false,
      mode: 'warn',
      metrics: { coveragePercent: 45, gapCount: 0, missingTypes: [] },
      violations: [violation],
    }));

    await page.goto('/#trace-gate');
    await page.getByRole('button', { name: 'Test Gate' }).click();

    await expect(page.getByRole('status', { name: /gate fail/i })).toBeVisible();
    await expect(page.getByText('Violations (1)')).toBeVisible();
    await expect(page.getByText('Coverage 45% is below threshold 80%')).toBeVisible();
  });

  test('shows violations when gate fails due to excessive gaps', async ({ page, api }) => {
    const violation = makeGateViolation({
      rule: 'maxGaps',
      message: '3 gaps exceed the maximum of 0',
      actual: 3,
      expected: 0,
    });
    api.gateConfig(makeGateConfig({ maxGaps: 0 }));
    api.gateResult(makeGateResult({
      pass: false,
      mode: 'warn',
      metrics: { coveragePercent: 95, gapCount: 3, missingTypes: [] },
      config: makeGateConfig({ maxGaps: 0 }),
      violations: [violation],
    }));

    await page.goto('/#trace-gate');
    await page.getByRole('button', { name: 'Test Gate' }).click();

    await expect(page.getByRole('status', { name: /gate fail/i })).toBeVisible();
    await expect(page.getByText('3 gaps exceed the maximum of 0')).toBeVisible();
  });

  test('shows violations for missing required types', async ({ page, api }) => {
    const violation = makeGateViolation({
      rule: 'requireTypes',
      message: 'Missing required trace link types: testCase',
      actual: [],
      expected: ['testCase'],
    });
    api.gateConfig(makeGateConfig({ requireTypes: ['testCase'] }));
    api.gateResult(makeGateResult({
      pass: false,
      mode: 'warn',
      metrics: { coveragePercent: 95, gapCount: 0, missingTypes: ['testCase'] },
      config: makeGateConfig({ requireTypes: ['testCase'] }),
      violations: [violation],
    }));

    await page.goto('/#trace-gate');
    await page.getByRole('button', { name: 'Test Gate' }).click();

    await expect(page.getByRole('status', { name: /gate fail/i })).toBeVisible();
    await expect(page.getByText('Missing required trace link types: testCase')).toBeVisible();
  });

  test('warn mode badge shows FAIL (warn) on gate failure', async ({ page, api }) => {
    api.gateConfig(makeGateConfig({ mode: 'warn' }));
    api.gateResult(makeGateResult({
      pass: false,
      mode: 'warn',
      metrics: { coveragePercent: 45, gapCount: 0, missingTypes: [] },
      config: makeGateConfig({ mode: 'warn' }),
      violations: [makeGateViolation()],
    }));

    await page.goto('/#trace-gate');
    await page.getByRole('button', { name: 'Test Gate' }).click();

    await expect(page.getByRole('status', { name: 'Gate FAIL (warn)' })).toBeVisible();
  });

  test('block mode badge shows FAIL on gate failure', async ({ page, api }) => {
    api.gateConfig(makeGateConfig({ mode: 'block' }));
    api.gateResult(makeGateResult({
      pass: false,
      mode: 'block',
      metrics: { coveragePercent: 45, gapCount: 0, missingTypes: [] },
      config: makeGateConfig({ mode: 'block' }),
      violations: [makeGateViolation()],
    }));

    await page.goto('/#trace-gate');
    await page.getByRole('button', { name: 'Test Gate' }).click();

    await expect(page.getByRole('status', { name: 'Gate FAIL' })).toBeVisible();
  });

  test('block mode shows warning alert in the mode section', async ({ page, api }) => {
    api.gateConfig(makeGateConfig({ mode: 'warn' }));

    await page.goto('/#trace-gate');

    await page.getByText('Block — fail the CI job on gate failure').click();

    await expect(page.getByRole('alert').filter({ hasText: 'Block mode will fail CI' })).toBeVisible();
  });

  test('reset button restores original saved config', async ({ page, api }) => {
    api.gateConfig(makeGateConfig({ coverageThreshold: 80, maxGaps: 0 }));

    await page.goto('/#trace-gate');

    await page.getByRole('button', { name: 'Reset' }).click();

    const threshold = page.getByRole('spinbutton', { name: /coverage threshold/i });
    await expect(threshold).toHaveValue('80');

    const gaps = page.getByRole('spinbutton', { name: /maximum allowed gaps/i });
    await expect(gaps).toHaveValue('0');
  });

  test('shows error state when gate config fetch fails', async ({ page }) => {
    await page.route('**/api/traceability/gate-config', (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'server error' }) }),
    );

    await page.goto('/#trace-gate');

    await expect(page.getByRole('alert').filter({ hasText: /500/ })).toBeVisible();
  });

  test('shows error state when gate evaluation fails', async ({ page, api }) => {
    api.gateConfig(makeGateConfig());
    api.gateResultError(500);

    await page.goto('/#trace-gate');
    await page.getByRole('button', { name: 'Test Gate' }).click();

    await expect(page.getByRole('alert').filter({ hasText: /500/ })).toBeVisible();
  });

  test('no uncaught page errors during trace-gate navigation and interaction', async ({ page, api, pageErrors }) => {
    api.gateConfig(makeGateConfig());
    api.gateResult(makeGateResult({ pass: true }));

    await page.goto('/#trace-gate');
    await page.getByRole('button', { name: 'Test Gate' }).click();
    await expect(page.getByRole('status', { name: /gate pass/i })).toBeVisible();

    expect(pageErrors).toEqual([]);
  });
});
