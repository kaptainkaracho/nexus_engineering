import { test, expect, type RbacRole, type RbacPermission } from './fixtures';

const MOCK_ROLES: RbacRole[] = [
  { id: 'role_admin', name: 'admin', description: 'Full system access', isSystem: true, createdAt: '2025-01-01T00:00:00Z' },
  { id: 'role_dev', name: 'developer', description: 'Development access', isSystem: true, createdAt: '2025-01-01T00:00:00Z' },
  { id: 'role_viewer', name: 'viewer', description: 'Read-only access', isSystem: true, createdAt: '2025-01-01T00:00:00Z' },
  { id: 'role_analyst', name: 'analyst', description: 'Analyst access', isSystem: true, createdAt: '2025-01-01T00:00:00Z' },
  { id: 'role_custom_1', name: 'custom-editor', description: 'Custom editor role', isSystem: false, createdAt: '2025-06-01T00:00:00Z' },
];

const MOCK_PERMISSIONS: RbacPermission[] = [
  { id: 'perm_1', name: 'users:read', description: 'Read users', resource: 'users', action: 'read' },
  { id: 'perm_2', name: 'users:write', description: 'Write users', resource: 'users', action: 'write' },
  { id: 'perm_3', name: 'roles:read', description: 'Read roles', resource: 'roles', action: 'read' },
  { id: 'perm_4', name: 'roles:write', description: 'Write roles', resource: 'roles', action: 'write' },
  { id: 'perm_5', name: 'requirements:read', description: 'Read requirements', resource: 'requirements', action: 'read' },
];

const MOCK_USERS = [
  { id: 'user_1', email: 'alice@nexus.dev', displayName: 'Alice', roleId: 'role_admin', isActive: true, emailVerified: true, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'user_2', email: 'bob@nexus.dev', displayName: 'Bob', roleId: 'role_dev', isActive: true, emailVerified: true, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
];

test.describe('RBAC — Role Management', () => {
  test.beforeEach(async ({ page, api }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem('auth_session', JSON.stringify({
        user: { id: 'admin-1', email: 'admin@nexus.dev', name: 'Admin', role: 'admin', createdAt: '2025-01-01T00:00:00Z' },
        token: 'admin-token',
        expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
      }));
    });
    api.roles({ roles: MOCK_ROLES, total: MOCK_ROLES.length });
    api.permissions({ permissions: MOCK_PERMISSIONS, total: MOCK_PERMISSIONS.length });
    api.usersWithRoles({ users: MOCK_USERS, total: MOCK_USERS.length });
  });

  test('renders role list with all roles', async ({ page }) => {
    await page.goto('/#roles');
    await expect(page.getByText('Role Management')).toBeVisible();
    await expect(page.getByRole('row', { name: 'Role: admin' })).toBeVisible();
    await expect(page.getByRole('row', { name: 'Role: developer' })).toBeVisible();
    await expect(page.getByRole('row', { name: 'Role: viewer' })).toBeVisible();
    await expect(page.getByRole('row', { name: 'Role: analyst' })).toBeVisible();
    await expect(page.getByRole('row', { name: 'Role: custom-editor' })).toBeVisible();
  });

  test('selecting a role shows permissions panel', async ({ page }) => {
    await page.goto('/#roles');
    await page.getByRole('row', { name: 'Role: developer' }).click();
    await expect(page.getByText(/Permissions for/)).toBeVisible();
  });

  test('create role button is present and accessible', async ({ page }) => {
    await page.goto('/#roles');
    await page.waitForLoadState('networkidle');
    const btn = page.getByRole('button', { name: 'Create Role' });
    await expect(btn).toBeVisible();
    await expect(btn).toBeEnabled();
  });

  test('edit button is present for custom roles, disabled for system roles', async ({ page }) => {
    await page.goto('/#roles');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('button', { name: /Edit.*custom-editor/ })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit admin' })).toBeDisabled();
  });

  test('delete button is disabled for system roles', async ({ page }) => {
    await page.goto('/#roles');
    await expect(page.getByRole('button', { name: 'Delete admin' })).toBeDisabled();
  });

  test('deletes a custom role', async ({ page, api }) => {
    api.deleteRole('role_custom_1');
    await page.goto('/#roles');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Delete custom-editor' }).click();
    await expect(page.getByRole('dialog', { name: 'Confirm delete' })).toBeVisible();
    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(page.getByText(/deleted successfully/)).toBeVisible();
  });

  test('user role assignment section renders with users', async ({ page }) => {
    await page.goto('/#roles');
    await expect(page.getByText('User Role Assignment')).toBeVisible();
    await expect(page.getByText('alice@nexus.dev')).toBeVisible();
    await expect(page.getByText('bob@nexus.dev')).toBeVisible();
  });

  test('no uncaught page errors', async ({ page, pageErrors }) => {
    await page.goto('/#roles');
    await page.waitForLoadState('networkidle');
    expect(pageErrors).toEqual([]);
  });
});
