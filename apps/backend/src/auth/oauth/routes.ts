import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { getAuthorizationUrl, handleOAuthCallback } from './service'
import { AppError } from '../service'
import { auditLogRepository } from '../../auditLog/repository'

async function oauthInitiate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { provider } = request.params as { provider: string }
    const { url, state } = getAuthorizationUrl(provider)
    return reply.send({ url, state })
  } catch (error) {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({ error: error.message })
    }
    request.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to initiate OAuth' })
  }
}

async function oauthCallback(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { provider } = request.params as { provider: string }
    const { code, state } = request.query as { code?: string; state?: string }

    if (!code) {
      return reply.status(400).send({ error: 'Authorization code is required' })
    }

    const result = await handleOAuthCallback(provider, code)
    auditLogRepository.log(result.user.id, result.user.email, result.isNewUser ? 'CREATE' : 'LOGIN', 'user', result.user.id, `OAuth login via ${provider}`)

    return reply.send({
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      isNewUser: result.isNewUser,
    })
  } catch (error) {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({ error: error.message })
    }
    request.log.error(error as Error)
    return reply.status(500).send({ error: 'OAuth callback failed' })
  }
}

export function oauthRoutes(server: FastifyInstance) {
  server.get('/api/auth/oauth/:provider', oauthInitiate)
  server.get('/api/auth/oauth/:provider/callback', oauthCallback)
}
