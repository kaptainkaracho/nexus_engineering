import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { AppError } from '../lib/errorHandler'

interface LicenseValidateRequest {
  licenseKey: string
}

interface LicenseValidateResponse {
  valid: boolean
  plan?: string
  expiry?: string
}

export async function postValidateLicense(request: FastifyRequest, reply: FastifyReply) {
  const body = request.body as LicenseValidateRequest | undefined
  const key = body?.licenseKey

  if (typeof key !== 'string' || key.trim().length === 0) {
    throw new AppError(400, 'A non-empty "licenseKey" string is required.', { param: 'licenseKey' })
  }

  const storedKey = process.env.LICENSE_KEY

  if (!storedKey) {
    request.log.warn('LICENSE_KEY env var not set — rejecting all license validations')
    return reply.send({ valid: false } satisfies LicenseValidateResponse)
  }

  if (key.trim() !== storedKey.trim()) {
    return reply.send({ valid: false } satisfies LicenseValidateResponse)
  }

  const response: LicenseValidateResponse = {
    valid: true,
  }

  return reply.send(response)
}

export function licenseRoutes(server: FastifyInstance) {
  server.post('/api/license/validate', postValidateLicense)
}
