import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { ImpactReportGenerator, FileNotFoundError, countCommits } from './impactReportGenerator'
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
    expect(report.affectedRequirements.some((a) => a.id === 'auth-R1')).toBe(true)
    expect(report.affectedFeatures.some((a) => a.id === 'auth-F1')).toBe(true)
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
    expect(report.recommendations[0].category).toBe('coverage')
    expect(['critical', 'high', 'medium', 'low']).toContain(report.riskLevel)
  })

  it('resolves a changed spec file to its traceable artifact ids', async () => {
    const specFile = join(dir, 'auth.spec.yaml')
    writeFileSync(
      specFile,
      [
        'title: Auth Spec',
        'version: "1.0"',
        'status: active',
        'requirements:',
        '  - id: auth-R2',
        '    title: Auth requirement',
        '    priority: P0',
        '    status: approved',
        '    references:',
        '      - type: test',
        '        id: auth-T2',
      ].join('\n'),
    )
    const db = getGraphDatabase()
    db.upsertNodes([
      { id: 'auth-R2', type: 'requirement', title: 'Auth requirement 2' },
      { id: 'auth-F2', type: 'feature', title: 'Auth feature 2' },
      { id: 'auth-T2', type: 'testCase', title: 'Auth test 2' },
    ])
    db.upsertEdge({ sourceId: 'auth-R2', targetId: 'auth-F2', relationshipType: 'satisfies', confidence: 'high' })
    db.upsertEdge({ sourceId: 'auth-F2', targetId: 'auth-T2', relationshipType: 'verifies', confidence: 'medium' })

    const generator = new ImpactReportGenerator()
    const report = await generator.generate({ fileChanges: [specFile] })
    expect(report.metadata.resolvedArtifactIds).toEqual(expect.arrayContaining(['auth-R2', 'auth-T2']))
    expect(report.affectedRequirements.some((a) => a.id === 'auth-R2')).toBe(true)
  })

  it('computes a high risk level for a feature with multiple direct impacted artifacts', async () => {
    const db = getGraphDatabase()
    db.upsertNodes([
      { id: 'multi-F1', type: 'feature', title: 'Feature' },
      { id: 'multi-R1', type: 'requirement', title: 'Requirement 1' },
      { id: 'multi-R2', type: 'requirement', title: 'Requirement 2' },
    ])
    db.upsertEdge({ sourceId: 'multi-R1', targetId: 'multi-F1', relationshipType: 'satisfies', confidence: 'high' })
    db.upsertEdge({ sourceId: 'multi-R2', targetId: 'multi-F1', relationshipType: 'satisfies', confidence: 'high' })
    const generator = new ImpactReportGenerator()
    const report = await generator.generate({ fileChanges: [], artifactIds: ['multi-F1'] })
    expect(report.riskLevel).toBe('high')
  })

  it('recommends test coverage when a requirement is hit without tests', async () => {
    const db = getGraphDatabase()
    db.upsertNodes([{ id: 'iso-R1', type: 'requirement', title: 'Orphan requirement' }])
    const generator = new ImpactReportGenerator()
    const report = await generator.generate({ fileChanges: [], artifactIds: ['iso-R1'] })
    expect(report.riskLevel).toBe('medium')
    expect(report.recommendations.some((r) => r.category === 'test')).toBe(true)
  })

  it('throws FileNotFoundError for a missing file', async () => {
    const generator = new ImpactReportGenerator()
    await expect(generator.generate({ fileChanges: [join(dir, 'ghost.md')] })).rejects.toBeInstanceOf(
      FileNotFoundError,
    )
  })

  it('countCommits is resilient and returns a number', () => {
    expect(typeof countCommits('HEAD~1', 'main')).toBe('number')
  })
})
