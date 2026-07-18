import { randomBytes, createHash } from 'node:crypto'
import bcrypt from 'bcrypt'
import { getAuthDatabase } from './database'
import type { AuthUserRow, PermissionRow } from './database'

const BCRYPT_ROUNDS = 12

const ACCESS_TOKEN_EXPIRY = '15m'
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000

function generateId(): string {
  return randomBytes(16).toString('hex')
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function getJwtSecret(): string {
  return process.env.JWT_SECRET || 'dev-secret-do-not-use-in-production'
}

export interface AuthUser {
  id: string
  email: string
  displayName: string | null
  roleId: string
  roleName: string
  isActive: boolean
  emailVerified: boolean
  permissions: string[]
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

function mapUserToAuthUser(user: AuthUserRow, roleName: string, permissions: PermissionRow[]): AuthUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    roleId: user.role_id,
    roleName,
    isActive: user.is_active === 1,
    emailVerified: user.email_verified === 1,
    permissions: permissions.map(p => p.name),
  }
}

export async function registerUser(email: string, password: string, displayName?: string): Promise<{ user: AuthUser; accessToken: string; refreshToken: string }> {
  const db = getAuthDatabase()

  if (!email || !password) {
    throw new AppError('Email and password are required', 400)
  }
  if (password.length < 8) {
    throw new AppError('Password must be at least 8 characters', 400)
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AppError('Invalid email format', 400)
  }

  const existing = db.findUserByEmail(email)
  if (existing) {
    throw new AppError('Email already registered', 409)
  }

  const viewerRole = db.findRoleByName('viewer')
  if (!viewerRole) {
    throw new AppError('Default role not found', 500)
  }

  const passwordHash = await hashPassword(password)
  const user = db.createUser({
    id: generateId(),
    email,
    passwordHash,
    displayName: displayName || null,
    roleId: viewerRole.id,
  })

  const permissions = db.getPermissionsForRole(user.role_id)
  const authUser = mapUserToAuthUser(user, viewerRole.name, permissions)

  const { accessToken, refreshToken } = await generateTokens(authUser, db)

  return { user: authUser, accessToken, refreshToken }
}

export async function loginUser(email: string, password: string): Promise<{ user: AuthUser; accessToken: string; refreshToken: string }> {
  const db = getAuthDatabase()

  if (!email || !password) {
    throw new AppError('Email and password are required', 400)
  }

  const user = db.findUserByEmail(email)
  if (!user) {
    throw new AppError('Invalid email or password', 401)
  }

  if (user.is_active !== 1) {
    throw new AppError('Account is deactivated', 403)
  }

  const valid = await verifyPassword(password, user.password_hash)
  if (!valid) {
    throw new AppError('Invalid email or password', 401)
  }

  const role = db.findRoleById(user.role_id)
  const permissions = db.getPermissionsForRole(user.role_id)
  const authUser = mapUserToAuthUser(user, role?.name || 'unknown', permissions)

  const { accessToken, refreshToken } = await generateTokens(authUser, db)

  return { user: authUser, accessToken, refreshToken }
}

export async function refreshUserTokens(refreshTokenStr: string): Promise<{ user: AuthUser; accessToken: string; refreshToken: string }> {
  const db = getAuthDatabase()

  if (!refreshTokenStr) {
    throw new AppError('Refresh token is required', 400)
  }

  const tokenHash = hashToken(refreshTokenStr)
  const storedToken = db.findRefreshTokenByHash(tokenHash)

  if (!storedToken) {
    throw new AppError('Invalid refresh token', 401)
  }

  if (new Date(storedToken.expires_at) < new Date()) {
    db.revokeRefreshToken(storedToken.id)
    throw new AppError('Refresh token expired', 401)
  }

  db.revokeRefreshToken(storedToken.id)

  const user = db.findUserById(storedToken.user_id)
  if (!user) {
    throw new AppError('User not found', 404)
  }

  if (user.is_active !== 1) {
    throw new AppError('Account is deactivated', 403)
  }

  const role = db.findRoleById(user.role_id)
  const permissions = db.getPermissionsForRole(user.role_id)
  const authUser = mapUserToAuthUser(user, role?.name || 'unknown', permissions)

  const tokens = await generateTokens(authUser, db)

  return { user: authUser, ...tokens }
}

export async function logoutUser(refreshTokenStr: string): Promise<void> {
  const db = getAuthDatabase()
  const tokenHash = hashToken(refreshTokenStr)
  const storedToken = db.findRefreshTokenByHash(tokenHash)
  if (storedToken) {
    db.revokeRefreshToken(storedToken.id)
  }
}

export async function logoutAllSessions(userId: string): Promise<void> {
  const db = getAuthDatabase()
  db.revokeAllUserRefreshTokens(userId)
}

export function getCurrentUser(userId: string): AuthUser | null {
  const db = getAuthDatabase()
  const user = db.findUserById(userId)
  if (!user) return null

  const role = db.findRoleById(user.role_id)
  const permissions = db.getPermissionsForRole(user.role_id)
  return mapUserToAuthUser(user, role?.name || 'unknown', permissions)
}

export function generateAccessTokenPayload(authUser: AuthUser): Record<string, unknown> {
  return {
    sub: authUser.id,
    email: authUser.email,
    role: authUser.roleName,
    permissions: authUser.permissions,
  }
}

async function generateTokens(authUser: AuthUser, db: ReturnType<typeof getAuthDatabase>): Promise<{ accessToken: string; refreshToken: string }> {
  const { sign } = await import('./jwt')
  const accessToken = await sign(
    generateAccessTokenPayload(authUser),
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  )

  const refreshTokenStr = randomBytes(32).toString('hex')
  const tokenHash = hashToken(refreshTokenStr)
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS).toISOString()

  db.storeRefreshToken({
    id: generateId(),
    userId: authUser.id,
    tokenHash,
    expiresAt,
  })

  return { accessToken, refreshToken: refreshTokenStr }
}

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message)
    this.name = 'AppError'
  }
}
