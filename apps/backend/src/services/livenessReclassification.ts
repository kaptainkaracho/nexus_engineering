/**
 * Liveness failure reclassification engine (THE-255 / THE-263).
 *
 * Implements the three reclassification rules (RC-1 / RC-2 / RC-3) plus the
 * genuine-infrastructure honorable mention from `reports/THE-255-reclassification-spec.md`.
 *
 * This module is a pure, dependency-free reference implementation of the
 * Paperclip core liveness classifier logic so it can be exercised and unit
 * tested without access to the platform repository. It reclassifies raw
 * `failed` heartbeat runs into a corrected outcome and recomputes the true
 * failure rate.
 */

export type RunStatus = 'failed' | 'succeeded' | 'blocked' | 'cancelled' | string

export type IssueStatus =
  | 'todo'
  | 'in_progress'
  | 'in_review'
  | 'done'
  | 'blocked'
  | string

export type AgentRole =
  | 'ceo'
  | 'cto'
  | 'researcher'
  | 'engineer'
  | 'designer'
  | 'backend'
  | 'frontend'
  | string

export type TaskType =
  | 'analysis'
  | 'planning'
  | 'research'
  | 'documentation'
  | 'execution'
  | string

/**
 * Normalized heartbeat-run record consumed by the reclassifier. Only `id` and
 * `status` are required; the rest refine the classification.
 */
export interface HeartbeatRun {
  id: string
  status: RunStatus
  agentRole?: AgentRole
  taskType?: TaskType
  /** Status of the linked issue at evaluation time (may lag the run). */
  issueStatus?: IssueStatus
  livenessReason?: string
  errorCode?: string
  error?: string
  /** ISO timestamps used for the RC-3 blocked time-box. */
  startedAt?: string
  finishedAt?: string
  /** True when the run output declared a concrete blocker. */
  blockerDeclared?: boolean
  /** Explicit disposition recorded for the run (e.g. `blocked`). */
  disposition?: string
}

/**
 * Reclassified outcome. `failure` and `infra_failure` count toward the true
 * failure rate; `success` and `parked` do not.
 */
export type ReclassifiedOutcome = 'success' | 'failure' | 'parked' | 'infra_failure'

export type ReclassificationRule = 'RC-1' | 'RC-2' | 'RC-3' | 'RC-0'

export interface ReclassifiedRun {
  id: string
  originalStatus: RunStatus
  reclassifiedStatus: ReclassifiedOutcome
  isFailure: boolean
  rules: ReclassificationRule[]
  reason: string
}

export interface ReclassificationReport {
  total: number
  failures: number
  success: number
  parked: number
  infraFailures: number
  /** True failure rate = (failure + infra_failure) / total. */
  failureRate: number
  /** How many originally-`failed` runs were reclassified out of failure. */
  reclassifiedCount: number
  perRun: ReclassifiedRun[]
}

export interface ReclassificationOptions {
  /** Roles exempt from the plan-only→failed rule (RC-1). */
  nonExecutorRoles?: AgentRole[]
  /** Task types exempt from the plan-only→failed rule (RC-1). */
  whitelistedTaskTypes?: TaskType[]
  /** Issue statuses that imply run success regardless of liveness (RC-2). */
  successIssueStatuses?: IssueStatus[]
  /** Max age (days) a `blocked` run may stay parked before it rolls into failure (RC-3). */
  blockedMaxAgeDays?: number
}

const DEFAULT_NON_EXECUTOR_ROLES: AgentRole[] = ['ceo', 'cto', 'researcher']
const DEFAULT_WHITELISTED_TASK_TYPES: TaskType[] = ['analysis', 'planning', 'research', 'documentation']
const DEFAULT_SUCCESS_ISSUE_STATUSES: IssueStatus[] = ['done', 'in_review']
const DEFAULT_BLOCKED_MAX_AGE_DAYS = 30

/** Matches the liveness watchdog's plan-only failure reasons (RC-1). */
const PLAN_ONLY_REASON = /no concrete action evidence|runnable future work|useful output but no concrete action|future work not safe to auto-continue|produced useful output/i

/** Matches a genuinely blocked run (RC-3). */
const BLOCKED_REASON = /declared a concrete blocker|issue status is blocked|blocked disposition/i

