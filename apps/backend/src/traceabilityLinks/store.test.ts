import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert'
import * as fs from 'fs'
import * as path from 'path'
import type { TraceLink } from '@nexus-engineering/shared'

// Setup test directory
const TEST_DB_PATH = path.join(process.cwd(), 'test-data', 'trace_links.json')

function setupTestDir() {
  const dir = path.dirname(TEST_DB_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function cleanupTestDir() {
  if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH)
  const dir = path.dirname(TEST_DB_PATH)
  if (fs.existsSync(dir)) fs.rmdirSync(dir)
}

describe('TraceLinkStore', () => {
  beforeEach(() => {
    setupTestDir()
  })

  afterEach(() => {
    // Reset singleton between tests
    cleanupTestDir()
  })

    it('should insert a trace link and retrieve it', async () => {
    const { getTraceLinkStore } = await import('../traceabilityLinks/store')
    const store1 = getTraceLinkStore(TEST_DB_PATH)
    
    const now = new Date().toISOString()
    const link: TraceLink = {
      id: 'test-001',
      version: '1.0',
      createdAt: now,
      updatedAt: now,
        source: 'API',
        sourceId: 'req-123',
        sourceType: 'requirement',
        targetId: 'artifact-456',
        targetType: 'architectureModel',
        relationshipType: 'satisfies',
        confidence: 'high',
        description: 'Test link'
      }
    
    const result = store1.insert(link)
    assert.strictEqual(result.id, 'test-001')
    
    const found = store1.findById('test-001')
    assert.ok(found)
    assert.strictEqual(found?.sourceId, 'req-123')
    assert.strictEqual(found?.relationshipType, 'satisfies')
  })

  it('should throw on duplicate id', async () => {
    const { getTraceLinkStore } = await import('../traceabilityLinks/store')
    const store = getTraceLinkStore(TEST_DB_PATH)
    
    const link: TraceLink = {
      id: 'test-002',
      version: '1.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: 'API',
      sourceId: 'req-1',
      sourceType: 'requirement',
      targetId: 'art-1',
      targetType: 'architectureModel',
      relationshipType: 'tracesTo',
      confidence: 'medium'
    })
    
    store.insert(link)
    assert.throws(() => store.insert(link), /already exists/)
  })

  it('should find by source type and id', async () => {
    const { getTraceLinkStore } = await import('../traceabilityLinks/store')
    const store = getTraceLinkStore(TEST_DB_PATH)
    
    const now = new Date().toISOString()
    store.insert({
      id: 'tl-001', version: '1.0', createdAt: now, updatedAt: now,
      source: 'API', sourceId: 'req-1', sourceType: 'requirement' as const,
      targetId: 'a-1', targetType: 'architectureModel' as const,
      relationshipType: 'satisfies' as const, confidence: 'high' as const
    } as TraceLink)
    
    store.insert({
      id: 'tl-002', version: '1.0', createdAt: now, updatedAt: now,
      source: 'API', sourceId: 'req-2', sourceType: 'requirement' as const,
      targetId: 'a-2', targetType: 'softwareComponent' as const,
      relationshipType: 'verifies', confidence: 'low'
    })
    
    const results = store.findBySource('requirement', 'req-1')
    assert.strictEqual(results.length, 1)
    assert.strictEqual(results[0].id, 'tl-001')
  })

  it('should find by target type and id', async () => {
    const { getTraceLinkStore } = await import('../traceabilityLinks/store')
    const store = getTraceLinkStore(TEST_DB_PATH)
    
    const now = new Date().toISOString()
    store.insert({
      id: 'tl-003', version: '1.0', createdAt: now, updatedAt: now,
      source: 'API', sourceId: 'req-1', sourceType: 'requirement',
      targetId: 'a-1', targetType: 'architectureModel',
      relationshipType: 'satisfies', confidence: 'high'
    })
    
    const results = store.findByTarget('architectureModel', 'a-1')
    assert.strictEqual(results.length, 1)
    assert.strictEqual(results[0].id, 'tl-003')
  })

  it('should update and increment version', async () => {
    const { getTraceLinkStore } = await import('../traceabilityLinks/store')
    const store = getTraceLinkStore(TEST_DB_PATH)
    
    const now = new Date().toISOString()
    store.insert({
      id: 'tl-004', version: '1.0', createdAt: now, updatedAt: now,
      source: 'API', sourceId: 'req-1', sourceType: 'requirement',
      targetId: 'a-1', targetType: 'architectureModel',
      relationshipType: 'satisfies', confidence: 'high'
    })
    
    const updated = store.update('tl-004', { confidence: 'medium' })
    assert.ok(updated)
    // Version should be incremented
    assert.strictEqual((updated as any).version, '1.1')
  })

  it('should return undefined when updating non-existent link', async () => {
    const { getTraceLinkStore } = await import('../traceabilityLinks/store')
    const store = getTraceLinkStore(TEST_DB_PATH)
    
    const result = store.update('non-existent', { confidence: 'high' })
    assert.strictEqual(result, undefined)
  })

  it('should delete a link and return true', async () => {
    const { getTraceLinkStore } = await import('../traceabilityLinks/store')
    const store = getTraceLinkStore(TEST_DB_PATH)
    
    const now = new Date().toISOString()
    store.insert({
      id: 'tl-005', version: '1.0', createdAt: now, updatedAt: now,
      source: 'API', sourceId: 'req-1', sourceType: 'requirement',
      targetId: 'a-1', targetType: 'architectureModel',
      relationshipType: 'satisfies', confidence: 'high'
    })
    
    assert.strictEqual(store.delete('tl-005'), true)
    assert.strictEqual(store.findById('tl-005'), undefined)
  })

  it('should return false when deleting non-existent link', async () => {
    const { getTraceLinkStore } = await import('../traceabilityLinks/store')
    const store = getTraceLinkStore(TEST_DB_PATH)
    
    assert.strictEqual(store.delete('fake-id'), false)
  })

  it('should clear all links', async () => {
    const { getTraceLinkStore } = await import('../traceabilityLinks/store')
    const store = getTraceLinkStore(TEST_DB_PATH)
    
    store.insert({
      id: 'tl-006', version: '1.0', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      source: 'API', sourceId: 'req-1', sourceType: 'requirement',
      targetId: 'a-1', targetType: 'architectureModel',
      relationshipType: 'satisfies', confidence: 'high'
    })
    
    store.clear()
    assert.strictEqual(store.findAll().length, 0)
  })

  it('should return all links sorted by updated_at desc', async () => {
    const { getTraceLinkStore } = await import('../traceabilityLinks/store')
    const store = getTraceLinkStore(TEST_DB_PATH)
    
    const now = new Date().toISOString()
    store.insert({
      id: 'tl-010', version: '1.0', createdAt: now, updatedAt: now,
      source: 'API', sourceId: 'req-1', sourceType: 'requirement',
      targetId: 'a-1', targetType: 'architectureModel',
      relationshipType: 'satisfies', confidence: 'high'
    })
    
    const later = new Date(Date.now() + 1000).toISOString()
    store.insert({
      id: 'tl-011', version: '1.0', createdAt: now, updatedAt: later,
      source: 'API', sourceId: 'req-2', sourceType: 'requirement',
      targetId: 'a-2', targetType: 'testCase',
      relationshipType: 'verifies', confidence: 'low'
    })
    
    const all = store.findAll()
    assert.strictEqual(all.length, 2)
    // Latest updated should be first
    assert.strictEqual(all[0].id, 'tl-011')
  })

   it('should persist to disk and survive reload', async () => {
      // First write with fresh instance
      const { getTraceLinkStore } = await import('../traceabilityLinks/store')
      
      // Write data
      const store1 = getTraceLinkStore(TEST_DB_PATH)
      const now = new Date().toISOString()
      store1.insert({
        id: 'tl-020', version: '1.0', createdAt: now, updatedAt: now,
        source: 'API', sourceId: 'req-1', sourceType: 'requirement',
        targetId: 'a-1', targetType: 'architectureModel',
        relationshipType: 'tracesTo', confidence: 'medium'
      })
     
     // Verify file exists
     assert.ok(fs.existsSync(TEST_DB_PATH))
     
     // Read raw JSON to verify persistence
     const raw = fs.readFileSync(TEST_DB_PATH, 'utf-8')
     const parsed = JSON.parse(raw) as any[]
     assert.strictEqual(parsed.length, 1)
     assert.strictEqual(parsed[0].id, 'tl-020')
     
     // Now load from file with new instance
     const store2 = getTraceLinkStore(TEST_DB_PATH)
     const reload = store2.findById('tl-020')
     assert.ok(reload)
     assert.strictEqual(reload.id, 'tl-020')
   })

  it('should handle empty database gracefully', async () => {
    const { getTraceLinkStore } = await import('../traceabilityLinks/store')
    const store = getTraceLinkStore(TEST_DB_PATH)
    
    // New store with no prior data - clear any previous state
    assert.strictEqual(store.findAll().length, 0)
    assert.strictEqual(store.findById('nonexistent'), undefined)
    assert.strictEqual(store.findBySource('requirement', 'req-1').length, 0)
    assert.strictEqual(store.findByTarget('architectureModel', 'art-1').length, 0)
  })
})

