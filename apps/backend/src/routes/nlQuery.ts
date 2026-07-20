import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import type { NLQueryRequest, NLQueryResponse, ParsedNLQuery } from '@nexus-engineering/shared'
import { NLQueryParser, NLQueryExecutor } from '../ai/nlQueryParser'

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
  try {
    const body = request.body as NLQueryRequest | undefined
    const query = body?.query

    if (typeof query !== 'string' || query.trim().length === 0) {
      const response: NLQueryResponse = {
        success: false,
        error: 'A non-empty "query" string is required.',
      }
      return reply.status(400).send(response)
    }

    const parsed: ParsedNLQuery = parser.parse(query)
    const data = await executor.execute(parsed)

    const response: NLQueryResponse = { success: true, data }
    return reply.send(response)
  } catch (error) {
    request.log.error(error as Error)
    const response: NLQueryResponse = {
      success: false,
      error: 'Failed to process natural language query.',
    }
    return reply.status(500).send(response)
  }
}

export function nlQueryRoutes(server: FastifyInstance) {
  server.post('/api/traceability/query', postNLQuery)
}
