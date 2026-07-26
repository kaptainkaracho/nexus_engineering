import { randomUUID } from 'node:crypto'
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import type { User } from '@nexus-engineering/shared'
import { authenticate } from '../auth/middleware'
import { AppError } from '../lib/errorHandler'
import { getAuthDatabase } from '../auth/database'

// --- SCIM Types ---

const SCIM_USER_SCHEMA = 'urn:ietf:params:scim:schemas:core:2.0:User'
const SCIM_ORG_EXT = 'urn:ietf:params:scim:schemas:extension:org:1.0:User'
const SCIM_TRACE_EXT = 'urn:ietf:params:scim:schemas:extension:trace:1.0:User'
const SCIM_SSO_EXT = 'urn:ietf:params:scim:schemas:extension:sso:1.0:User'
const SCIM_GROUP_SCHEMA = 'urn:ietf:params:scim:schemas:core:2.0:Group'
const SCIM_LIST_SCHEMA = 'urn:ietf:params:scim:api:messages:2.0:ListResponse'
const SCIM_ERROR_SCHEMA = 'urn:ietf:params:scim:api:messages:2.0:Error'
const SCIM_PATCH_SCHEMA = 'urn:ietf:params:scim:api:messages:2.0:PatchOp'

interface ScimUserBody {
  schemas?: string[]
  userName: string
  displayName?: string | null
  emails?: Array<{ value: string; type?: string; primary?: boolean }>
  active?: boolean
  roles?: string[]
  'urn:ietf:params:scim:schemas:extension:org:1.0:User'?: {
    'urn:nexus:orgId'?: string
    'urn:nexus:orgRole'?: string
  }
  'urn:ietf:params:scim:schemas:extension:trace:1.0:User'?: {
    'urn:nexus:tracePermissions'?: string[]
  }
  'urn:ietf:params:scim:schemas:extension:sso:1.0:User'?: {
    'urn:nexus:ssoprovider'?: string
    'urn:nexus:ssouserId'?: string
    'urn:nexus:ssoproviderEmail'?: string
  }
}

interface ScimPatchOperation {
  op: string
  path?: string
  value?: unknown
}

interface ScimPatchBody {
  schemas?: string[]
  Operations: ScimPatchOperation[]
}

interface ScimUserResponse {
  schemas: string[]
  id: string
  userName: string
  displayName: string | null
  emails: Array<{ value: string; type: string; primary: boolean }>
  active: boolean
  roles: string[]
  meta: {
    resourceType: string
    created: string
    lastModified: string
    location: string
  }
  'urn:ietf:params:scim:schemas:extension:org:1.0:User'?: {
    'urn:nexus:orgId': string
    'urn:nexus:orgRole': string
  }
  'urn:ietf:params:scim:schemas:extension:trace:1.0:User'?: {
    'urn:nexus:tracePermissions': string[]
  }
  'urn:ietf:params:scim:schemas:extension:sso:1.0:User'?: {
    'urn:nexus:ssoprovider': string
    'urn:nexus:ssouserId': string
    'urn:nexus:ssoproviderEmail': string
  }
}

interface ScimListResponse {
  schemas: string[]
  totalResults: number
  itemsPerPage: number
  startIndex: number
  Resources: ScimUserResponse[]
}

interface ScimErrorResponse {
  schemas: string[]
  scimType: string
  detail: string
  status: string
}

interface ScimGroupMember {
  value: string
  $ref: string
  type: string
}

interface ScimGroupBody {
  schemas?: string[]
  displayName: string
  members?: string[]
}

interface ScimGroupResponse {
  schemas: string[]
  id: string
  displayName: string
  members: ScimGroupMember[]
  meta: {
    resourceType: string
    created: string
    lastModified: string
    location: string
  }
}

interface ScimGroupListResponse {
  schemas: string[]
  totalResults: number
  itemsPerPage: number
  startIndex: number
  Resources: ScimGroupResponse[]
}

// --- Helpers ---

function scimError(detail: string, status: string, scimType = 'invalidFilter'): ScimErrorResponse {
  return {
    schemas: [SCIM_ERROR_SCHEMA],
    scimType,
    detail,
    status,
  }
}

function buildMeta(userId: string, created: string, lastModified: string) {
  return {
    resourceType: 'User',
    created,
    lastModified,
    location: `/api/scim/Users/${userId}`,
  }
}

