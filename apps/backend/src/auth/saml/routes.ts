import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { generateMetadataXml, handleSamlCallback, validateRedirectUrl } from './service'
import { AppError } from '../service'
import { auditLogRepository } from '../../auditLog/repository'

const DEFAULT_REDIRECT = '/dashboard'

async function samlCallback(request: FastifyRequest, reply: FastifyReply) {
  try {
    const body = request.body as { SAMLResponse?: string }
    const relayState = (request.body as any)?.RelayState

    if (!body.SAMLResponse) {
      return reply.status(400).send({ error: 'SAMLResponse is required' })
    }

    const result = await handleSamlCallback(body.SAMLResponse, relayState)

    if ('isIdpInitiated' in result && result.isIdpInitiated) {
      try {
        const redirectPath = validateRedirectUrl(result.relayState)
        auditLogRepository.log(result.user.id, result.user.email, result.isNewUser ? 'CREATE' : 'LOGIN', 'user', result.user.id, `IdP-initiated SAML login (RelayState: ${result.relayState})`)
        return reply.redirect(redirectPath)
      } catch (redirectError) {
        request.log.warn(`Invalid RelayState URL (${result.relayState}), falling back to dashboard`)
        auditLogRepository.log(result.user.id, result.user.email, result.isNewUser ? 'CREATE' : 'LOGIN', 'user', result.user.id, `IdP-initiated SAML login with invalid RelayState (${result.relayState}), using default dashboard`)
        return reply.redirect(DEFAULT_REDIRECT)
      }
    }

    const userResult = result as { user: any; accessToken: string; refreshToken: string; isNewUser: boolean }
    auditLogRepository.log(userResult.user.id, userResult.user.email, userResult.isNewUser ? 'CREATE' : 'LOGIN', 'user', userResult.user.id, `SAML login (RelayState: ${relayState || 'none'})`)

    return reply.send({
      user: userResult.user,
      accessToken: userResult.accessToken,
      refreshToken: userResult.refreshToken,
      isNewUser: userResult.isNewUser,
    })
  } catch (error) {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({ error: error.message })
    }
    request.log.error(error as Error)
    return reply.status(500).send({ error: 'SAML callback failed' })
  }
}

async function samlMetadata(_request: FastifyRequest, reply: FastifyReply) {
  try {
    const metadata = generateMetadataXml()
    return reply.type('application/xml').send(metadata)
  } catch (error) {
    _request.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to generate SAML metadata' })
  }
}

export function samlRoutes(server: FastifyInstance) {
  server.post('/api/auth/saml/callback', samlCallback)
  server.get('/api/auth/saml/metadata', samlMetadata)
}
