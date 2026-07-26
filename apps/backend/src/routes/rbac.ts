import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { authenticate, requirePermission } from '../auth/middleware'
import { rbacRepository } from '../rbac/repository'
import { logAuditAction } from '../auditLog/middleware'
import { AppError } from '../lib/errorHandler'
import type {
  CreateRoleRequest,
  UpdateRoleRequest,
  CreatePermissionSetRequest,
  UpdatePermissionSetRequest,
  SetRolePermissionsRequest,
  SetPermissionSetPermissionsRequest,
  UpdateUserRoleRequest,
} from '@nexus-engineering/shared'

// --- Role Handlers ---

async function listRoles(_request: FastifyRequest, reply: FastifyReply) {
  const roles = rbacRepository.listRoles()
  return reply.send({ roles, total: roles.length })
}

async function getRole(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  const role = rbacRepository.getRole(id)
  if (!role) {
    throw new AppError(404, 'Role not found', { resourceId: id })
  }
  return reply.send(role)
}

async function createRole(request: FastifyRequest, reply: FastifyReply) {
  const { name, description, permissionIds } = request.body as CreateRoleRequest
  const role = rbacRepository.createRole(name, description ?? null, permissionIds)
  logAuditAction(request, 'CREATE', 'role', role.id, `name=${role.name}`)
  return reply.status(201).send(role)
}

async function updateRole(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  const { name, description } = request.body as UpdateRoleRequest
  const role = rbacRepository.updateRole(id, name, description)
  if (!role) {
    throw new AppError(404, 'Role not found', { resourceId: id })
  }
  logAuditAction(request, 'UPDATE', 'role', id, JSON.stringify({ name, description }))
  return reply.send(role)
}

async function deleteRole(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  const deleted = rbacRepository.deleteRole(id)
  if (!deleted) {
    throw new AppError(404, 'Role not found or is a system role', { resourceId: id })
  }
  logAuditAction(request, 'DELETE', 'role', id)
  return reply.send({ message: 'Role deleted successfully' })
}

async function getRolePermissions(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  const role = rbacRepository.getRole(id)
  if (!role) {
    throw new AppError(404, 'Role not found', { resourceId: id })
  }
  return reply.send({ permissions: role.permissions })
}

async function setRolePermissions(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  const { permissionIds } = request.body as SetRolePermissionsRequest
  if (!Array.isArray(permissionIds)) {
    throw new AppError(400, 'permissionIds array is required')
  }
  const role = rbacRepository.setRolePermissions(id, permissionIds)
  if (!role) {
    throw new AppError(404, 'Role not found', { resourceId: id })
  }
  logAuditAction(request, 'UPDATE', 'rolePermissions', id, `permissions=${permissionIds.length}`)
  return reply.send(role)
}

// --- Permission Handlers ---

async function listPermissions(_request: FastifyRequest, reply: FastifyReply) {
  const permissions = rbacRepository.listPermissions()
  return reply.send({ permissions, total: permissions.length })
}

// --- Permission Set Handlers ---

async function listPermissionSets(_request: FastifyRequest, reply: FastifyReply) {
  const permissionSets = rbacRepository.listPermissionSets()
  return reply.send({ permissionSets, total: permissionSets.length })
}

async function getPermissionSet(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  const ps = rbacRepository.getPermissionSet(id)
  if (!ps) {
    throw new AppError(404, 'Permission set not found', { resourceId: id })
  }
  return reply.send(ps)
}

async function createPermissionSet(request: FastifyRequest, reply: FastifyReply) {
  const { name, description, permissionIds } = request.body as CreatePermissionSetRequest
  const ps = rbacRepository.createPermissionSet(name, description ?? null, permissionIds)
  logAuditAction(request, 'CREATE', 'permissionSet', ps.id, `name=${ps.name}`)
  return reply.status(201).send(ps)
}

async function updatePermissionSet(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  const { name, description } = request.body as UpdatePermissionSetRequest
  const ps = rbacRepository.updatePermissionSet(id, name, description)
  if (!ps) {
    throw new AppError(404, 'Permission set not found', { resourceId: id })
  }
  logAuditAction(request, 'UPDATE', 'permissionSet', id, JSON.stringify({ name, description }))
  return reply.send(ps)
}