function buildGroupMeta(groupId: string, created: string, lastModified: string) {
  return {
    resourceType: 'Group',
    created,
    lastModified,
    location: `/api/scim/Groups/${groupId}`,
  }
}

function mapRowToScimGroup(row: any, members: any[]): ScimGroupResponse {
  const meta = buildGroupMeta(row.id, row.created_at, row.updated_at)
  const groupMembers: ScimGroupMember[] = members.map((m: any) => ({
    value: m.member_id,
    $ref: `${m.member_type === 'User' ? '/Users' : '/Groups'}/${m.member_id}`,
    type: m.member_type,
  }))

  return {
    schemas: [SCIM_GROUP_SCHEMA],
    id: row.id,
    displayName: row.display_name,
    members: groupMembers,
    meta,
  }
}

function mapRowToScimUser(row: any, baseSchemas: string[] = [SCIM_USER_SCHEMA, SCIM_ORG_EXT]): ScimUserResponse {
  const emails = row.email ? [{ value: row.email, type: 'work', primary: true }] : []
  const meta = buildMeta(row.id, row.created_at, row.updated_at)

  const user: ScimUserResponse = {
    schemas: baseSchemas,
    id: row.id,
    userName: row.email,
    displayName: row.display_name ?? null,
    emails,
    active: row.is_active === 1,
    roles: [],
    meta,
  }

  if (row.org_id) {
    user['urn:ietf:params:scim:schemas:extension:org:1.0:User'] = {
      'urn:nexus:orgId': row.org_id,
      'urn:nexus:orgRole': row.org_role ?? 'org:member',
    }
  }

  if (row.trace_permissions) {
    user['urn:ietf:params:scim:schemas:extension:trace:1.0:User'] = {
      'urn:nexus:tracePermissions': typeof row.trace_permissions === 'string'
        ? JSON.parse(row.trace_permissions)
        : row.trace_permissions,
    }
  }

  if (row.sso_provider) {
    user['urn:ietf:params:scim:schemas:extension:sso:1.0:User'] = {
      'urn:nexus:ssoprovider': row.sso_provider,
      'urn:nexus:ssouserId': row.sso_user_id ?? '',
      'urn:nexus:ssoproviderEmail': row.sso_provider_email ?? '',
    }
  }

  return user
}

function validateUuid(value: unknown): boolean {
  if (typeof value !== 'string') return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
}

