import { test, expect } from './fixtures'

test.describe('Integrations Management UI', () => {

  test('loads and displays the integrations page with title', async ({ page, api }) => {
    api.integrationsSyncStatus({
      jira: { configured: false, status: 'ready' },
      linear: { configured: false, status: 'ready' },
      github: { configured: false, status: 'ready' },
      lastSyncTime: new Date().toISOString(),
      syncHealth: 'healthy',
    })

    await page.goto('/#integrations')

    await expect(page.getByRole('heading', { name: 'Integrations' })).toBeVisible()
    await expect(page.getByText('Configure and manage connections to Jira, Linear, and GitHub.')).toBeVisible()
  })

  test('renders auth config panels for all 3 connectors', async ({ page, api }) => {
    api.integrationsSyncStatus({
      jira: { configured: false, status: 'ready' },
      linear: { configured: false, status: 'ready' },
      github: { configured: false, status: 'ready' },
      lastSyncTime: new Date().toISOString(),
      syncHealth: 'healthy',
    })

    await page.goto('/#integrations')

    await expect(page.getByText('Jira Configuration')).toBeVisible()
    await expect(page.getByText('Linear Configuration')).toBeVisible()
    await expect(page.getByText('GitHub Configuration')).toBeVisible()
    await expect(page.getByText('Authentication Configuration')).toBeVisible()
  })

  test('shows sync status dashboard after status fetch', async ({ page, api }) => {
    api.integrationsSyncStatus({
      jira: { configured: true, status: 'ready' },
      linear: { configured: true, status: 'ready' },
      github: { configured: false, status: 'ready' },
      lastSyncTime: new Date().toISOString(),
      syncHealth: 'healthy',
    })

    await page.goto('/#integrations')

    await expect(page.getByRole('heading', { name: 'Sync Status' })).toBeVisible()
    const table = page.getByRole('table', { name: /integration sync status/i })
    await expect(table).toBeVisible()
  })

  test('shows all three connectors in sync status table', async ({ page, api }) => {
    api.integrationsSyncStatus({
      jira: { configured: true, status: 'ready' },
      linear: { configured: true, status: 'ready' },
      github: { configured: true, status: 'ready' },
      lastSyncTime: new Date().toISOString(),
      syncHealth: 'healthy',
    })

    await page.goto('/#integrations')

    await expect(page.getByRole('cell', { name: 'Jira' })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'Linear' })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'GitHub' })).toBeVisible()
  })

  test('shows health badges for connectors', async ({ page, api }) => {
    api.integrationsSyncStatus({
      jira: { configured: true, status: 'ready' },
      linear: { configured: true, status: 'ready' },
      github: { configured: false, status: 'ready' },
      lastSyncTime: new Date().toISOString(),
      syncHealth: 'healthy',
    })

    await page.goto('/#integrations')

    const disconnected = page.getByRole('cell', { name: 'Disconnected' })
    await expect(disconnected).toHaveCount(1)
  })

  test('shows manual sync trigger panel', async ({ page, api }) => {
    api.integrationsSyncStatus({
      jira: { configured: true, status: 'ready' },
      linear: { configured: true, status: 'ready' },
      github: { configured: true, status: 'ready' },
      lastSyncTime: new Date().toISOString(),
      syncHealth: 'healthy',
    })

    await page.goto('/#integrations')

    await expect(page.getByRole('heading', { name: 'Manual Sync' })).toBeVisible()
    const syncButtons = page.getByRole('button', { name: 'Sync Now' })
    await expect(syncButtons).toHaveCount(3)
  })

  test('shows error state when status fetch fails', async ({ page, api }) => {
    api.integrationsSyncStatusError(500)

    await page.goto('/#integrations')

    await expect(page.getByText('Unable to load sync status')).toBeVisible()
  })

  test('allows testing connection via test connection buttons', async ({ page, api }) => {
    api.integrationsSyncStatus({
      jira: { configured: false, status: 'ready' },
      linear: { configured: false, status: 'ready' },
      github: { configured: false, status: 'ready' },
      lastSyncTime: new Date().toISOString(),
      syncHealth: 'healthy',
    })
    api.integrationsTestConnection('jira', { success: true })

    await page.goto('/#integrations')

    const testButtons = page.getByRole('button', { name: 'Test Connection' })
    await expect(testButtons).toHaveCount(3)

    // Test Jira connection
    await testButtons.first().click()
    await expect(page.getByText('Connection OK')).toBeVisible()
  })

  test('shows sync button disabled for disconnected connectors', async ({ page, api }) => {
    api.integrationsSyncStatus({
      jira: { configured: false, status: 'ready' },
      linear: { configured: false, status: 'ready' },
      github: { configured: false, status: 'ready' },
      lastSyncTime: new Date().toISOString(),
      syncHealth: 'healthy',
    })

    await page.goto('/#integrations')

    const syncButtons = page.getByRole('button', { name: 'Sync Now' })
    await expect(syncButtons.first()).toBeDisabled()
  })

  test('shows disconnected status for unconfigured connectors', async ({ page, api }) => {
    api.integrationsSyncStatus({
      jira: { configured: false, status: 'ready' },
      linear: { configured: false, status: 'ready' },
      github: { configured: false, status: 'ready' },
      lastSyncTime: new Date().toISOString(),
      syncHealth: 'healthy',
    })

    await page.goto('/#integrations')

    const disconnected = page.getByRole('cell', { name: 'Disconnected' })
    await expect(disconnected).toHaveCount(3)
  })

  test('no uncaught page errors during integration page interaction', async ({ page, api, pageErrors }) => {
    api.integrationsSyncStatus({
      jira: { configured: true, status: 'ready' },
      linear: { configured: true, status: 'ready' },
      github: { configured: true, status: 'ready' },
      lastSyncTime: new Date().toISOString(),
      syncHealth: 'healthy',
    })

    await page.goto('/#integrations')
    await expect(page.getByRole('heading', { name: 'Sync Status' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Manual Sync' })).toBeVisible()

    expect(pageErrors).toEqual([])
  })
})
