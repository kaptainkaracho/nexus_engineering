import { describe, it, expect, vi, beforeEach } from 'vitest'
import { syncNexusToJira, syncJiraToNexus } from './jiraConnector'
import { syncNexusToLinear, syncLinearToNexus } from './linearConnector'
import { syncNexusToGitHub, syncGitHubToNexus } from './githubConnector'
import { resolveConflict, updateSyncStatus, getSyncHealth, getAllSyncRecords } from './engine/syncEngine'

function mockJsonResponse(data: unknown) {
  return {
    ok: true,
    json: async () => data,
    headers: new Map([['content-type', 'application/json']]) as unknown as Headers,
  }
}

function mockJsonResponseWithHeaders(data: unknown, headers?: Record<string, string>) {
  const h = new Map(Object.entries({ 'content-type': 'application/json', ...headers }))
  return {
    ok: true,
    json: async () => data,
    text: async () => JSON.stringify(data),
    headers: {
      get: (key: string) => h.get(key) ?? null,
    } as unknown as Headers,
  }
}

const mockFetch = vi.fn()
globalThis.fetch = mockFetch

beforeEach(() => {
  vi.resetAllMocks()
})

describe('Jira — Nexus to Jira sync data integrity', () => {
  const config = { baseUrl: 'https://test.atlassian.net', email: 'test@test.com', apiToken: 'token' }

  it('fetches Nexus artifact and creates Jira issue with correct fields', async () => {
    mockFetch
      .mockResolvedValueOnce(mockJsonResponse({ id: 'art-123', title: 'Test Artifact', description: 'A test artifact', tags: ['nexus-synced', 'test'], priority: 'high' }))
      .mockResolvedValueOnce(mockJsonResponseWithHeaders({
        id: '10001',
        key: 'TEST-1',
        self: 'https://test.atlassian.net/rest/api/3/issue/10001',
        fields: { summary: 'Test Artifact', description: null, status: { name: 'To Do', statusCategory: { name: 'new', colorName: 'blue-gray' } }, priority: { name: 'High' }, assignee: null, reporter: null, labels: ['nexus-synced', 'test'], created: '2026-07-27T00:00:00.000Z', updated: '2026-07-27T00:00:00.000Z' },
      }))

    const result = await syncNexusToJira(config, 'art-123')

    expect(result.key).toBe('TEST-1')
    expect(mockFetch).toHaveBeenCalledTimes(2)

    const createCall = mockFetch.mock.calls[1]
    const body = JSON.parse(createCall[1].body)
    expect(body.fields.summary).toBe('Test Artifact')
    expect(body.fields.labels).toEqual(['nexus-synced', 'test'])
    expect(body.fields.issuetype.name).toBe('Task')
  })

  it('uses artifact title as Jira summary', async () => {
    mockFetch
      .mockResolvedValueOnce(mockJsonResponse({ id: 'art-456', title: 'Login Page Redesign', description: 'Redesign login', tags: [], priority: 'medium' }))
      .mockResolvedValueOnce(mockJsonResponseWithHeaders({
        id: '10002', key: 'TEST-2', self: '', fields: { summary: 'Login Page Redesign', description: null, status: { name: 'To Do', statusCategory: { name: 'new', colorName: 'blue-gray' } }, priority: { name: 'Medium' }, assignee: null, reporter: null, labels: ['nexus-synced'], created: '2026-07-27T00:00:00.000Z', updated: '2026-07-27T00:00:00.000Z' },
      }))

    const result = await syncNexusToJira(config, 'art-456')
    expect(result.fields.summary).toBe('Login Page Redesign')
  })
})