function validateEmail(value: unknown): boolean {
  if (typeof value !== 'string') return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

// --- SCIM Filter Parser ---

function parseScimFilter(filter: string): { field: string; operator: string; value: string } | null {
  const operators = ['eq', 'ne', 'co', 'sw', 'ew', 'gt', 'lt', 'ge', 'le']
  for (const op of operators) {
    const regex = new RegExp(`^([\\w.]+)\\s+${op}\\s+"(.*)"$`, 'i')
    const match = filter.trim().match(regex)
    if (match) {
      return { field: match[1], operator: op.toLowerCase(), value: match[2] }
    }
  }
  return null
}

function filterUsers(users: ScimUserResponse[], filter: string): ScimUserResponse[] {
  const parsed = parseScimFilter(filter)
  if (!parsed) return users

  const { field, operator, value } = parsed

  return users.filter((user) => {
    let fieldValue: unknown

    if (field === 'userName') {
      fieldValue = user.userName
    } else if (field === 'active') {
      fieldValue = user.active
    } else if (field === 'displayName') {
      fieldValue = user.displayName
    } else if (field === 'meta.created') {
      fieldValue = user.meta.created
    } else if (field === 'meta.lastModified') {
      fieldValue = user.meta.lastModified
    } else {
      return false
    }

    const strValue = String(fieldValue ?? '')
    const strFilter = value

    switch (operator) {
      case 'eq': return strValue === strFilter
      case 'ne': return strValue !== strFilter
      case 'co': return strValue.includes(strFilter)
      case 'sw': return strValue.startsWith(strFilter)
      case 'ew': return strValue.endsWith(strFilter)
      case 'gt': return strValue > strFilter
      case 'lt': return strValue < strFilter
      case 'ge': return strValue >= strFilter
      case 'le': return strValue <= strFilter
      default: return false
    }
  })
}

// --- Handlers ---

async function createUser(request: FastifyRequest, reply: FastifyReply) {
  const body = request.body as ScimUserBody

  const schemas = body.schemas || [SCIM_USER_SCHEMA]
  if (!schemas.includes(SCIM_USER_SCHEMA)) {
    throw new AppError(400, 'Missing required SCIM schema: urn:ietf:params:scim:schemas:core:2.0:User', {
      schemas: body.schemas,
    })
  }

  const userName = body.userName
  if (!userName || !validateEmail(userName)) {
    throw new AppError(400, 'userName (email) is required and must be a valid email', { field: 'userName' })
  }

  const db = getAuthDatabase()
  const existingUser = db.findUserByEmail(userName)
  if (existingUser) {
    const err = scimError(
      `User with userName '${userName}' already exists`,
      '409',
      'duplicate',
    )
    throw new AppError(409, err.detail, { scimType: 'duplicate' })
  }

  const id = randomUUID()
  const now = new Date().toISOString()
  const displayName = body.displayName ?? null
  const roleId = 'role_viewer'

  db.createUser({
    id,
    email: userName,
    passwordHash: '',
    displayName,
    roleId,
  })

  const row = db.findUserById(id)!
  const scimUser = mapRowToScimUser(row, schemas)

  return reply.status(201).send(scimUser)
}

async function listUsers(request: FastifyRequest, reply: FastifyReply) {
  const query = request.query as Record<string, unknown>
  const db = getAuthDatabase()

  const rawStartIndex = Number(query.startIndex) || 1
  const startIndex = rawStartIndex < 1 ? 1 : rawStartIndex
  const rawCount = Number(query.count) || 100
  const count = rawCount < 1 ? 100 : rawCount > 100 ? 100 : rawCount
  const filter = query.filter as string | undefined

  if (isNaN(rawStartIndex) || rawStartIndex < 1) {
    const err = scimError('startIndex must be >= 1', '400', 'invalidFilter')
    throw new AppError(400, err.detail, { scimType: 'invalidFilter' })
  }

  if (isNaN(rawCount) || rawCount < 1) {
    const err = scimError('count must be >= 1', '400', 'invalidFilter')
    throw new AppError(400, err.detail, { scimType: 'invalidFilter' })
  }

  const allRows = db.listUsers()
  let allScimUsers: ScimUserResponse[] = allRows.map(row => mapRowToScimUser(row))

  if (filter) {
    allScimUsers = filterUsers(allScimUsers, filter)
  }

  const totalResults = allScimUsers.length
  const offset = startIndex - 1
  const paginated = allScimUsers.slice(offset, offset + count)

  const response: ScimListResponse = {
    schemas: [SCIM_LIST_SCHEMA],
    totalResults,
    itemsPerPage: count,
    startIndex,
    Resources: paginated,
  }

  return reply.send(response)
}

async function getUser(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }

  if (!id || !validateUuid(id)) {
    const err = scimError(`Invalid user ID format`, '400', 'invalidValue')
    throw new AppError(400, err.detail, { scimType: 'invalidValue' })
  }

  const db = getAuthDatabase()
  const row = db.findUserById(id)
  if (!row) {
    const err = scimError(
      `User with id '${id}' not found`,
      '404',
      'noTarget',
    )
    throw new AppError(404, err.detail, { scimType: 'noTarget' })
  }

  const scimUser = mapRowToScimUser(row)
  return reply.send(scimUser)
}

async function updateUser(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }

  if (!id || !validateUuid(id)) {
    const err = scimError(`Invalid user ID format`, '400', 'invalidValue')
    throw new AppError(400, err.detail, { scimType: 'invalidValue' })
  }

  const body = request.body as ScimUserBody
  const db = getAuthDatabase()

  const existingRow = db.findUserById(id)
  if (!existingRow) {
    const err = scimError(
      `User with id '${id}' not found`,
      '404',
      'noTarget',
    )
    throw new AppError(404, err.detail, { scimType: 'noTarget' })
  }

  const newEmail = body.userName ?? existingRow.email
  if (!validateEmail(newEmail)) {
    const err = scimError('userName (email) must be a valid email', '400', 'invalidValue')
    throw new AppError(400, err.detail, { scimType: 'invalidValue' })
  }

  if (newEmail !== existingRow.email) {
    const emailExists = db.findUserByEmail(newEmail)
    if (emailExists && emailExists.id !== id) {
      const err = scimError(
        `User with userName '${newEmail}' already exists`,
        '409',
        'duplicate',
      )
      throw new AppError(409, err.detail, { scimType: 'duplicate' })
    }
  }

  const displayName = body.displayName ?? existingRow.display_name
  const isActive = body.active !== undefined ? body.active : existingRow.is_active === 1

  db.updateUser(id, {
    displayName,
    isActive,
  })

  const updatedRow = db.findUserById(id)!
  const schemas = body.schemas || [SCIM_USER_SCHEMA, SCIM_ORG_EXT]
  const scimUser = mapRowToScimUser(updatedRow, schemas)

  return reply.send(scimUser)
}

