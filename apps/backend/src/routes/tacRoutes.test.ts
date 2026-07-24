import { describe, it, expect, beforeEach } from 'vitest'
import { AppError } from '../lib/errorHandler'
import {
  listTacDocuments,
  getTacDocument,
  validateTacDocument,
  getTacSchema,
} from './tacRoutes'

function mockReply() {
  let statusCode = 200
  let body: unknown = null

  return {
    status: (code: number) => {
      statusCode = code
      return { send: (data: unknown) => { body = data; return mockReply() } }
    },
    send: (data: unknown) => { body = data },
    log: { error: () => {} },
    getStatus: () => statusCode,
    getBody: () => body,
  }
}

function makeRequest(overrides: Record<string, unknown> = {}) {
  return {
    query: {},
    params: {},
    body: {},
    log: { error: () => {} },
    ...overrides,
  }
}

const validDoc = {
  nexus: {
    schema: 'test-doc/v1',
    metadata: {
      domain: 'test',
      version: '1.0.0',
      source: 'test-source',
    },
  },
  suites: [
    {
      id: 'suite-1',
      name: 'Test Suite',
      cases: [
        {
          id: 'TC-001',
          title: 'Test case',
          type: 'unit',
          priority: 'high',
        },
      ],
    },
  ],
}

describe('tacRoutes handlers', () => {
  describe('listTacDocuments', () => {
    it('returns documents found in docs/tests directory', async () => {
      const reply = mockReply() as ReturnType<typeof mockReply> & { getBody: () => any; getStatus: () => number }
      await listTacDocuments(makeRequest() as any, reply as any)

      const body = reply.getBody()
      expect(body).toBeTruthy()
      expect(body).toHaveProperty('data')
      expect(body).toHaveProperty('total')
      expect(Array.isArray(body.data)).toBe(true)
      expect(body.total).toBeGreaterThanOrEqual(1)
    })

    it('returns document entries with id, domain, version', async () => {
      const reply = mockReply() as ReturnType<typeof mockReply> & { getBody: () => any; getStatus: () => number }
      await listTacDocuments(makeRequest() as any, reply as any)

      const body = reply.getBody()
      if (body.total > 0) {
        const entry = body.data[0]
        expect(entry).toHaveProperty('id')
        expect(entry).toHaveProperty('domain')
        expect(entry).toHaveProperty('version')
        expect(entry).toHaveProperty('suiteCount')
        expect(entry).toHaveProperty('caseCount')
      }
    })

    it('filters by search query q', async () => {
      const reply = mockReply() as ReturnType<typeof mockReply> & { getBody: () => any; getStatus: () => number }
      await listTacDocuments(makeRequest({ query: { q: 'registration' } }) as any, reply as any)

      const body = reply.getBody()
      expect(body.total).toBeGreaterThanOrEqual(1)
    })

    it('returns empty when q matches nothing', async () => {
      const reply = mockReply() as ReturnType<typeof mockReply> & { getBody: () => any; getStatus: () => number }
      await listTacDocuments(makeRequest({ query: { q: 'zzzznonexistent' } }) as any, reply as any)

      const body = reply.getBody()
      expect(body.total).toBe(0)
      expect(body.data).toHaveLength(0)
    })
  })

  describe('getTacDocument', () => {
    it('returns a document by its id', async () => {
      const reply = mockReply() as ReturnType<typeof mockReply> & { getBody: () => any; getStatus: () => number }
      await getTacDocument(makeRequest({ params: { id: 'auth/user-auth' } }) as any, reply as any)

      const body = reply.getBody()
      expect(body).toBeTruthy()
      expect(body).toHaveProperty('data')
      expect(body.data).toHaveProperty('nexus')
      expect(body.data).toHaveProperty('suites')
    })

    it('returns 400 when id is missing', async () => {
      const promise = getTacDocument(makeRequest({ params: {} }) as any, {} as any)
      await expect(promise).rejects.toThrow(AppError)
      await expect(promise).rejects.toMatchObject({ statusCode: 400, message: 'Document ID is required' })
    })

    it('returns 404 for unknown id', async () => {
      const promise = getTacDocument(
        makeRequest({ params: { id: 'nonexistent/doc' } }) as any,
        {} as any,
      )
      await expect(promise).rejects.toThrow(AppError)
      await expect(promise).rejects.toMatchObject({ statusCode: 404, message: /not found/i })
    })
  })

  describe('validateTacDocument', () => {
    it('returns valid for a correct document', async () => {
      const reply = mockReply() as ReturnType<typeof mockReply> & { getBody: () => any; getStatus: () => number }
      await validateTacDocument(makeRequest({ body: { document: validDoc } }) as any, reply as any)

      const body = reply.getBody()
      expect(body).toHaveProperty('valid', true)
    })

    it('returns 400 when document is missing', async () => {
      const promise = validateTacDocument(makeRequest({ body: {} }) as any, {} as any)
      await expect(promise).rejects.toThrow(AppError)
      await expect(promise).rejects.toMatchObject({ statusCode: 400, message: /document is required/i })
    })

    it('returns errors for an invalid document', async () => {
      const reply = mockReply() as ReturnType<typeof mockReply> & { getBody: () => any; getStatus: () => number }
      await validateTacDocument(makeRequest({
        body: {
          document: {
            nexus: { schema: 'unknown/v2', metadata: { domain: 'test', version: '1.0', source: 'test' } },
            suites: [{ id: 's1', name: 'Suite', cases: [{ id: 'TC-1', title: 'Test', type: 'unit', priority: 'high' }] }],
          },
        },
      }) as any, reply as any)

      const body = reply.getBody()
      expect(body).toHaveProperty('valid', false)
      expect(body).toHaveProperty('errors')
    })
  })

  describe('getTacSchema', () => {
    it('returns the JSON schema', async () => {
      const reply = mockReply() as ReturnType<typeof mockReply> & { getBody: () => any; getStatus: () => number }
      await getTacSchema(makeRequest() as any, reply as any)

      const body = reply.getBody()
      expect(body).toHaveProperty('data')
      expect(body.data).toHaveProperty('$schema')
      expect(body.data).toHaveProperty('properties')
      expect(body.data.properties).toHaveProperty('nexus')
      expect(body.data.properties).toHaveProperty('suites')
    })
  })
})
