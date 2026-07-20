import { describe, it, expect, beforeAll } from 'vitest'
import { getGraphDatabase } from '../graphBuilder/graphDatabase'
import {
  resolveNodeRepo,
  traverseCrossRepo,
  DEFAULT_REPO,
  REPO_NAMESPACE_SEPARATOR,
} from './crossRepoTraversal'

describe('resolveNodeRepo', () => {
  it('extracts the repo prefix from a namespaced id', () => {
    expect(resolveNodeRepo(`repoA${REPO_NAMESPACE_SEPARATOR}auth-R1`)).toBe('repoA')
  })

  it('falls back to the default repo for un-namespaced ids', () => {
    expect(resolveNodeRepo('auth-R1')).toBe(DEFAULT_REPO)
  })

  it('honours a custom fallback', () => {
    expect(resolveNodeRepo('auth-R1', 'primary')).toBe('primary')
  })

  it('does not treat a leading separator as a repo', () => {
    expect(resolveNodeRepo(`${REPO_NAMESPACE_SEPARATOR}orphan`)).toBe(DEFAULT_REPO)
  })
})

describe('traverseCrossRepo', () => {
  beforeAll(() => {
    const db = getGraphDatabase()
    db.upsertNodes([
      { id: 'repoA::xr-R1', type: 'requirement', title: 'Req in A' },
      { id: 'repoA::xr-F1', type: 'feature', title: 'Feature in A' },
      { id: 'repoB::xr-T1', type: 'testCase', title: 'Test in B' },
      { id: 'repoC::xr-Res1', type: 'result', title: 'Result in C' },
    ])
    // Cross-repo edges: A→A (intra), A→B (cross), B→C (cross)
    db.upsertEdge({ sourceId: 'repoA::xr-R1', targetId: 'repoA::xr-F1', relationshipType: 'satisfies', confidence: 'high' })
    db.upsertEdge({ sourceId: 'repoA::xr-F1', targetId: 'repoB::xr-T1', relationshipType: 'verifies', confidence: 'high' })
    db.upsertEdge({ sourceId: 'repoB::xr-T1', targetId: 'repoC::xr-Res1', relationshipType: 'produces', confidence: 'high' })
  })

  it('annotates nodes with their owning repo', () => {
    const graph = traverseCrossRepo({ seedIds: ['repoA::xr-R1'] })
    const req = graph.nodes.find(n => n.id === 'repoA::xr-R1')
    expect(req?.repo).toBe('repoA')
  })

  it('marks edges that cross repository boundaries', () => {
    const graph = traverseCrossRepo({ seedIds: ['repoA::xr-R1'], depth: 5 })
    const crossEdge = graph.edges.find(e => e.source_id === 'repoA::xr-F1' && e.target_id === 'repoB::xr-T1')
    const intraEdge = graph.edges.find(e => e.source_id === 'repoA::xr-R1' && e.target_id === 'repoA::xr-F1')
    expect(crossEdge?.crossRepo).toBe(true)
    expect(intraEdge?.crossRepo).toBe(false)
  })

  it('merges a unified dependency tree across three repos', () => {
    const graph = traverseCrossRepo({ seedIds: ['repoA::xr-R1'], depth: 5 })
    expect(graph.repos).toEqual(expect.arrayContaining(['repoA', 'repoB', 'repoC']))
    expect(graph.crossRepoEdgeCount).toBeGreaterThanOrEqual(2)
  })

  it('scopes the graph to requested repos only', () => {
    const graph = traverseCrossRepo({ seedIds: ['repoA::xr-R1'], depth: 5, repos: ['repoA', 'repoB'] })
    expect(graph.nodes.every(n => n.repo === 'repoA' || n.repo === 'repoB')).toBe(true)
    expect(graph.nodes.some(n => n.repo === 'repoC')).toBe(false)
    // edges must not dangle to the excluded repo
    expect(graph.edges.every(e => graph.nodes.some(n => n.id === e.source_id) && graph.nodes.some(n => n.id === e.target_id))).toBe(true)
  })

  it('preserves single-repo traversal shape (repo annotation present)', () => {
    const graph = traverseCrossRepo({ seedIds: ['repoA::xr-R1'] })
    expect(graph.nodes[0]).toHaveProperty('repo')
    expect(typeof graph.totalNodes).toBe('number')
    expect(typeof graph.totalEdges).toBe('number')
  })

  it('meets the <500ms benchmark for a 3-repo traversal', () => {
    const start = performance.now()
    traverseCrossRepo({ seedIds: ['repoA::xr-R1'], depth: 10 })
    const elapsed = performance.now() - start
    expect(elapsed).toBeLessThan(500)
  })
})