async function deletePermissionSet(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  const deleted = rbacRepository.deletePermissionSet(id)
  if (!deleted) {
    throw new AppError(404, 'Permission set not found', { resourceId: id })
  }
  logAuditAction(request, 'DELETE', 'permissionSet', id)
  return reply.send({ message: 'Permission set deleted successfully' })
}

async function getPermissionSetPermissions(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  const ps = rbacRepository.getPermissionSet(id)
  if (!ps) {
    throw new AppError(404, 'Permission set not found', { resourceId: id })
  }
  return reply.send({ permissions: ps.permissions })
}

async function setPermissionSetPermissions(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  const { permissionIds } = request.body as SetPermissionSetPermissionsRequest
  if (!Array.isArray(permissionIds)) {
    throw new AppError(400, 'permissionIds array is required')
  }
  const ps = rbacRepository.setPermissionSetPermissions(id, permissionIds)
  if (!ps) {
    throw new AppError(404, 'Permission set not found', { resourceId: id })
  }
  logAuditAction(request, 'UPDATE', 'permissionSetPermissions', id, `permissions=${permissionIds.length}`)
  return reply.send(ps)
}

// --- User Role Assignment Handlers ---

async function updateUserRole(request: FastifyRequest, reply: FastifyReply) {
  const { userId } = request.params as { userId: string }
  const { roleId } = request.body as UpdateUserRoleRequest
  if (!roleId) {
    throw new AppError(400, 'roleId is required')
  }
  rbacRepository.updateUserRole(userId, roleId)
  logAuditAction(request, 'UPDATE', 'userRole', userId, `roleId=${roleId}`)
  return reply.send({ message: 'User role updated successfully' })
}

async function listUsersWithRoles(_request: FastifyRequest, reply: FastifyReply) {
  const users = rbacRepository.getUsersWithRoles()
  return reply.send({ users, total: users.length })
}

// --- Route Registration ---

export function rbacRoutes(server: FastifyInstance) {
  // Roles
  server.get('/api/roles', { preHandler: [authenticate, requirePermission('roles:read')] }, listRoles)
  server.get('/api/roles/:id', { preHandler: [authenticate, requirePermission('roles:read')] }, getRole)
  server.post('/api/roles', { preHandler: [authenticate, requirePermission('roles:write')] }, createRole)
  server.put('/api/roles/:id', { preHandler: [authenticate, requirePermission('roles:write')] }, updateRole)
  server.delete('/api/roles/:id', { preHandler: [authenticate, requirePermission('roles:write')] }, deleteRole)
  server.get('/api/roles/:id/permissions', { preHandler: [authenticate, requirePermission('roles:read')] }, getRolePermissions)
  server.put('/api/roles/:id/permissions', { preHandler: [authenticate, requirePermission('roles:write')] }, setRolePermissions)

  // Permissions (list all available)
  server.get('/api/permissions', { preHandler: [authenticate, requirePermission('roles:read')] }, listPermissions)

  // Permission Sets
  server.get('/api/permission-sets', { preHandler: [authenticate, requirePermission('permission-sets:read')] }, listPermissionSets)
  server.get('/api/permission-sets/:id', { preHandler: [authenticate, requirePermission('permission-sets:read')] }, getPermissionSet)
  server.post('/api/permission-sets', { preHandler: [authenticate, requirePermission('permission-sets:write')] }, createPermissionSet)
  server.put('/api/permission-sets/:id', { preHandler: [authenticate, requirePermission('permission-sets:write')] }, updatePermissionSet)
  server.delete('/api/permission-sets/:id', { preHandler: [authenticate, requirePermission('permission-sets:write')] }, deletePermissionSet)
  server.get('/api/permission-sets/:id/permissions', { preHandler: [authenticate, requirePermission('permission-sets:read')] }, getPermissionSetPermissions)
  server.put('/api/permission-sets/:id/permissions', { preHandler: [authenticate, requirePermission('permission-sets:write')] }, setPermissionSetPermissions)

  // User Role Assignment
  server.get('/api/users/roles', { preHandler: [authenticate, requirePermission('users:read')] }, listUsersWithRoles)
  server.put('/api/users/:userId/role', { preHandler: [authenticate, requirePermission('users:write')] }, updateUserRole)
}