/** Matches the genuine context-window overflow signature (RC-0 honorable mention). */
const CONTEXT_OVERFLOW = /exceeds the available context size|context size \(\d+ tokens\)/i

export function isPlanOnlyLiveness(reason?: string): boolean {
  return !!reason && PLAN_ONLY_REASON.test(reason)
}

export function isExecutorRole(role?: AgentRole): boolean {
  if (!role) return true
  const r = String(role).toLowerCase()
  return r === 'engineer' || r === 'designer' || r === 'backend' || r === 'frontend'
}

export function isNonExecutorWhitelistedRole(role?: AgentRole, whitelist: AgentRole[] = DEFAULT_NON_EXECUTOR_ROLES): boolean {
  if (!role) return false
  const r = String(role).toLowerCase()
  return whitelist.some(w => String(w).toLowerCase() === r)
}

export function isWhitelistedTaskType(taskType?: TaskType, whitelist: TaskType[] = DEFAULT_WHITELISTED_TASK_TYPES): boolean {
  if (!taskType) return false
  const t = String(taskType).toLowerCase()
  return whitelist.some(w => String(w).toLowerCase() === t)
}

export function isSuccessIssueStatus(status?: IssueStatus, successStatuses: IssueStatus[] = DEFAULT_SUCCESS_ISSUE_STATUSES): boolean {
  if (!status) return false
  const s = String(status).toLowerCase()
  return successStatuses.some(w => String(w).toLowerCase() === s)
}

export function isBlockedRun(run: HeartbeatRun, blockedMaxAgeDays: number = DEFAULT_BLOCKED_MAX_AGE_DAYS): boolean {
  const fromDisposition = String(run.disposition ?? '').toLowerCase() === 'blocked'
  const fromIssueStatus = String(run.issueStatus ?? '').toLowerCase() === 'blocked'
  const fromFlag = run.blockerDeclared === true
  const fromReason = isPlanOnlyLiveness(run.livenessReason) ? false : BLOCKED_REASON.test(run.livenessReason ?? '')
  if (!(fromDisposition || fromIssueStatus || fromFlag || fromReason)) return false

  // Time-box: a blocker older than the threshold rolls into a real failure.
  if (run.finishedAt) {
    const finished = Date.parse(run.finishedAt)
    if (!Number.isNaN(finished)) {
      const ageDays = (Date.now() - finished) / (1000 * 60 * 60 * 24)
      if (ageDays > blockedMaxAgeDays) return false
    }
  }
  return true
}

export function isContextOverflow(run: HeartbeatRun): boolean {
  const ec = String(run.errorCode ?? '').toLowerCase()
  if (ec.includes('adapter_failed')) {
    return CONTEXT_OVERFLOW.test(run.error ?? '') || CONTEXT_OVERFLOW.test(run.livenessReason ?? '')
  }
  return false
}

/**
 * Reclassify a single run.
 *
 * Order of precedence:
 *  1. Already-succeeded / cancelled runs pass through as success (non-failure).
 *  2. RC-2: issue is done/in_review → success.
 *  3. RC-1: plan-only liveness on a non-executor / whitelisted task → success.
 *  4. RC-3: blocked disposition → parked (non-failure), unless time-boxed out.
 *  5. RC-0: genuine context overflow → infra_failure (real failure).
 *  6. Otherwise a `failed` run stays a `failure`.
 */