async function patchUser(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  const body = request.body as ScimPatchBody

  if (!id || !validateUuid(id)) {
    const err = scimError(`Invalid user ID format`, '400', 'invalidValue')
    throw new AppError(400, err.detail, { scimType: 'invalidValue' })
  }

  if (!body.Operations || !Array.isArray(body.Operations) || body.Operations.length === 0) {
    const err = scimError('Operations array is required and must not be empty', '400', 'invalidValue')
    throw new AppError(400, err.detail, { scimType: 'invalidValue' })
  }

  const db = getAuthDatabase()
  const existingRow = db.findUserById(id)
  if (!existingRow) {
    const err = scimError(
      `User with id '${id}' not found`,
      '404',
      'noTarget',
    )
    throw new AppError(404, err.detail, { scimType: 'noTarget' })
  }

  const updates: { displayName?: string; isActive?: boolean } = {}

  for (const operation of body.Operations) {
    const { op, path, value } = operation

    if (op === 'replace') {
      if (typeof value === 'object' && value !== null) {
        const val = value as Record<string, unknown>
        if (val['displayName'] !== undefined) {
          updates.displayName = String(val['displayName'])
        }
        if (val['active'] !== undefined) {
          updates.isActive = Boolean(val['active'])
        }
        if (val['userName'] !== undefined) {
          const newEmail = String(val['userName'])
          if (!validateEmail(newEmail)) {
            const err = scimError('userName (email) must be a valid email', '400', 'invalidValue')
            throw new AppError(400, err.detail, { scimType: 'invalidValue' })
          }
          if (newEmail !== existingRow.email) {
            const emailExists = db.findUserByEmail(newEmail)
            if (emailExists && emailExists.id !== id) {
              const err = scimError(
                `User with userName '${newEmail}' already exists`,
                '409',
                'duplicate',
              )
              throw new AppError(409, err.detail, { scimType: 'duplicate' })
            }
          }
        }
      } else if (value === undefined) {
        if (path === 'active') {
          updates.isActive = false
        }
      }
    } else if (op === 'add') {
      if (typeof value === 'object' && value !== null) {
        const val = value as Record<string, unknown>
        if (val['displayName'] !== undefined) {
          updates.displayName = String(val['displayName'])
        }
        if (val['active'] !== undefined) {
          updates.isActive = Boolean(val['active'])
        }
      }
    } else if (op === 'remove') {
      if (path === 'active') {
        updates.isActive = false
      }
    }
  }

  if (Object.keys(updates).length > 0) {
    db.updateUser(id, updates)
  }

  const updatedRow = db.findUserById(id)!
  const scimUser = mapRowToScimUser(updatedRow)

  return reply.send(scimUser)
}

async function deleteUser(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }

  if (!id || !validateUuid(id)) {
    const err = scimError(`Invalid user ID format`, '400', 'invalidValue')
    throw new AppError(400, err.detail, { scimType: 'invalidValue' })
  }

  const db = getAuthDatabase()
  const existingRow = db.findUserById(id)
  if (!existingRow) {
    const err = scimError(
      `User with id '${id}' not found`,
      '404',
      'noTarget',
    )
    throw new AppError(404, err.detail, { scimType: 'noTarget' })
  }

  db.updateUser(id, { isActive: false })

  return reply.send({
    message: 'User deactivated successfully',
    id,
  })
}

// --- Group Handlers ---

