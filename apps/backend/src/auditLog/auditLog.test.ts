import { describe, it, expect, afterEach } from 'vitest'
import { AuditLogDatabase } from './database'
import { AuditLogRepository } from './repository'

function freshDb(): AuditLogDatabase {
  const db = new AuditLogDatabase(':memory:')
  db.initialize()
  return db
}

describe('AuditLogDatabase', () => {
  afterEach(() => {
  })

  it('inserts and finds an audit log entry', () => {
    const db = freshDb()
    const entry = {
      id: 'audit-1',
      timestamp: new Date().toISOString(),
      userId: 'user-1',
      userEmail: 'test@example.com',
      action: 'CREATE' as const,
      resourceType: 'organization',
      resourceId: 'org-1',
      details: '{"name":"Test Org"}',
      ipAddress: '127.0.0.1',
    }

    db.insert(entry)
    const found = db.findById('audit-1')
    expect(found).toBeDefined()
    expect(found!.action).toBe('CREATE')
    expect(found!.userEmail).toBe('test@example.com')
    expect(found!.resourceType).toBe('organization')

    db.close()
  })

  it('returns undefined for non-existent id', () => {
    const db = freshDb()
    expect(db.findById('nonexistent')).toBeUndefined()
    db.close()
  })

  it('filters by date range', () => {
    const db = freshDb()

    db.insert({
      id: 'a1', timestamp: new Date('2025-01-10T00:00:00Z').toISOString(),
      userId: 'u1', userEmail: 'a@b.com', action: 'CREATE', resourceType: 'org', resourceId: 'o1', details: null, ipAddress: null,
    })
    db.insert({
      id: 'a2', timestamp: new Date('2025-01-20T00:00:00Z').toISOString(),
      userId: 'u1', userEmail: 'a@b.com', action: 'UPDATE', resourceType: 'org', resourceId: 'o1', details: null, ipAddress: null,
    })
    db.insert({
      id: 'a3', timestamp: new Date('2025-02-01T00:00:00Z').toISOString(),
      userId: 'u1', userEmail: 'a@b.com', action: 'DELETE', resourceType: 'team', resourceId: 't1', details: null, ipAddress: null,
    })

    const result = db.findAll({ startDate: '2025-01-15T00:00:00Z', endDate: '2025-01-31T00:00:00Z' })
    expect(result.total).toBe(1)
    expect(result.entries[0].id).toBe('a2')

    db.close()
  })

  it('filters by action', () => {
    const db = freshDb()
    db.insert({
      id: 'b1', timestamp: new Date().toISOString(),
      userId: 'u1', userEmail: 'a@b.com', action: 'CREATE', resourceType: 'org', resourceId: 'o1', details: null, ipAddress: null,
    })
    db.insert({
      id: 'b2', timestamp: new Date().toISOString(),
      userId: 'u1', userEmail: 'a@b.com', action: 'DELETE', resourceType: 'org', resourceId: 'o1', details: null, ipAddress: null,
    })

    const result = db.findAll({ action: 'DELETE' })
    expect(result.total).toBe(1)
    expect(result.entries[0].id).toBe('b2')

    db.close()
  })

  it('filters by user id', () => {
    const db = freshDb()
    db.insert({
      id: 'c1', timestamp: new Date().toISOString(),
      userId: 'user-a', userEmail: 'a@b.com', action: 'CREATE', resourceType: 'org', resourceId: 'o1', details: null, ipAddress: null,
    })
    db.insert({
      id: 'c2', timestamp: new Date().toISOString(),
      userId: 'user-b', userEmail: 'b@c.com', action: 'CREATE', resourceType: 'org', resourceId: 'o2', details: null, ipAddress: null,
    })

    const result = db.findAll({ userId: 'user-a' })
    expect(result.total).toBe(1)
    expect(result.entries[0].id).toBe('c1')

    db.close()
  })

  it('filters by resource type', () => {
    const db = freshDb()
    db.insert({
      id: 'd1', timestamp: new Date().toISOString(),
      userId: 'u1', userEmail: 'a@b.com', action: 'CREATE', resourceType: 'organization', resourceId: 'o1', details: null, ipAddress: null,
    })
    db.insert({
      id: 'd2', timestamp: new Date().toISOString(),
      userId: 'u1', userEmail: 'a@b.com', action: 'CREATE', resourceType: 'team', resourceId: 't1', details: null, ipAddress: null,
    })

    const result = db.findAll({ resourceType: 'team' })
    expect(result.total).toBe(1)
    expect(result.entries[0].id).toBe('d2')

    db.close()
  })

  it('supports text search across email, resource_id, and details', () => {
    const db = freshDb()
    db.insert({
      id: 'e1', timestamp: new Date().toISOString(),
      userId: 'u1', userEmail: 'admin@example.com', action: 'CREATE', resourceType: 'org', resourceId: 'org-alpha', details: '{"env":"prod"}', ipAddress: null,
    })
    db.insert({
      id: 'e2', timestamp: new Date().toISOString(),
      userId: 'u2', userEmail: 'user@example.com', action: 'UPDATE', resourceType: 'org', resourceId: 'org-beta', details: null, ipAddress: null,
    })

    const result = db.findAll({ search: 'alpha' })
    expect(result.total).toBe(1)
    expect(result.entries[0].id).toBe('e1')

    const result2 = db.findAll({ search: 'admin@' })
    expect(result2.total).toBe(1)

    const result3 = db.findAll({ search: 'prod' })
    expect(result3.total).toBe(1)

    db.close()
  })

  it('paginates results correctly', () => {
    const db = freshDb()
    for (let i = 0; i < 10; i++) {
      db.insert({
        id: `pag-${i}`, timestamp: new Date(2025, 0, i + 1).toISOString(),
        userId: 'u1', userEmail: 'a@b.com', action: 'CREATE', resourceType: 'org', resourceId: `o${i}`, details: null, ipAddress: null,
      })
    }

    const page1 = db.findAll({ limit: 3, offset: 0 })
    expect(page1.entries.length).toBe(3)
    expect(page1.total).toBe(10)

    const page2 = db.findAll({ limit: 3, offset: 3 })
    expect(page2.entries.length).toBe(3)
    expect(page2.entries[0].id).toBe('pag-6')

    const last = db.findAll({ limit: 3, offset: 9 })
    expect(last.entries.length).toBe(1)
    expect(last.entries[0].id).toBe('pag-0')

    db.close()
  })

  it('enforces max limit of 1000', () => {
    const db = freshDb()
    const result = db.findAll({ limit: 5000, offset: 0 })
    expect(result.entries.length).toBe(0)
    expect(result.total).toBe(0)
    db.close()
  })

  it('orders results by timestamp descending', () => {
    const db = freshDb()
    db.insert({
      id: 'f1', timestamp: '2025-01-01T00:00:00.000Z',
      userId: 'u1', userEmail: 'a@b.com', action: 'CREATE', resourceType: 'org', resourceId: 'o1', details: null, ipAddress: null,
    })
    db.insert({
      id: 'f2', timestamp: '2025-01-03T00:00:00.000Z',
      userId: 'u1', userEmail: 'a@b.com', action: 'UPDATE', resourceType: 'org', resourceId: 'o1', details: null, ipAddress: null,
    })
    db.insert({
      id: 'f3', timestamp: '2025-01-02T00:00:00.000Z',
      userId: 'u1', userEmail: 'a@b.com', action: 'DELETE', resourceType: 'org', resourceId: 'o1', details: null, ipAddress: null,
    })

    const result = db.findAll({})
    expect(result.entries.map(e => e.id)).toEqual(['f2', 'f3', 'f1'])

    db.close()
  })

  it('stores and retrieves nullable fields correctly', () => {
    const db = freshDb()
    db.insert({
      id: 'g1', timestamp: new Date().toISOString(),
      userId: 'u1', userEmail: 'a@b.com', action: 'LOGIN', resourceType: 'session', resourceId: '',
      details: null, ipAddress: null,
    })

    const found = db.findById('g1')
    expect(found!.details).toBeNull()
    expect(found!.ipAddress).toBeNull()
    expect(found!.resourceId).toBe('')

    db.close()
  })
})

describe('AuditLogRepository', () => {
  it('creates audit entries with generated ids', async () => {
    const repo = new AuditLogRepository()
    const entry = await repo.log('user-1', 'test@example.com', 'CREATE', 'organization', 'org-1', '{"name":"Test"}', '127.0.0.1')

    expect(entry.id).toMatch(/^[0-9a-f]+-audit$/)
    expect(entry.userId).toBe('user-1')
    expect(entry.action).toBe('CREATE')
    expect(entry.details).toBe('{"name":"Test"}')
    expect(entry.ipAddress).toBe('127.0.0.1')
  })

  it('lists entries with filters via repository', async () => {
    const repo = new AuditLogRepository()
    await repo.log('u1', 'a@b.com', 'CREATE', 'org', 'o1', null, null)
    await repo.log('u1', 'a@b.com', 'UPDATE', 'org', 'o1', null, null)
    await repo.log('u2', 'c@d.com', 'DELETE', 'team', 't1', null, null)

    const result = await repo.list({ action: 'DELETE' })
    expect(result.total).toBe(1)
    expect(result.entries[0].resourceType).toBe('team')
  })
})
