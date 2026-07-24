/**
 * Recovery and Rework Event Classifier (THE-322 / R3).
 *
 * Classifies process mining events and heartbeat runs to identify:
 *  - Recovery events: status transitions (blocked → in_progress), pause/resume cycles
 *  - Rework events: repeated runs on the same issue, failed-then-retried patterns
 *  - Intervention events: agent pause/resume, manual overrides
 *
 * Produces enriched event metadata that can be pushed to Minerva's BPMN classifier
 * to populate the `recovery_type` field on process mining events.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RunStatus =
  | 'todo'
  | 'in_progress'
  | 'in_review'
  | 'done'
  | 'blocked'
  | 'cancelled'
  | 'failed'
  | 'succeeded'
  | string

export type RecoveryType =
  | 'recovery_status_transition'
  | 'recovery_resume'
  | 'rework_retry'
  | 'rework_repeated_issue'
  | 'intervention_pause_resume'
  | 'intervention_manual_override'
  | null

export interface ProcessRun {
  id: string
  issueId: string
  issueTitle?: string
  status: RunStatus
  agentRole?: string
  startedAt?: string
  finishedAt?: string
  durationMs?: number
  /** Previous status if known (for transition detection). */
  previousStatus?: RunStatus
  /** Whether this run was paused and later resumed. */
  wasPaused?: boolean
  /** Whether the run explicitly declared a blocker. */
  blockerDeclared?: boolean
}

export interface ClassifiedRun {
  id: string
  issueId: string
  originalStatus: RunStatus
  recoveryType: RecoveryType
  confidence: number
  reason: string
}

export interface ClassificationReport {
  totalRuns: number
  classified: number
  recoveryEvents: number
  reworkEvents: number
  interventionEvents: number
  unclassified: number
  perRun: ClassifiedRun[]
}

export interface ClassificationOptions {
  /**
   * Min number of runs on the same issue to flag as rework.
   * Default: 2 (a failed run + at least one retry).
   */
  minReworkThreshold?: number
  /** Issue statuses that indicate a blocked state. */
  blockedStatuses?: string[]
  /** Issue statuses that indicate active work. */
  activeStatuses?: string[]
}

const DEFAULT_BLOCKED_STATUSES = ['blocked']
const DEFAULT_ACTIVE_STATUSES = ['in_progress']
const DEFAULT_MIN_REWORK_THRESHOLD = 2

// ---------------------------------------------------------------------------
// Classification rules
// ---------------------------------------------------------------------------

/**
 * RC-R1: Recovery via status transition (blocked → in_progress).
 * When an issue moves from a blocked status to an active status, any run
 * starting in that window is a recovery event.
 */
function isRecoveryStatusTransition(run: ProcessRun, opts: Required<ClassificationOptions>): boolean {
  if (!run.previousStatus) return false
  const prev = String(run.previousStatus).toLowerCase()
  const curr = String(run.status).toLowerCase()
  return opts.blockedStatuses.includes(prev) && opts.activeStatuses.includes(curr)
}

/**
 * RC-R2: Recovery via resume (pause → active).
 * When a run was paused and later resumes with in_progress status.
 */
function isRecoveryResume(run: ProcessRun): boolean {
  return run.wasPaused === true && String(run.status).toLowerCase() === 'in_progress'
}

/**
 * RC-W1: Rework via retry on same issue.
 * When multiple runs exist for the same issue, and at least one has failed
 * before this one started.
 */
function isReworkRetry(
  run: ProcessRun,
  failedRunIds: Set<string>,
): boolean {
  return failedRunIds.has(run.id)
}

/**
 * RC-W2: Rework via repeated runs on same issue.
 * When the total count of runs on the same issue meets the rework threshold.
 */
function isReworkRepeatedIssue(
  run: ProcessRun,
  issueRunCount: Map<string, number>,
  threshold: number,
): boolean {
  const count = issueRunCount.get(run.issueId) ?? 0
  return count >= threshold
}

/**
 * RC-I1: Intervention via pause/resume cycle.
 * When a run was paused and later resumed, the resume event is an intervention.
 */
function isInterventionPauseResume(run: ProcessRun): boolean {
  return run.wasPaused === true && String(run.status).toLowerCase() === 'in_progress'
}

// ---------------------------------------------------------------------------
// Main classifier
// ---------------------------------------------------------------------------