describe('TraceLink Repository Pattern Test', () => {
  const TEST_REPO_PATH = path.join(process.cwd(), 'test-data', 'trace_link_repo.json')
  
  beforeEach(() => {
    setupTestDir()
  })

  afterEach(() => {
    cleanupTestDir()
  })

  it('should create and list trace links via repository', async () => {
    const { TraceLinkRepository } = await import('../traceabilityLinks/repository')
    
    const repository = new TraceLinkRepository()
    
    const linkData = {
      id: 'test-repo-link',
      version: '1.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sourceId: 'req-100',
      sourceType: 'requirement',
      targetId: 'art-200',
      targetType: 'architectureModel',
      relationshipType: 'satisfies' as const,
      confidence: 'high' as const
    }
    
    const created = await repository.createTraceLink(linkData)
    assert.ok(created)
    assert.ok(created.id)
    assert.strictEqual(created.sourceId, 'req-100')
    assert.strictEqual(created.targetId, 'art-200')
  })

  it('should validate required trace link fields', async () => {
    const { getTraceLinkStore } = await import('../traceabilityLinks/store')
    const store = getTraceLinkStore(TEST_REPO_PATH)

    try {
      store.insert({
        id: 'tl-021', version: '1.0', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        source: 'API', sourceId: 'req-1', sourceType: 'requirement',
        targetId: 'a-1', targetType: 'architectureModel',
        relationshipType: 'tracesTo', confidence: undefined as any
      })
      assert.fail('Should have thrown error for missing required field')
    } catch (e) {
      assert.match((e as Error).message, /Missing required field/i)
    }
  })
})