async function createGroup(request: FastifyRequest, reply: FastifyReply) {
  const body = request.body as ScimGroupBody

  const schemas = body.schemas || [SCIM_GROUP_SCHEMA]
  if (!schemas.includes(SCIM_GROUP_SCHEMA)) {
    throw new AppError(400, 'Missing required SCIM schema: urn:ietf:params:scim:schemas:core:2.0:Group', {
      schemas: body.schemas,
    })
  }

  const displayName = body.displayName
  if (!displayName || typeof displayName !== 'string') {
    throw new AppError(400, 'displayName is required and must be a string', { field: 'displayName' })
  }

  const db = getAuthDatabase()

  if (db.findGroupByDisplayName(displayName)) {
    const err = scimError(
      `Group with displayName '${displayName}' already exists`,
      '409',
      'duplicate',
    )
    throw new AppError(409, err.detail, { scimType: 'duplicate' })
  }

  const id = randomUUID()
  const now = new Date().toISOString()

  db.createGroup({ id, displayName })

  const row = db.findGroupById(id)!
  const members = db.getGroupMembers(id)

  if (body.members && Array.isArray(body.members)) {
    for (const member of body.members) {
      if (typeof member === 'string' && validateUuid(member)) {
        db.addGroupMember(id, member)
      }
    }
  }

  const updatedRow = db.findGroupById(id)!
  const updatedMembers = db.getGroupMembers(id)
  const scimGroup = mapRowToScimGroup(updatedRow, updatedMembers)

  return reply.status(201).send(scimGroup)
}

async function listGroups(request: FastifyRequest, reply: FastifyReply) {
  const query = request.query as Record<string, unknown>
  const db = getAuthDatabase()

  const rawStartIndex = Number(query.startIndex) || 1
  const startIndex = rawStartIndex < 1 ? 1 : rawStartIndex
  const rawCount = Number(query.count) || 100
  const count = rawCount < 1 ? 100 : rawCount > 100 ? 100 : rawCount
  const filter = query.filter as string | undefined

  if (isNaN(rawStartIndex) || rawStartIndex < 1) {
    const err = scimError('startIndex must be >= 1', '400', 'invalidFilter')
    throw new AppError(400, err.detail, { scimType: 'invalidFilter' })
  }

  if (isNaN(rawCount) || rawCount < 1) {
    const err = scimError('count must be >= 1', '400', 'invalidFilter')
    throw new AppError(400, err.detail, { scimType: 'invalidFilter' })
  }

  const allRows = db.listGroups()
  let allGroups: ScimGroupResponse[] = allRows.map(row => {
    const members = db.getGroupMembers(row.id)
    return mapRowToScimGroup(row, members)
  })

  if (filter) {
    const parsed = parseScimFilter(filter)
    if (parsed) {
      const { field, operator, value } = parsed
      allGroups = allGroups.filter((group) => {
        let fieldValue: unknown
        if (field === 'displayName') {
          fieldValue = group.displayName
        } else if (field === 'members') {
          fieldValue = group.members.length > 0 ? String(group.members.length) : ''
        } else {
          return false
        }
        const strValue = String(fieldValue ?? '')
        const strFilter = value
        switch (operator) {
          case 'eq': return strValue === strFilter
          case 'ne': return strValue !== strFilter
          case 'co': return strValue.includes(strFilter)
          case 'sw': return strValue.startsWith(strFilter)
          case 'ew': return strValue.endsWith(strFilter)
          case 'gt': return strValue > strFilter
          case 'lt': return strValue < strFilter
          case 'ge': return strValue >= strFilter
          case 'le': return strValue <= strFilter
          default: return false
        }
      })
    }
  }

  const totalResults = allGroups.length
  const offset = startIndex - 1
  const paginated = allGroups.slice(offset, offset + count)

  const response: ScimGroupListResponse = {
    schemas: [SCIM_LIST_SCHEMA],
    totalResults,
    itemsPerPage: count,
    startIndex,
    Resources: paginated,
  }

  return reply.send(response)
}

async function getGroup(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }

  if (!id || !validateUuid(id)) {
    const err = scimError(`Invalid group ID format`, '400', 'invalidValue')
    throw new AppError(400, err.detail, { scimType: 'invalidValue' })
  }

  const db = getAuthDatabase()
  const row = db.findGroupById(id)
  if (!row) {
    const err = scimError(
      `Group with id '${id}' not found`,
      '404',
      'noTarget',
    )
    throw new AppError(404, err.detail, { scimType: 'noTarget' })
  }

  const members = db.getGroupMembers(id)
  const scimGroup = mapRowToScimGroup(row, members)
  return reply.send(scimGroup)
}

