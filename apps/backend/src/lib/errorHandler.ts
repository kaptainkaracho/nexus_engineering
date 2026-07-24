import { FastifyInstance, FastifyError, FastifyReply, FastifyRequest } from 'fastify'

/**
 * Custom application error class for consistent API error responses.
 * Usage: throw new AppError(404, 'Resource not found', { resourceId: id })
 */
export class AppError extends Error {
  public readonly statusCode: number
  public readonly code: string
  public readonly details?: Record<string, unknown>

  constructor(statusCode: number, message: string, details?: Record<string, unknown>) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
    this.code = httpStatusToCode(statusCode)
    this.details = details
  }
}

function httpStatusToCode(status: number): string {
  const map: Record<number, string> = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    422: 'UNPROCESSABLE_ENTITY',
    429: 'TOO_MANY_REQUESTS',
  }
  return map[status] ?? 'INTERNAL_ERROR'
}

/**
 * Registers a global error handler on the Fastify instance.
 * Catches unhandled errors and returns structured JSON responses.
 */
export function registerErrorHandler(server: FastifyInstance): void {
  server.setErrorHandler((error: FastifyError | AppError | Error, request: FastifyRequest, reply: FastifyReply) => {
    const statusCode = (error as AppError).statusCode
      ?? (error as FastifyError).statusCode
      ?? 500

    const code = (error as AppError).code
      ?? httpStatusToCode(statusCode)

    const message = statusCode === 500
      ? 'Internal server error'
      : error.message

    const details = (error as AppError).details

    // Log server errors with full stack; client errors at warn level
    if (statusCode >= 500) {
      request.log.error({ err: error, url: request.url, method: request.method }, 'Unhandled server error')
    } else {
      request.log.warn({ err: error, url: request.url }, 'Client error')
    }

    reply.status(statusCode).send({
      error: message,
      code,
      ...(details ? { details } : {}),
      ...(process.env.NODE_ENV !== 'production' ? { stack: error.stack } : {}),
    })
  })
}