describe('Jira — Jira to Nexus sync data integrity', () => {
  const config = { baseUrl: 'https://test.atlassian.net', email: 'test@test.com', apiToken: 'token' }

  it('maps Jira issue fields to Nexus artifact correctly', async () => {
    const jiraResponse = {
      id: '10001',
      key: 'TEST-1',
      self: 'https://test.atlassian.net/rest/api/3/issue/10001',
      fields: {
        summary: 'Implement OAuth login',
        description: { content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Add OAuth 2.0 support' }] }] },
        status: { name: 'In Progress', statusCategory: { name: 'in progress', colorName: 'blue' } },
        priority: { name: 'High' },
        assignee: { accountId: 'u-1', displayName: 'John Doe', emailAddress: 'john@test.com' },
        reporter: { accountId: 'u-2', displayName: 'Jane Doe', emailAddress: 'jane@test.com' },
        labels: ['auth', 'security'],
        created: '2026-07-01T00:00:00.000Z',
        updated: '2026-07-27T00:00:00.000Z',
      },
    }

    mockFetch
      .mockResolvedValueOnce(mockJsonResponseWithHeaders(jiraResponse))
      .mockResolvedValueOnce(mockJsonResponse({ nexusId: 'nexus-art-1' }))

    await syncJiraToNexus(config, 'TEST-1')

    // Verify the Nexus API was called with correctly mapped data
    const nexusCall = mockFetch.mock.calls[1]
    expect(nexusCall[0]).toBe('http://localhost:3001/api/artifacts/registry')
    expect(nexusCall[1].method).toBe('POST')

    const sentData = JSON.parse(nexusCall[1].body as string)
    expect(sentData.id).toBe('jira-10001')
    expect(sentData.title).toBe('Implement OAuth login')
    expect(sentData.source).toBe('jira')
    expect(sentData.priority).toBe('high')
    expect(sentData.status).toBe('parsed')
    expect(sentData.tags).toEqual(['auth', 'security'])
    expect(sentData.assignee.name).toBe('John Doe')
  })

  it('maps status correctly for done issues', async () => {
    const doneIssue = {
      id: '10002',
      key: 'TEST-2',
      self: '',
      fields: {
        summary: 'Completed task',
        description: undefined,
        status: { name: 'Done', statusCategory: { name: 'done', colorName: 'green' } },
        priority: { name: 'Medium' },
        labels: [],
        created: '2026-06-01T00:00:00.000Z',
        updated: '2026-06-15T00:00:00.000Z',
      },
    }

    mockFetch
      .mockResolvedValueOnce(mockJsonResponseWithHeaders(doneIssue))
      .mockResolvedValueOnce(mockJsonResponse({ nexusId: 'nexus-art-2' }))

    await syncJiraToNexus(config, 'TEST-2')

    const nexusCall = mockFetch.mock.calls[1]
    const sentData = JSON.parse(nexusCall[1].body as string)
    expect(sentData.status).toBe('related')
  })
})

describe('Linear — Nexus to Linear sync data integrity', () => {
  const config = { apiKey: 'lin-api-key' }

  it('creates Linear issue with correct fields from Nexus artifact', async () => {
    mockFetch
      .mockResolvedValueOnce(mockJsonResponse({ id: 'art-789', title: 'Bug: Login fails', description: 'Users cannot log in with SSO', tags: ['bug', 'sso'], priority: 'critical' }))
      .mockResolvedValueOnce(mockJsonResponseWithHeaders({
        issueCreate: {
          success: true,
          issue: {
            id: 'lin-123', identifier: 'NEX-123', title: 'Bug: Login fails', description: 'Users cannot log in with SSO',
            state: { id: 's-1', name: 'Todo', type: 'unstarted' }, priority: { id: 'p-1', label: 'Urgent', priority: 1 },
            assignee: null, reporter: null, labels: ['bug', 'sso'],
            createdAt: '2026-07-27T00:00:00.000Z', updatedAt: '2026-07-27T00:00:00.000Z', url: 'https://linear.app/nex/issue/NEX-123',
          },
        },
      }))

    const result = await syncNexusToLinear(config, 'art-789')

    expect(result.identifier).toBe('NEX-123')
    expect(result.title).toBe('Bug: Login fails')

    const createCall = mockFetch.mock.calls[1]
    const body = JSON.parse(createCall[1].body)
    expect(body.variables.input.title).toBe('Bug: Login fails')
    expect(body.variables.input.description).toBe('Users cannot log in with SSO')
  })
})

describe('Linear — Linear to Nexus sync data integrity', () => {
  const config = { apiKey: 'lin-api-key' }

  it('maps Linear issue fields to Nexus artifact correctly', async () => {
    const linearQueryResponse = {
      issue: {
        id: 'lin-456',
        identifier: 'NEX-456',
        title: 'Add dark mode support',
        description: 'Implement dark mode throughout the app',
        state: { id: 's-2', name: 'In Progress', type: 'started' },
        priority: { id: 'p-2', label: 'High', priority: 2 },
        assignee: { id: 'u-1', name: 'John Doe', email: 'john@test.com', displayName: 'John Doe' },
        reporter: { id: 'u-2', name: 'Jane Doe', email: 'jane@test.com', displayName: 'Jane Doe' },
        labels: ['ui', 'dark-mode'],
        createdAt: '2026-07-20T00:00:00.000Z',
        updatedAt: '2026-07-27T00:00:00.000Z',
        url: 'https://linear.app/nex/issue/NEX-456',
      },
    }

    mockFetch
      .mockResolvedValueOnce(mockJsonResponseWithHeaders(linearQueryResponse))
      .mockResolvedValueOnce(mockJsonResponse({ nexusId: 'nexus-art-3' }))

    await syncLinearToNexus(config, 'lin-456')

    const nexusCall = mockFetch.mock.calls[1]
    expect(nexusCall[0]).toBe('http://localhost:3001/api/artifacts/registry')
    const sentData = JSON.parse(nexusCall[1].body as string)
    expect(sentData.id).toBe('linear-lin-456')
    expect(sentData.title).toBe('Add dark mode support')
    expect(sentData.source).toBe('linear')
    expect(sentData.priority).toBe('high')
    expect(sentData.status).toBe('parsed')
    expect(sentData.tags).toEqual(['ui', 'dark-mode'])
  })

  it('maps canceled Linear issues to error status in Nexus', async () => {
    mockFetch
      .mockResolvedValueOnce(mockJsonResponseWithHeaders({
        issue: {
          id: 'lin-789',
          identifier: 'NEX-789',
          title: 'Won\'t fix',
          description: null,
          state: { id: 's-3', name: 'Canceled', type: 'canceled' },
          priority: { id: 'p-4', label: 'Low', priority: 4 },
          assignee: null,
          reporter: null,
          labels: [],
          createdAt: '2026-07-01T00:00:00.000Z',
          updatedAt: '2026-07-15T00:00:00.000Z',
          url: '',
        },
      }))
      .mockResolvedValueOnce(mockJsonResponse({ nexusId: 'nexus-art-4' }))

    await syncLinearToNexus(config, 'lin-789')

    const nexusCall = mockFetch.mock.calls[1]
    const sentData = JSON.parse(nexusCall[1].body as string)
    expect(sentData.status).toBe('error')
  })
})

describe('GitHub — Nexus to GitHub sync data integrity', () => {
  const config = { token: 'gh-token', owner: 'test-owner', repo: 'test-repo' }

  it('creates GitHub issue with correct fields from Nexus artifact', async () => {
    mockFetch
      .mockResolvedValueOnce(mockJsonResponse({ id: 'art-999', title: 'Fix navigation bug', description: 'The nav bar breaks on mobile', tags: ['bug', 'mobile'], priority: 'high' }))
      .mockResolvedValueOnce(mockJsonResponseWithHeaders({
        id: '1001',
        number: 42,
        state: 'open',
        title: 'Fix navigation bug',
        body: 'The nav bar breaks on mobile',
        user: null,
        assignee: null,
        labels: [{ name: 'bug' }, { name: 'mobile' }],
        createdAt: '2026-07-27T00:00:00.000Z',
        updatedAt: '2026-07-27T00:00:00.000Z',
      }, { 'content-type': 'application/json' }))

    const result = await syncNexusToGitHub(config, 'art-999')

    expect(result.number).toBe(42)
    expect(result.title).toBe('Fix navigation bug')

    const createCall = mockFetch.mock.calls[1]
    const body = JSON.parse(createCall[1].body)
    expect(body.title).toBe('Fix navigation bug')
    expect(body.body).toBe('The nav bar breaks on mobile')
  })
})

describe('GitHub — GitHub to Nexus sync data integrity', () => {
  const config = { token: 'gh-token', owner: 'test-owner', repo: 'test-repo' }

  it('maps GitHub issue fields to Nexus artifact correctly', async () => {
    const githubResponse = {
      id: '2001',
      number: 99,
      state: 'open',
      title: 'Add search functionality',
      body: 'Implement full-text search across repositories',
      user: { id: 'u-1', login: 'dev-user', avatarUrl: '' },
      assignee: { id: 'u-2', login: 'assign-user', avatarUrl: '' },
      labels: [{ name: 'enhancement' }, { name: 'search' }],
      createdAt: '2026-07-01T00:00:00.000Z',
      updatedAt: '2026-07-27T00:00:00.000Z',
    }

    mockFetch
      .mockResolvedValueOnce(mockJsonResponseWithHeaders(githubResponse, { 'content-type': 'application/json' }))
      .mockResolvedValueOnce(mockJsonResponse({ nexusId: 'nexus-art-5' }))

    await syncGitHubToNexus(config, 99)

    const nexusCall = mockFetch.mock.calls[1]
    expect(nexusCall[0]).toBe('http://localhost:3001/api/artifacts/registry')
    const sentData = JSON.parse(nexusCall[1].body as string)
    expect(sentData.id).toBe('github-2001')
    expect(sentData.title).toBe('Add search functionality')
    expect(sentData.source).toBe('github')
    expect(sentData.status).toBe('discovered')
    expect(sentData.tags).toEqual(['enhancement', 'search'])
    expect(sentData.creator.name).toBe('dev-user')
  })

  it('maps closed GitHub issues to related status', async () => {
    const closedIssue = {
      id: '2002',
      number: 100,
      state: 'closed',
      title: 'Closed issue',
      body: null,
      user: null,
      assignee: null,
      labels: [],
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-15T00:00:00.000Z',
    }

    mockFetch
      .mockResolvedValueOnce(mockJsonResponseWithHeaders(closedIssue, { 'content-type': 'application/json' }))
      .mockResolvedValueOnce(mockJsonResponse({ nexusId: 'nexus-art-6' }))

    await syncGitHubToNexus(config, 100)

    const nexusCall = mockFetch.mock.calls[1]
    const sentData = JSON.parse(nexusCall[1].body as string)
    expect(sentData.status).toBe('related')
  })
})

describe('SyncEngine — data integrity', () => {
  it('resolveConflict with nexus_wins always returns nexus', () => {
    const result = resolveConflict({
      strategy: 'nexus_wins',
      nexusUpdatedAt: '2026-01-01T00:00:00Z',
      externalUpdatedAt: '2026-06-01T00:00:00Z',
      resolvedAt: '',
      winner: 'external',
    })
    expect(result.winner).toBe('nexus')
  })

  it('resolveConflict with external_wins always returns external', () => {
    const result = resolveConflict({
      strategy: 'external_wins',
      nexusUpdatedAt: '2026-06-01T00:00:00Z',
      externalUpdatedAt: '2026-01-01T00:00:00Z',
      resolvedAt: '',
      winner: 'nexus',
    })
    expect(result.winner).toBe('external')
  })

  it('resolveConflict with last_write_wins picks the later timestamp', () => {
    const result = resolveConflict({
      strategy: 'last_write_wins',
      nexusUpdatedAt: '2026-01-01T00:00:00Z',
      externalUpdatedAt: '2026-06-01T00:00:00Z',
      resolvedAt: '',
      winner: 'nexus',
    })
    expect(result.winner).toBe('external')
  })

  it('updateSyncStatus tracks error count correctly', () => {
    const r1 = updateSyncStatus('jira', 'error', 'Network timeout')
    expect(r1.errorCount).toBe(1)
    expect(r1.lastError).toBe('Network timeout')

    const r2 = updateSyncStatus('jira', 'error', 'API rate limit')
    expect(r2.errorCount).toBe(2)
    expect(r2.lastError).toBe('API rate limit')

    const r3 = updateSyncStatus('jira', 'idle')
    expect(r3.errorCount).toBe(2)
  })

  it('getSyncHealth returns status for all three connectors', () => {
    updateSyncStatus('jira', 'syncing')
    updateSyncStatus('linear', 'idle')
    updateSyncStatus('github', 'error', 'Unauthorized')

    const health = getSyncHealth()
    expect(health.jira.status).toBe('syncing')
    expect(health.linear.status).toBe('idle')
    expect(health.github.status).toBe('error')
    expect(health.github.errorCount).toBe(1)
  })

  it('getSyncHealth contains all three connectors', () => {
    const health = getSyncHealth()
    expect(health).toHaveProperty('jira')
    expect(health).toHaveProperty('linear')
    expect(health).toHaveProperty('github')
  })

  it('getAllSyncRecords is an array that can be queried', () => {
    const records = getAllSyncRecords()
    expect(Array.isArray(records)).toBe(true)
  })
})