export function classifyRun(
  run: ProcessRun,
  context: {
    failedRunIds: Set<string>
    issueRunCount: Map<string, number>
  },
  options: ClassificationOptions = {},
): ClassifiedRun {
  const opts: Required<ClassificationOptions> = {
    minReworkThreshold: options.minReworkThreshold ?? DEFAULT_MIN_REWORK_THRESHOLD,
    blockedStatuses: options.blockedStatuses ?? DEFAULT_BLOCKED_STATUSES,
    activeStatuses: options.activeStatuses ?? DEFAULT_ACTIVE_STATUSES,
  }

  // Already-terminal runs don't need classification
  const status = String(run.status).toLowerCase()
  if (status === 'done' || status === 'cancelled' || status === 'succeeded') {
    return {
      id: run.id,
      issueId: run.issueId,
      originalStatus: run.status,
      recoveryType: null,
      confidence: 1.0,
      reason: 'Terminal status — no recovery/rework classification needed.',
    }
  }

  // Priority order: recovery > rework > intervention

  // RC-R1: Recovery via blocked → in_progress transition
  if (isRecoveryStatusTransition(run, opts)) {
    return {
      id: run.id,
      issueId: run.issueId,
      originalStatus: run.status,
      recoveryType: 'recovery_status_transition',
      confidence: 0.9,
      reason: `Status transition from "${run.previousStatus}" to "${run.status}" indicates recovery.`,
    }
  }

  // RC-R2: Recovery via resume after pause
  if (isRecoveryResume(run)) {
    return {
      id: run.id,
      issueId: run.issueId,
      originalStatus: run.status,
      recoveryType: 'recovery_resume',
      confidence: 0.85,
      reason: 'Run resumed after being paused — recovery event.',
    }
  }

  // RC-W1: Rework via retry after failure
  if (isReworkRetry(run, context.failedRunIds)) {
    return {
      id: run.id,
      issueId: run.issueId,
      originalStatus: run.status,
      recoveryType: 'rework_retry',
      confidence: 0.8,
      reason: 'Run is a retry after a previous failure on this issue.',
    }
  }

  // RC-W2: Rework via repeated runs on same issue
  if (isReworkRepeatedIssue(run, context.issueRunCount, opts.minReworkThreshold)) {
    return {
      id: run.id,
      issueId: run.issueId,
      originalStatus: run.status,
      recoveryType: 'rework_repeated_issue',
      confidence: 0.7,
      reason: `Issue has ${context.issueRunCount.get(run.issueId)} runs (>= ${opts.minReworkThreshold} threshold) — potential rework.`,
    }
  }

  // RC-I1: Intervention via pause/resume (if not already classified as recovery)
  if (isInterventionPauseResume(run)) {
    return {
      id: run.id,
      issueId: run.issueId,
      originalStatus: run.status,
      recoveryType: 'intervention_pause_resume',
      confidence: 0.75,
      reason: 'Pause/resume cycle detected — intervention event.',
    }
  }

  // No classification matched
  return {
    id: run.id,
    issueId: run.issueId,
    originalStatus: run.status,
    recoveryType: null,
    confidence: 0,
    reason: 'No recovery/rework/intervention pattern detected.',
  }
}

/**
 * Classify a batch of runs. Builds context (failed run IDs, issue run counts)
 * from the batch before classifying each run.
 */
export function classifyRuns(
  runs: ProcessRun[],
  options: ClassificationOptions = {},
): ClassificationReport {
  // Build context: which runs have failed per issue
  const failedRunIds = new Set<string>()
  const issueRunCount = new Map<string, number>()

  for (const run of runs) {
    const count = issueRunCount.get(run.issueId) ?? 0
    issueRunCount.set(run.issueId, count + 1)

    const status = String(run.status).toLowerCase()
    if (status === 'failed') {
      failedRunIds.add(run.id)
    }
  }

  const perRun = runs.map(run =>
    classifyRun(run, { failedRunIds, issueRunCount }, options),
  )

  let recoveryEvents = 0
  let reworkEvents = 0
  let interventionEvents = 0
  let unclassified = 0

  for (const cr of perRun) {
    if (cr.recoveryType === null) {
      unclassified++
    } else if (cr.recoveryType.startsWith('recovery_')) {
      recoveryEvents++
    } else if (cr.recoveryType.startsWith('rework_')) {
      reworkEvents++
    } else if (cr.recoveryType.startsWith('intervention_')) {
      interventionEvents++
    }
  }

  return {
    totalRuns: runs.length,
    classified: runs.length - unclassified,
    recoveryEvents,
    reworkEvents,
    interventionEvents,
    unclassified,
    perRun,
  }
}

/**
 * Produce Minerva-compatible enriched events from classified runs.
 * Each enriched event has the `recovery_type` field populated for BPMN classification.
 */
export function toMinervaEvents(classified: ClassificationReport): Array<{
  case_id: string
  activity: string
  recovery_type: RecoveryType
  metadata: {
    classification_confidence: number
    classification_reason: string
  }
}> {
  return classified.perRun
    .filter(cr => cr.recoveryType !== null)
    .map(cr => ({
      case_id: cr.issueId,
      activity: `Run.${cr.originalStatus}`,
      recovery_type: cr.recoveryType,
      metadata: {
        classification_confidence: cr.confidence,
        classification_reason: cr.reason,
      },
    }))
}
