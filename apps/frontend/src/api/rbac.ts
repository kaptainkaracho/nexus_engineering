/**
 * RBAC (Role-Based Access Control) API client
 *
 * Wraps all /api/roles, /api/permissions, /api/permission-sets,
 * and /api/users/roles endpoints for frontend use.
 */

import type {
  Role,
  Permission,
  PermissionSet,
  RoleWithPermissions,
  PermissionSetWithPermissions,
  CreateRoleRequest,
  UpdateRoleRequest,
  CreatePermissionSetRequest,
  UpdatePermissionSetRequest,
} from '@nexus-engineering/shared';

const BASE = import.meta.env.VITE_API_URL || '';

// ── Roles ────────────────────────────────────────────────────────────────

export interface RoleListResponse {
  roles: Role[]
  total: number
}

export async function fetchRoles(): Promise<RoleListResponse> {
  try {
    const res = await fetch(`${BASE}/api/roles`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const json = await res.json();
    return { roles: json.roles ?? [], total: json.total ?? json.roles?.length ?? 0 };
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('HTTP')) throw err;
    return { roles: [], total: 0 };
  }
}

export async function fetchRoleById(id: string): Promise<Role | null> {
  try {
    const res = await fetch(`${BASE}/api/roles/${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return res.json();
  } catch {
    return null;
  }
}

export async function createRole(data: CreateRoleRequest): Promise<Role | null> {
  try {
    const res = await fetch(`${BASE}/api/roles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return res.json();
  } catch {
    return null;
  }
}

export async function updateRole(id: string, data: UpdateRoleRequest): Promise<Role | null> {
  try {
    const res = await fetch(`${BASE}/api/roles/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return res.json();
  } catch {
    return null;
  }
}

export async function deleteRole(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/api/roles/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return true;
  } catch {
    return false;
  }
}

export async function fetchRolePermissions(id: string): Promise<RoleWithPermissions | null> {
  try {
    const res = await fetch(`${BASE}/api/roles/${encodeURIComponent(id)}/permissions`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const json = await res.json();
    return {
      id: '',
      name: '',
      description: null,
      isSystem: false,
      createdAt: '',
      permissions: json.permissions ?? [],
    } as RoleWithPermissions;
  } catch {
    return null;
  }
}

export async function setRolePermissions(
  id: string,
  permissionIds: string[],
): Promise<RoleWithPermissions | null> {
  try {
    const res = await fetch(`${BASE}/api/roles/${encodeURIComponent(id)}/permissions`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permissionIds }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const json = await res.json();
    return json as RoleWithPermissions;
  } catch {
    return null;
  }
}

// ── Permissions (list all available) ─────────────────────────────────────

export interface PermissionListResponse {
  permissions: Permission[]
  total: number
}

export async function fetchPermissions(): Promise<PermissionListResponse> {
  try {
    const res = await fetch(`${BASE}/api/permissions`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const json = await res.json();
    return { permissions: json.permissions ?? [], total: json.total ?? json.permissions?.length ?? 0 };
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('HTTP')) throw err;
    return { permissions: [], total: 0 };
  }
}

// ── Permission Sets ──────────────────────────────────────────────────────

export interface PermissionSetListResponse {
  permissionSets: PermissionSet[]
  total: number
}

export async function fetchPermissionSets(): Promise<PermissionSetListResponse> {
  try {
    const res = await fetch(`${BASE}/api/permission-sets`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const json = await res.json();
    return { permissionSets: json.permissionSets ?? [], total: json.total ?? json.permissionSets?.length ?? 0 };
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('HTTP')) throw err;
    return { permissionSets: [], total: 0 };
  }
}

export async function fetchPermissionSetById(id: string): Promise<PermissionSet | null> {
  try {
    const res = await fetch(`${BASE}/api/permission-sets/${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return res.json();
  } catch {
    return null;
  }
}

export async function createPermissionSet(data: CreatePermissionSetRequest): Promise<PermissionSet | null> {
  try {
    const res = await fetch(`${BASE}/api/permission-sets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return res.json();
  } catch {
    return null;
  }
}

export async function updatePermissionSet(id: string, data: UpdatePermissionSetRequest): Promise<PermissionSet | null> {
  try {
    const res = await fetch(`${BASE}/api/permission-sets/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return res.json();
  } catch {
    return null;
  }
}

export async function deletePermissionSet(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/api/permission-sets/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return true;
  } catch {
    return false;
  }
}

export async function fetchPermissionSetPermissions(id: string): Promise<PermissionSetWithPermissions | null> {
  try {
    const res = await fetch(`${BASE}/api/permission-sets/${encodeURIComponent(id)}/permissions`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const json = await res.json();
    return {
      id: '',
      name: '',
      description: null,
      createdAt: '',
      updatedAt: '',
      permissions: json.permissions ?? [],
    } as PermissionSetWithPermissions;
  } catch {
    return null;
  }
}

export async function setPermissionSetPermissions(
  id: string,
  permissionIds: string[],
): Promise<PermissionSetWithPermissions | null> {
  try {
    const res = await fetch(`${BASE}/api/permission-sets/${encodeURIComponent(id)}/permissions`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permissionIds }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const json = await res.json();
    return json as PermissionSetWithPermissions;
  } catch {
    return null;
  }
}

// ── User Role Assignment ─────────────────────────────────────────────────

export interface UserWithRole {
  id: string
  email: string
  displayName: string | null
  roleId: string
  isActive: boolean
  emailVerified: boolean
  createdAt: string
  updatedAt: string
  role?: Role
}

export interface UsersWithRolesResponse {
  users: UserWithRole[]
  total: number
}

export async function fetchUsersWithRoles(): Promise<UsersWithRolesResponse> {
  try {
    const res = await fetch(`${BASE}/api/users/roles`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const json = await res.json();
    return { users: json.users ?? [], total: json.total ?? json.users?.length ?? 0 };
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('HTTP')) throw err;
    return { users: [], total: 0 };
  }
}

export async function updateUserRole(userId: string, roleId: string): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/api/users/${encodeURIComponent(userId)}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roleId }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return true;
  } catch {
    return false;
  }
}