export function reclassifyRun(run: HeartbeatRun, options: ReclassificationOptions = {}): ReclassifiedRun {
  const nonExecutorRoles = options.nonExecutorRoles ?? DEFAULT_NON_EXECUTOR_ROLES
  const whitelistedTaskTypes = options.whitelistedTaskTypes ?? DEFAULT_WHITELISTED_TASK_TYPES
  const successIssueStatuses = options.successIssueStatuses ?? DEFAULT_SUCCESS_ISSUE_STATUSES
  const blockedMaxAgeDays = options.blockedMaxAgeDays ?? DEFAULT_BLOCKED_MAX_AGE_DAYS

  const rules: ReclassificationRule[] = []
  const reasonParts: string[] = []

  const originalStatus = run.status

  // Pass-through: non-failed runs are already correctly classified.
  if (String(run.status).toLowerCase() !== 'failed') {
    return {
      id: run.id,
      originalStatus,
      reclassifiedStatus: 'success',
      isFailure: false,
      rules: [],
      reason: `Run status "${run.status}" is already non-failed.`,
    }
  }

  // RC-2 — done-but-not-flipped.
  if (isSuccessIssueStatus(run.issueStatus, successIssueStatuses)) {
    rules.push('RC-2')
    reasonParts.push(`Linked issue status "${run.issueStatus}" implies success.`)
    return {
      id: run.id,
      originalStatus,
      reclassifiedStatus: 'success',
      isFailure: false,
      rules,
      reason: reasonParts.join(' '),
    }
  }

  // RC-1 — plan-only over-classification of non-executor work.
  if (
    isPlanOnlyLiveness(run.livenessReason) &&
    (isNonExecutorWhitelistedRole(run.agentRole, nonExecutorRoles) ||
      isWhitelistedTaskType(run.taskType, whitelistedTaskTypes))
  ) {
    rules.push('RC-1')
    reasonParts.push('Plan-only liveness on a non-executor role / whitelisted task is not a failure.')
    return {
      id: run.id,
      originalStatus,
      reclassifiedStatus: 'success',
      isFailure: false,
      rules,
      reason: reasonParts.join(' '),
    }
  }

  // RC-3 — blocked dispositions are valid, completed states (not failures).
  if (isBlockedRun(run, blockedMaxAgeDays)) {
    rules.push('RC-3')
    reasonParts.push('Blocked disposition is a valid parked state, excluded from failure denominator.')
    return {
      id: run.id,
      originalStatus,
      reclassifiedStatus: 'parked',
      isFailure: false,
      rules,
      reason: reasonParts.join(' '),
    }
  }

  // RC-0 — genuine infrastructure failure (context-window overflow) stays a failure.
  if (isContextOverflow(run)) {
    rules.push('RC-0')
    reasonParts.push('Genuine context-window overflow is a real infrastructure failure.')
    return {
      id: run.id,
      originalStatus,
      reclassifiedStatus: 'infra_failure',
      isFailure: true,
      rules,
      reason: reasonParts.join(' '),
    }
  }

  // Default: a `failed` run that matched no reclassification rule is a true failure.
  return {
    id: run.id,
    originalStatus,
    reclassifiedStatus: 'failure',
    isFailure: true,
    rules,
    reason: 'Failed run matched no reclassification rule; treated as a genuine failure.',
  }
}

/**
 * Reclassify a batch of runs and produce an aggregate report with the corrected
 * failure rate.
 */
export function reclassifyRuns(runs: HeartbeatRun[], options: ReclassificationOptions = {}): ReclassificationReport {
  const perRun = runs.map(run => reclassifyRun(run, options))
  let failures = 0
  let success = 0
  let parked = 0
  let infraFailures = 0

  for (const r of perRun) {
    if (r.reclassifiedStatus === 'failure') failures++
    else if (r.reclassifiedStatus === 'infra_failure') infraFailures++
    else if (r.reclassifiedStatus === 'parked') parked++
    else success++
  }

  const total = runs.length
  const realFailures = failures + infraFailures
  const reclassifiedCount = perRun.filter(r => r.originalStatus === 'failed' && !r.isFailure).length

  return {
    total,
    failures,
    success,
    parked,
    infraFailures,
    failureRate: total === 0 ? 0 : realFailures / total,
    reclassifiedCount,
    perRun,
  }
}

/**
 * Reconciliation helper (RC-2): given an updated issue status, decide whether a
 * previously-`failed` run should be flipped to success. Returns the new outcome
 * or `null` when no flip is warranted.
 */
export function reconcileRun(run: HeartbeatRun, issueStatus: IssueStatus, options: ReclassificationOptions = {}): ReclassifiedOutcome | null {
  if (String(run.status).toLowerCase() !== 'failed') return null
  const successStatuses = options.successIssueStatuses ?? DEFAULT_SUCCESS_ISSUE_STATUSES
  if (!isSuccessIssueStatus(issueStatus, successStatuses)) return null
  return 'success'
}
