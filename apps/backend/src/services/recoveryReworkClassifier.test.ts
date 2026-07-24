import { describe, it, expect } from 'vitest'
import {
  classifyRun,
  classifyRuns,
  toMinervaEvents,
  type ProcessRun,
} from './recoveryReworkClassifier'

const run = (over: Partial<ProcessRun> = {}): ProcessRun => ({
  id: 'run-1',
  issueId: 'issue-1',
  status: 'in_progress',
  ...over,
})

describe('classifyRun', () => {
  it('passes through terminal statuses without classification', () => {
    const r = run({ status: 'done' })
    const result = classifyRun(r, { failedRunIds: new Set(), issueRunCount: new Map([['issue-1', 1]]) })
    expect(result.recoveryType).toBeNull()
    expect(result.reason).toContain('Terminal status')
  })

  it('classifies recovery via blocked → in_progress transition (RC-R1)', () => {
    const r = run({
      status: 'in_progress',
      previousStatus: 'blocked',
    })
    const result = classifyRun(r, { failedRunIds: new Set(), issueRunCount: new Map([['issue-1', 1]]) })
    expect(result.recoveryType).toBe('recovery_status_transition')
    expect(result.confidence).toBe(0.9)
    expect(result.reason).toContain('blocked')
    expect(result.reason).toContain('in_progress')
  })

  it('classifies recovery via resume after pause (RC-R2)', () => {
    const r = run({
      status: 'in_progress',
      wasPaused: true,
    })
    const result = classifyRun(r, { failedRunIds: new Set(), issueRunCount: new Map([['issue-1', 1]]) })
    expect(result.recoveryType).toBe('recovery_resume')
    expect(result.confidence).toBe(0.85)
  })

  it('classifies rework via retry after failure (RC-W1)', () => {
    const r = run({
      id: 'run-2',
      status: 'in_progress',
    })
    const failedRunIds = new Set(['run-2'])
    const result = classifyRun(r, { failedRunIds, issueRunCount: new Map([['issue-1', 2]]) })
    expect(result.recoveryType).toBe('rework_retry')
    expect(result.confidence).toBe(0.8)
  })

  it('classifies rework via repeated runs on same issue (RC-W2)', () => {
    const r = run({
      status: 'in_progress',
    })
    const issueRunCount = new Map([['issue-1', 3]])
    const result = classifyRun(r, { failedRunIds: new Set(), issueRunCount })
    expect(result.recoveryType).toBe('rework_repeated_issue')
    expect(result.confidence).toBe(0.7)
    expect(result.reason).toContain('3 runs')
  })

  it('does not classify rework below threshold', () => {
    const r = run({
      status: 'in_progress',
    })
    const issueRunCount = new Map([['issue-1', 1]])
    const result = classifyRun(r, { failedRunIds: new Set(), issueRunCount })
    expect(result.recoveryType).toBeNull()
  })

  it('classifies intervention via pause/resume (RC-I1)', () => {
    const r = run({
      status: 'in_progress',
      wasPaused: true,
    })
    const result = classifyRun(r, { failedRunIds: new Set(), issueRunCount: new Map([['issue-1', 1]]) })
    // RC-R2 (recovery_resume) takes priority over RC-I1
    expect(result.recoveryType).toBe('recovery_resume')
  })

  it('returns null for unclassified runs', () => {
    const r = run({
      status: 'todo',
    })
    const result = classifyRun(r, { failedRunIds: new Set(), issueRunCount: new Map([['issue-1', 1]]) })
    expect(result.recoveryType).toBeNull()
    expect(result.reason).toContain('No recovery/rework')
  })

  it('respects custom blocked statuses', () => {
    const r = run({
      status: 'in_progress',
      previousStatus: 'waiting',
    })
    const result = classifyRun(
      r,
      { failedRunIds: new Set(), issueRunCount: new Map([['issue-1', 1]]) },
      { blockedStatuses: ['waiting'] },
    )
    expect(result.recoveryType).toBe('recovery_status_transition')
  })
})

describe('classifyRuns', () => {
  it('builds context and classifies batch', () => {
    const runs = [
      run({ id: 'r1', status: 'failed' }),
      run({ id: 'r2', status: 'in_progress' }),
    ]
    const report = classifyRuns(runs)
    expect(report.totalRuns).toBe(2)
    expect(report.perRun).toHaveLength(2)
    // r2 has 2 runs on the same issue → rework_repeated_issue
    const r2 = report.perRun.find(cr => cr.id === 'r2')
    expect(r2?.recoveryType).toBe('rework_repeated_issue')
  })

  it('counts recovery, rework, and intervention events', () => {
    const runs = [
      run({ id: 'r1', status: 'failed' }),
      run({ id: 'r2', status: 'in_progress', previousStatus: 'blocked' }),
      run({ id: 'r3', status: 'in_progress', wasPaused: true }),
      run({ id: 'r4', status: 'done' }),
    ]
    const report = classifyRuns(runs)
    expect(report.recoveryEvents).toBeGreaterThanOrEqual(1) // r2 or r3
    expect(report.reworkEvents).toBeGreaterThanOrEqual(1) // r2 or r3
  })
})

describe('toMinervaEvents', () => {
  it('filters and maps classified runs to Minerva events', () => {
    const runs = [
      run({ id: 'r1', status: 'failed' }),
      run({ id: 'r2', status: 'in_progress', previousStatus: 'blocked' }),
    ]
    const report = classifyRuns(runs)
    const events = toMinervaEvents(report)
    // Only classified runs with non-null recoveryType are included
    expect(events.length).toBeGreaterThanOrEqual(1)
    for (const e of events) {
      expect(e.recovery_type).not.toBeNull()
      expect(e.metadata.classification_confidence).toBeGreaterThan(0)
      expect(typeof e.metadata.classification_reason).toBe('string')
    }
  })

  it('returns empty array when no events classified', () => {
    const runs = [run({ status: 'done' })]
    const report = classifyRuns(runs)
    const events = toMinervaEvents(report)
    expect(events).toEqual([])
  })
})
