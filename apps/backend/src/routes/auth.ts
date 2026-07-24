import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { authenticate } from '../auth/middleware'
import {
  registerUser,
  loginUser,
  refreshUserTokens,
  logoutUser,
  logoutAllSessions,
  getCurrentUser,
} from '../auth/service'
import { AppError } from '../lib/errorHandler'
import { getAuthDatabase } from '../auth/database'
import type { RegisterRequest, LoginRequest, RefreshRequest } from '@nexus-engineering/shared'
import { auditLogRepository } from '../auditLog/repository'
import { logAuditAction } from '../auditLog/middleware'
import { oauthRoutes } from '../auth/oauth/routes'
import { samlRoutes } from '../auth/saml/routes'

async function register(request: FastifyRequest, reply: FastifyReply) {
  const { email, password, displayName } = request.body as RegisterRequest
  const result = await registerUser(email, password, displayName)
  auditLogRepository.log(result.user.id, result.user.email, 'CREATE', 'user', result.user.id, 'User registered')
  return reply.status(201).send(result)
}

async function login(request: FastifyRequest, reply: FastifyReply) {
  const { email, password } = request.body as LoginRequest
  const result = await loginUser(email, password)
  auditLogRepository.log(result.user.id, result.user.email, 'LOGIN', 'user', result.user.id)
  return reply.send(result)
}

async function refresh(request: FastifyRequest, reply: FastifyReply) {
  const { refreshToken } = request.body as RefreshRequest
  const result = await refreshUserTokens(refreshToken)
  auditLogRepository.log(result.user.id, result.user.email, 'READ', 'user', result.user.id, 'Token refreshed')
  return reply.send(result)
}

async function logout(request: FastifyRequest, reply: FastifyReply) {
  const { refreshToken } = request.body as { refreshToken: string }
  await logoutUser(refreshToken)
  logAuditAction(request, 'LOGOUT', 'user', request.user!.sub)
  return reply.send({ message: 'Logged out successfully' })
}

async function me(request: FastifyRequest, reply: FastifyReply) {
  const user = getCurrentUser(request.user!.sub)
  if (!user) {
    throw new AppError(404, 'User not found', { userId: request.user!.sub })
  }
  return reply.send({ user })
}

async function getRoles(_request: FastifyRequest, reply: FastifyReply) {
  const db = getAuthDatabase()
  const roles = db.listRoles()
  return reply.send({ roles })
}

export function authRoutes(server: FastifyInstance) {
  server.post('/api/auth/register', register)
  server.post('/api/auth/login', login)
  server.post('/api/auth/refresh', refresh)

  server.post('/api/auth/logout', { preHandler: [authenticate] }, logout)
  server.get('/api/auth/me', { preHandler: [authenticate] }, me)
  server.post('/api/auth/logout-all', { preHandler: [authenticate] }, async (request, reply) => {
    await logoutAllSessions(request.user!.sub)
    logAuditAction(request, 'LOGOUT', 'user', request.user!.sub, 'All sessions')
    return reply.send({ message: 'All sessions logged out' })
  })

  server.get('/api/auth/roles', { preHandler: [authenticate] }, getRoles)

  oauthRoutes(server)
  samlRoutes(server)
}
