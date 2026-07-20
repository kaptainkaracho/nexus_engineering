import { describe, it, expect } from 'vitest'
import {
  reclassifyRun,
  reclassifyRuns,
  reconcileRun,
  isPlanOnlyLiveness,
  isExecutorRole,
  isNonExecutorWhitelistedRole,
  isWhitelistedTaskType,
  isSuccessIssueStatus,
  isBlockedRun,
  isContextOverflow,
  type HeartbeatRun,
} from './livenessReclassification'

const failed = (over: Partial<HeartbeatRun> = {}): HeartbeatRun => ({
  id: 'run-1',
  status: 'failed',
  ...over,
})

describe('helpers', () => {
  it('detects plan-only liveness reasons', () => {
    expect(isPlanOnlyLiveness('Run described runnable future work without concrete action evidence')).toBe(true)
    expect(isPlanOnlyLiveness('produced useful output but no concrete action evidence')).toBe(true)
    expect(isPlanOnlyLiveness('Issue is done')).toBe(false)
    expect(isPlanOnlyLiveness(undefined)).toBe(false)
  })

  it('classifies executor vs non-executor roles', () => {
    expect(isExecutorRole('engineer')).toBe(true)
    expect(isExecutorRole('frontend')).toBe(true)
    expect(isExecutorRole('cto')).toBe(false)
    expect(isExecutorRole(undefined)).toBe(true)
    expect(isNonExecutorWhitelistedRole('ceo')).toBe(true)
    expect(isNonExecutorWhitelistedRole('engineer')).toBe(false)
  })

  it('classifies whitelisted task types', () => {
    expect(isWhitelistedTaskType('analysis')).toBe(true)
    expect(isWhitelistedTaskType('research')).toBe(true)
    expect(isWhitelistedTaskType('execution')).toBe(false)
    expect(isWhitelistedTaskType(undefined)).toBe(false)
  })

  it('detects success issue statuses', () => {
    expect(isSuccessIssueStatus('done')).toBe(true)
    expect(isSuccessIssueStatus('in_review')).toBe(true)
    expect(isSuccessIssueStatus('blocked')).toBe(false)
  })

  it('detects context overflow (RC-0)', () => {
    const run = failed({ errorCode: 'adapter_failed', error: 'request (74141 tokens) exceeds the available context size (65536 tokens)' })
    expect(isContextOverflow(run)).toBe(true)
    expect(isContextOverflow(failed({ errorCode: 'adapter_failed' }))).toBe(false)
  })

  it('detects blocked runs and time-boxes aged blockers (RC-3)', () => {
    const recent = failed({ blockerDeclared: true, finishedAt: new Date().toISOString() })
    expect(isBlockedRun(recent)).toBe(true)
    const old = failed({ disposition: 'blocked', finishedAt: new Date(Date.now() - 40 * 864e5).toISOString() })
    expect(isBlockedRun(old, 30)).toBe(false)
  })
})

