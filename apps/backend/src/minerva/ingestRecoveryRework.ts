import { classifyRuns, toMinervaEvents, type ProcessRun } from '../services/recoveryReworkClassifier'

const MINERVA_BASE = process.env.MINERVA_URL ?? 'http://localhost:8002'
const MINERVA_API_KEY = process.env.MINERVA_API_KEY ?? ''
const TENANT = process.env.MINERVA_TENANT ?? 'paperclip_company'
const PAPERCLIP_API = process.env.PAPERCLIP_API_URL ?? 'http://127.0.0.1:3100'
const PAPERCLIP_KEY = process.env.PAPERCLIP_API_KEY ?? ''

async function fetchRunsFromPaperclip(): Promise<ProcessRun[]> {
  throw new Error('Not implemented: fetch runs from Paperclip API')
}

async function pushToMinervaBpmnClassify(events: unknown[]): Promise<{ accepted: number }> {
  throw new Error('Not implemented: push to Minerva BPMN classify')
}

export async function ingestRecoveryRework(): Promise<{
  runs: number
  classified: number
  recovery: number
  rework: number
  accepted: number
}> {
  const runs = await fetchRunsFromPaperclip()
  const report = classifyRuns(runs)
  const events = toMinervaEvents(report)
  const { accepted } = await pushToMinervaBpmnClassify(events)

  return {
    runs: report.totalRuns,
    classified: report.classified,
    recovery: report.recoveryEvents,
    rework: report.reworkEvents,
    accepted,
  }
}
