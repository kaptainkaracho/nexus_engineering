import { randomBytes } from 'node:crypto'
import { getAuthDatabase } from '../auth/database'
import { AppError } from '../lib/errorHandler'
import type { RoleWithPermissions, PermissionSetWithPermissions, Role, PermissionSet } from '@nexus-engineering/shared'
import type { PermissionRow } from '../auth/database'

function generateId(): string {
  return randomBytes(16).toString('hex')
}

function mapRole(row: { id: string; name: string; description: string | null; is_system: number; created_at: string }): Role {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    isSystem: row.is_system === 1,
    createdAt: row.created_at,
  }
}

function mapPermissionSet(row: { id: string; name: string; description: string | null; created_at: string; updated_at: string }): PermissionSet {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapPermission(p: PermissionRow): { id: string; name: string; description: string | null; resource: string; action: string } {
  return { id: p.id, name: p.name, description: p.description, resource: p.resource, action: p.action }
}

export const rbacRepository = {
  // --- Roles ---

  listRoles(): Role[] {
    const db = getAuthDatabase()
    return db.listRoles().map(mapRole)
  },

  getRole(id: string): RoleWithPermissions | null {
    const db = getAuthDatabase()
    const row = db.findRoleById(id)
    if (!row) return null
    const permissions = db.getPermissionsForRole(id).map(mapPermission)
    return { ...mapRole(row), permissions }
  },

  createRole(name: string, description: string | null, permissionIds?: string[]): RoleWithPermissions {
    const db = getAuthDatabase()
    if (!name || name.trim().length === 0) {
      throw new AppError(400, 'Role name is required')
    }
    if (!/^[a-z0-9_-]+$/.test(name)) {
      throw new AppError(400, 'Role name must contain only lowercase letters, numbers, hyphens, and underscores')
    }
    const existing = db.findRoleByName(name)
    if (existing) {
      throw new AppError(409, `Role '${name}' already exists`)
    }
    const id = `role_${generateId()}`
    const role = db.createRole({ id, name: name.trim(), description })
    if (permissionIds && permissionIds.length > 0) {
      db.setRolePermissions(id, permissionIds)
    }
    const permissions = db.getPermissionsForRole(id).map(mapPermission)
    return { ...mapRole(role), permissions }
  },

  updateRole(id: string, name?: string, description?: string | null): RoleWithPermissions | null {
    const db = getAuthDatabase()
    const existing = db.findRoleById(id)
    if (!existing) return null
    if (existing.is_system) {
      throw new AppError(403, 'System roles cannot be modified')
    }
    if (name !== undefined) {
      if (!/^[a-z0-9_-]+$/.test(name)) {
        throw new AppError(400, 'Role name must contain only lowercase letters, numbers, hyphens, and underscores')
      }
      const dup = db.findRoleByName(name)
      if (dup && dup.id !== id) {
        throw new AppError(409, `Role '${name}' already exists`)
      }
    }
    db.updateRole(id, { name, description })
    const role = this.getRole(id)
    if (!role) return null
    const permissions = db.getPermissionsForRole(id).map(mapPermission)
    return { ...role, permissions }
  },

  deleteRole(id: string): boolean {
    const db = getAuthDatabase()
    return db.deleteRole(id)
  },

  setRolePermissions(id: string, permissionIds: string[]): RoleWithPermissions | null {
    const db = getAuthDatabase()
    const role = db.findRoleById(id)
    if (!role) return null
    db.setRolePermissions(id, permissionIds)
    const permissions = db.getPermissionsForRole(id).map(mapPermission)
    return { ...mapRole(role), permissions }
  },

  // --- Permissions ---

  listPermissions() {
    const db = getAuthDatabase()
    return db.getAllPermissions().map(mapPermission)
  },

  // --- Permission Sets ---

  listPermissionSets(): PermissionSet[] {
    const db = getAuthDatabase()
    return db.listPermissionSets().map(mapPermissionSet)
  },

  getPermissionSet(id: string): PermissionSetWithPermissions | null {
    const db = getAuthDatabase()
    const row = db.getPermissionSet(id)
    if (!row) return null
    const permissions = db.getPermissionsForPermissionSet(id).map(mapPermission)
    return { ...mapPermissionSet(row), permissions }
  },

  createPermissionSet(name: string, description: string | null, permissionIds?: string[]): PermissionSetWithPermissions {
    const db = getAuthDatabase()
    if (!name || name.trim().length === 0) {
      throw new AppError(400, 'Permission set name is required')
    }
    const existing = db.findPermissionSetByName(name)
    if (existing) {
      throw new AppError(409, `Permission set '${name}' already exists`)
    }
    const id = `pset_${generateId()}`
    const ps = db.createPermissionSet({ id, name: name.trim(), description })
    if (permissionIds && permissionIds.length > 0) {
      db.setPermissionSetPermissions(id, permissionIds)
    }
    const permissions = db.getPermissionsForPermissionSet(id).map(mapPermission)
    return { ...mapPermissionSet(ps), permissions }
  },

  updatePermissionSet(id: string, name?: string, description?: string | null): PermissionSetWithPermissions | null {
    const db = getAuthDatabase()
    const existing = db.getPermissionSet(id)
    if (!existing) return null
    if (name !== undefined) {
      const dup = db.findPermissionSetByName(name)
      if (dup && dup.id !== id) {
        throw new AppError(409, `Permission set '${name}' already exists`)
      }
    }
    db.updatePermissionSet(id, { name, description })
    return this.getPermissionSet(id)
  },

  deletePermissionSet(id: string): boolean {
    const db = getAuthDatabase()
    return db.deletePermissionSet(id)
  },

  setPermissionSetPermissions(id: string, permissionIds: string[]): PermissionSetWithPermissions | null {
    const db = getAuthDatabase()
    const ps = db.getPermissionSet(id)
    if (!ps) return null
    db.setPermissionSetPermissions(id, permissionIds)
    const permissions = db.getPermissionsForPermissionSet(id).map(mapPermission)
    return { ...mapPermissionSet(ps), permissions }
  },

  // --- User Role Assignment ---

  updateUserRole(userId: string, roleId: string): void {
    const db = getAuthDatabase()
    const role = db.findRoleById(roleId)
    if (!role) {
      throw new AppError(404, `Role '${roleId}' not found`)
    }
    const user = db.findUserById(userId)
    if (!user) {
      throw new AppError(404, `User '${userId}' not found`)
    }
    db.updateUserRole(userId, roleId)
  },

  getUsersWithRoles() {
    const db = getAuthDatabase()
    const users = db.listUsers()
    return users.map(u => {
      const role = db.findRoleById(u.role_id)
      return {
        id: u.id,
        email: u.email,
        displayName: u.display_name,
        isActive: u.is_active === 1,
        emailVerified: u.email_verified === 1,
        roleId: u.role_id,
        roleName: role?.name || 'unknown',
        createdAt: u.created_at,
        updatedAt: u.updated_at,
      }
    })
  },
}