describe('reclassifyRun', () => {
  it('passes through non-failed runs as success', () => {
    const r = reclassifyRun({ id: 'x', status: 'succeeded' })
    expect(r.reclassifiedStatus).toBe('success')
    expect(r.isFailure).toBe(false)
  })

  it('RC-2: done issue flips a failed run to success', () => {
    const r = reclassifyRun(failed({ issueStatus: 'done', livenessReason: 'Issue is done' }))
    expect(r.reclassifiedStatus).toBe('success')
    expect(r.rules).toContain('RC-2')
    expect(r.isFailure).toBe(false)
  })

  it('RC-2: in_review issue flips a failed run to success', () => {
    const r = reclassifyRun(failed({ issueStatus: 'in_review' }))
    expect(r.rules).toContain('RC-2')
  })

  it('RC-1: plan-only on a non-executor role is not a failure', () => {
    const r = reclassifyRun(failed({ agentRole: 'cto', livenessReason: 'runnable future work, no action' }))
    expect(r.reclassifiedStatus).toBe('success')
    expect(r.rules).toContain('RC-1')
  })

  it('RC-1: plan-only on a whitelisted task type is not a failure', () => {
    const r = reclassifyRun(failed({ taskType: 'analysis', livenessReason: 'useful output but no concrete action' }))
    expect(r.rules).toContain('RC-1')
    expect(r.isFailure).toBe(false)
  })

  it('RC-1 does NOT rescue an executor with plan-only output', () => {
    const r = reclassifyRun(failed({ agentRole: 'engineer', livenessReason: 'runnable future work, no action' }))
    expect(r.reclassifiedStatus).toBe('failure')
    expect(r.rules).not.toContain('RC-1')
  })

  it('RC-3: blocked disposition becomes parked (non-failure)', () => {
    const r = reclassifyRun(failed({ disposition: 'blocked', livenessReason: 'Run output declared a concrete blocker' }))
    expect(r.reclassifiedStatus).toBe('parked')
    expect(r.rules).toContain('RC-3')
    expect(r.isFailure).toBe(false)
  })

  it('RC-3: aged block rolls into a real failure', () => {
    const r = reclassifyRun(failed({ disposition: 'blocked', finishedAt: new Date(Date.now() - 40 * 864e5).toISOString() }), { blockedMaxAgeDays: 30 })
    expect(r.reclassifiedStatus).toBe('failure')
    expect(r.isFailure).toBe(true)
  })

  it('RC-0: genuine context overflow stays a real failure', () => {
    const r = reclassifyRun(failed({ errorCode: 'adapter_failed', error: 'exceeds the available context size (65536 tokens)' }))
    expect(r.reclassifiedStatus).toBe('infra_failure')
    expect(r.rules).toContain('RC-0')
    expect(r.isFailure).toBe(true)
  })

  it('default failed run is a genuine failure', () => {
    const r = reclassifyRun(failed({ livenessReason: 'some unknown error' }))
    expect(r.reclassifiedStatus).toBe('failure')
    expect(r.isFailure).toBe(true)
  })
})

describe('reclassifyRuns', () => {
  it('computes corrected failure rate across the sample from THE-253', () => {
    const runs: HeartbeatRun[] = [
      failed({ id: '1', disposition: 'blocked' }), // RC-3 parked
      failed({ id: '2', issueStatus: 'done', livenessReason: 'Issue is done' }), // RC-2 success
      failed({ id: '3', agentRole: 'cto', livenessReason: 'runnable future work, no action' }), // RC-1 success
      failed({ id: '4', errorCode: 'adapter_failed', error: 'exceeds the available context size (65536 tokens)' }), // RC-0
      failed({ id: '5', livenessReason: 'mysterious failure' }), // genuine
      { id: '6', status: 'succeeded' }, // already fine
    ]
    const report = reclassifyRuns(runs)
    expect(report.total).toBe(6)
    expect(report.parked).toBe(1)
    expect(report.success).toBe(3) // RC-2 + RC-1 + already-succeeded
    expect(report.infraFailures).toBe(1)
    expect(report.failures).toBe(1)
    // True failure rate = (genuine + infra) / total = 2/6
    expect(report.failureRate).toBeCloseTo(2 / 6)
    expect(report.reclassifiedCount).toBe(3) // RC-1 + RC-2 + RC-3 moved out of failure
  })

  it('handles empty input', () => {
    const report = reclassifyRuns([])
    expect(report.total).toBe(0)
    expect(report.failureRate).toBe(0)
  })
})

describe('reconcileRun', () => {
  it('returns success when issue becomes done', () => {
    expect(reconcileRun(failed({ livenessReason: 'Issue is done' }), 'done')).toBe('success')
  })

  it('returns null when issue is not a success status', () => {
    expect(reconcileRun(failed(), 'blocked')).toBeNull()
  })

  it('returns null for non-failed runs', () => {
    expect(reconcileRun({ id: 'x', status: 'succeeded' }, 'done')).toBeNull()
  })
})
