import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { ImpactReportGenerator } from './impactReportGenerator'
import { getGraphDatabase } from '../graphBuilder/graphDatabase'

describe('ImpactReportGenerator', () => {
  let dir: string
  let file: string

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), 'impact-report-'))
    file = join(dir, 'auth-R1.md')
    writeFileSync(file, '# Auth requirement change\n')

    const db = getGraphDatabase()
    db.upsertNodes([
      { id: 'auth-R1', type: 'requirement', title: 'Auth requirement' },
      { id: 'auth-F1', type: 'feature', title: 'Auth feature' },
      { id: 'auth-T1', type: 'testCase', title: 'Auth test' },
    ])
    db.upsertEdge({ sourceId: 'auth-R1', targetId: 'auth-F1', relationshipType: 'satisfies', confidence: 'high' })
    db.upsertEdge({ sourceId: 'auth-F1', targetId: 'auth-T1', relationshipType: 'verifies', confidence: 'medium' })
  })

  afterAll(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('produces a structured report from explicit artifact ids', async () => {
    const generator = new ImpactReportGenerator()
    const report = await generator.generate({ fileChanges: [], artifactIds: ['auth-R1'] })

    expect(report.metadata.resolvedArtifactIds).toContain('auth-R1')
    expect(report.affectedRequirements.some(a => a.id === 'auth-R1')).toBe(true)
    expect(report.affectedFeatures.some(a => a.id === 'auth-F1')).toBe(true)
    expect(report.summary.totalAffected).toBeGreaterThan(0)
    expect(report.summary.directCount).toBeGreaterThan(0)
    expect(['critical', 'high', 'medium', 'low']).toContain(report.riskLevel)
    expect(report.recommendations.length).toBeGreaterThan(0)
    expect(report.recommendations[0].id).toBeDefined()
  })

  it('aggregates affected artifacts into typed buckets', async () => {
    const generator = new ImpactReportGenerator()
    const report = await generator.generate({ fileChanges: [], artifactIds: ['auth-R1'] })

    expect(report.summary.requirementCount).toBeGreaterThan(0)
    expect(report.summary.featureCount).toBeGreaterThan(0)
    expect(report.summary.testCount).toBeGreaterThan(0)
  })

  it('returns a valid report (empty blast radius) when nothing resolves', async () => {
    const generator = new ImpactReportGenerator()
    const report = await generator.generate({ fileChanges: [file] })

    expect(report.summary).toBeDefined()
    expect(Array.isArray(report.recommendations)).toBe(true)
    expect(report.recommendations.length).toBeGreaterThan(0)
    expect(['critical', 'high', 'medium', 'low']).toContain(report.riskLevel)
  })
})