async function updateGroup(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  const body = request.body as ScimGroupBody

  if (!id || !validateUuid(id)) {
    const err = scimError(`Invalid group ID format`, '400', 'invalidValue')
    throw new AppError(400, err.detail, { scimType: 'invalidValue' })
  }

  const db = getAuthDatabase()
  const existingRow = db.findGroupById(id)
  if (!existingRow) {
    const err = scimError(
      `Group with id '${id}' not found`,
      '404',
      'noTarget',
    )
    throw new AppError(404, err.detail, { scimType: 'noTarget' })
  }

  const displayName = body.displayName ?? existingRow.display_name
  if (typeof displayName !== 'string' || !displayName) {
    const err = scimError('displayName is required and must be a string', '400', 'invalidValue')
    throw new AppError(400, err.detail, { scimType: 'invalidValue' })
  }

  if (displayName !== existingRow.display_name) {
    const existingGroup = db.findGroupByDisplayName(displayName)
    if (existingGroup && existingGroup.id !== id) {
      const err = scimError(
        `Group with displayName '${displayName}' already exists`,
        '409',
        'duplicate',
      )
      throw new AppError(409, err.detail, { scimType: 'duplicate' })
    }
  }

  db.updateGroup(id, { displayName })

  const newMembers: string[] = body.members || []
  const currentMembers = db.getGroupMembers(id)

  for (const member of currentMembers) {
    if (!newMembers.includes(member.member_id)) {
      db.removeGroupMember(id, member.member_id)
    }
  }

  for (const member of newMembers) {
    if (typeof member === 'string' && validateUuid(member)) {
      db.addGroupMember(id, member)
    }
  }

  const updatedRow = db.findGroupById(id)!
  const updatedMembers = db.getGroupMembers(id)
  const scimGroup = mapRowToScimGroup(updatedRow, updatedMembers)

  return reply.send(scimGroup)
}

async function deleteGroup(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }

  if (!id || !validateUuid(id)) {
    const err = scimError(`Invalid group ID format`, '400', 'invalidValue')
    throw new AppError(400, err.detail, { scimType: 'invalidValue' })
  }

  const db = getAuthDatabase()
  const existingRow = db.findGroupById(id)
  if (!existingRow) {
    const err = scimError(
      `Group with id '${id}' not found`,
      '404',
      'noTarget',
    )
    throw new AppError(404, err.detail, { scimType: 'noTarget' })
  }

  db.deleteGroup(id)

  return reply.send({
    message: 'Group deleted successfully',
    id,
  })
}

// --- Route Registration ---

function registerScimUserRoutes(server: FastifyInstance) {
  // POST /api/scim/Users — Create user
  server.post('/api/scim/Users', { preHandler: [authenticate] }, createUser)

  // GET /api/scim/Users — List/filter users
  server.get('/api/scim/Users', { preHandler: [authenticate] }, listUsers)

  // GET /api/scim/Users/{id} — Get user
  server.get('/api/scim/Users/:id', { preHandler: [authenticate] }, getUser)

  // PUT /api/scim/Users/{id} — Full update
  server.put('/api/scim/Users/:id', { preHandler: [authenticate] }, updateUser)

  // PATCH /api/scim/Users/{id} — Partial update
  server.patch('/api/scim/Users/:id', { preHandler: [authenticate] }, patchUser)

  // DELETE /api/scim/Users/{id} — Deactivate user
  server.delete('/api/scim/Users/:id', { preHandler: [authenticate] }, deleteUser)
}

function registerScimGroupRoutes(server: FastifyInstance) {
  // POST /api/scim/Groups — Create group
  server.post('/api/scim/Groups', { preHandler: [authenticate] }, createGroup)

  // GET /api/scim/Groups — List groups
  server.get('/api/scim/Groups', { preHandler: [authenticate] }, listGroups)

  // GET /api/scim/Groups/{id} — Get group
  server.get('/api/scim/Groups/:id', { preHandler: [authenticate] }, getGroup)

  // PUT /api/scim/Groups/{id} — Full update
  server.put('/api/scim/Groups/:id', { preHandler: [authenticate] }, updateGroup)

  // DELETE /api/scim/Groups/{id} — Delete group
  server.delete('/api/scim/Groups/:id', { preHandler: [authenticate] }, deleteGroup)
}

export function scimRoutes(server: FastifyInstance) {
  registerScimUserRoutes(server)
  registerScimGroupRoutes(server)
}
