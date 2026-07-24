import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import type { NLQueryRequest, NLQueryResponse, ParsedNLQuery } from '@nexus-engineering/shared'
import { NLQueryParser, NLQueryExecutor } from '../ai/nlQueryParser'
import { AppError } from '../lib/errorHandler'

const parser = new NLQueryParser()
const executor = new NLQueryExecutor()

/**
 * POST /api/traceability/query
 * Body: { query: string }
 * Response: NLQueryResponse
 *
 * Accepts a natural-language traceability question, parses it into a
 * structured intent, executes it against the traceability graph, and returns
 * matching artifacts with their trace links.
 */
export async function postNLQuery(request: FastifyRequest, reply: FastifyReply) {
  const body = request.body as NLQueryRequest | undefined
  const query = body?.query

  if (typeof query !== 'string' || query.trim().length === 0) {
    throw new AppError(400, 'A non-empty "query" string is required.', { param: 'query' })
  }

  const parsed: ParsedNLQuery = parser.parse(query)
  const data = await executor.execute(parsed)

  const response: NLQueryResponse = { success: true, data }
  return reply.send(response)
}

export function nlQueryRoutes(server: FastifyInstance) {
  server.post('/api/traceability/query', postNLQuery)
}
