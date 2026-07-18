import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { authenticate } from '../auth/middleware'
import {
  registerUser,
  loginUser,
  refreshUserTokens,
  logoutUser,
  logoutAllSessions,
  getCurrentUser,
  AppError,
} from '../auth/service'
import { getAuthDatabase } from '../auth/database'
import type { RegisterRequest, LoginRequest, RefreshRequest } from '@nexus-engineering/shared'
import { auditLogRepository } from '../auditLog/repository'
import { logAuditAction } from '../auditLog/middleware'

async function register(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { email, password, displayName } = request.body as RegisterRequest
    const result = await registerUser(email, password, displayName)
    auditLogRepository.log(result.user.id, result.user.email, 'CREATE', 'user', result.user.id, 'User registered')
    return reply.status(201).send(result)
  } catch (error) {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({ error: error.message })
    }
    request.log.error(error as Error)
    return reply.status(500).send({ error: 'Registration failed' })
  }
}

async function login(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { email, password } = request.body as LoginRequest
    const result = await loginUser(email, password)
    auditLogRepository.log(result.user.id, result.user.email, 'LOGIN', 'user', result.user.id)
    return reply.send(result)
  } catch (error) {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({ error: error.message })
    }
    request.log.error(error as Error)
    return reply.status(500).send({ error: 'Login failed' })
  }
}

async function refresh(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { refreshToken } = request.body as RefreshRequest
    const result = await refreshUserTokens(refreshToken)
    auditLogRepository.log(result.user.id, result.user.email, 'READ', 'user', result.user.id, 'Token refreshed')
    return reply.send(result)
  } catch (error) {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({ error: error.message })
    }
    request.log.error(error as Error)
    return reply.status(500).send({ error: 'Token refresh failed' })
  }
}

async function logout(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { refreshToken } = request.body as { refreshToken: string }
    await logoutUser(refreshToken)
    logAuditAction(request, 'LOGOUT', 'user', request.user!.sub)
    return reply.send({ message: 'Logged out successfully' })
  } catch (error) {
    request.log.error(error as Error)
    return reply.status(500).send({ error: 'Logout failed' })
  }
}

async function me(request: FastifyRequest, reply: FastifyReply) {
  try {
    const user = getCurrentUser(request.user!.sub)
    if (!user) {
      return reply.status(404).send({ error: 'User not found' })
    }
    return reply.send({ user })
  } catch (error) {
    request.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to get current user' })
  }
}

async function getRoles(_request: FastifyRequest, reply: FastifyReply) {
  try {
    const db = getAuthDatabase()
    const roles = db.listRoles()
    return reply.send({ roles })
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to list roles' })
  }
}

export function authRoutes(server: FastifyInstance) {
  server.post('/api/auth/register', register)
  server.post('/api/auth/login', login)
  server.post('/api/auth/refresh', refresh)

  server.post('/api/auth/logout', { preHandler: [authenticate] }, logout)
  server.get('/api/auth/me', { preHandler: [authenticate] }, me)
  server.post('/api/auth/logout-all', { preHandler: [authenticate] }, async (request, reply) => {
    try {
      await logoutAllSessions(request.user!.sub)
      logAuditAction(request, 'LOGOUT', 'user', request.user!.sub, 'All sessions')
      return reply.send({ message: 'All sessions logged out' })
    } catch (error) {
      request.log.error(error as Error)
      return reply.status(500).send({ error: 'Logout failed' })
    }
  })

  server.get('/api/auth/roles', { preHandler: [authenticate] }, getRoles)
}
