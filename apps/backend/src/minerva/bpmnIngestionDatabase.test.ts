import { describe, it, expect } from 'vitest'
import { getBpmnIngestionDatabase, resetBpmnIngestionDatabase } from '../minerva/bpmnIngestionDatabase'

describe('BpmnIngestionDatabase', () => {
  it('creates and finds an ingestion run', () => {
    resetBpmnIngestionDatabase()
    const db = getBpmnIngestionDatabase(':memory:')
    const runId = 'test-run-123'
    const run = db.createRun({ id: runId })
    expect(run.id).toBe(runId)
    expect(run.status).toBe('pending')
    expect(run.runsFetched).toBe(0)

    const found = db.findRunById(runId)
    expect(found).toBeDefined()
    expect(found!.id).toBe(runId)
  })

  it('updates run metrics correctly', () => {
    resetBpmnIngestionDatabase()
    const db = getBpmnIngestionDatabase(':memory:')
    const runId = 'test-run-456'

    db.createRun({ id: runId, runsFetched: 10, runsClassified: 5, recoveryEvents: 2, reworkEvents: 1 })

    db.updateRunMetrics(runId, { eventsPushed: 3 })

    const updated = db.findRunById(runId)
    expect(updated!.runsFetched).toBe(10)
    expect(updated!.runsClassified).toBe(5)
    expect(updated!.recoveryEvents).toBe(2)
    expect(updated!.reworkEvents).toBe(1)
    expect(updated!.eventsPushed).toBe(3)
  })

  it('inserts events and finds them by run', () => {
    resetBpmnIngestionDatabase()
    const db = getBpmnIngestionDatabase(':memory:')
    const runId = 'test-run-789'
    db.createRun({ id: runId })

    const eventId = 'event-1'
    const event = {
      id: eventId,
      ingestionRunId: runId,
      caseId: 'issue-123',
      activity: 'Run.failed',
      recoveryType: 'recovery_status_transition',
      classificationConfidence: 0.9,
      classificationReason: 'Blocked to in_progress transition',
      rawPayload: JSON.stringify({
        case_id: 'issue-123',
        activity: 'Run.failed',
        recovery_type: 'recovery_status_transition',
        metadata: { classification_confidence: 0.9, classification_reason: 'Blocked to in_progress transition' },
      }),
    }

    db.insertEvent(event)

    const events = db.getEventsByRun(runId)
    expect(events).toHaveLength(1)
    expect(events[0].id).toBe(eventId)
    expect(events[0].caseId).toBe('issue-123')
    expect(events[0].recoveryType).toBe('recovery_status_transition')
  })

  it('inserts events in batch mode', () => {
    resetBpmnIngestionDatabase()
    const db = getBpmnIngestionDatabase(':memory:')
    const runId = 'test-run-batch'
    db.createRun({ id: runId })

    const events = [
      {
        id: 'event-batch-1',
        ingestionRunId: runId,
        caseId: 'issue-batch-1',
        activity: 'Run.failed',
        recoveryType: 'recovery_status_transition',
        classificationConfidence: 0.8,
        classificationReason: 'Test reason',
        rawPayload: JSON.stringify({ test: 1 }),
      },
      {
        id: 'event-batch-2',
        ingestionRunId: runId,
        caseId: 'issue-batch-2',
        activity: 'Run.blocked',
        recoveryType: 'rework_retry',
        classificationConfidence: 0.7,
        classificationReason: 'Test reason 2',
        rawPayload: JSON.stringify({ test: 2 }),
      },
    ]

    db.insertEventsBatch(events)

    const runEvents = db.getEventsByRun(runId)
    expect(runEvents).toHaveLength(2)
    expect(runEvents.map(e => e.recoveryType)).toEqual(['recovery_status_transition', 'rework_retry'])
  })

  it('clears all data', () => {
    resetBpmnIngestionDatabase()
    const db = getBpmnIngestionDatabase(':memory:')
    const runId = 'test-run-clear'
    db.createRun({ id: runId })

    db.insertEvent({
      id: 'event-clear',
      ingestionRunId: runId,
      caseId: 'issue-clear',
      activity: 'Run.test',
      recoveryType: 'recovery_status_transition',
      classificationConfidence: 0.5,
      classificationReason: 'Test',
      rawPayload: '{}',
    })

    db.clear()

    const remainingRuns = db.listRecentRuns(10)
    expect(remainingRuns).toHaveLength(0)

    const remainingEvents = db.getEventCount('non-existent-run')
    expect(remainingEvents).toBe(0)
  })
})