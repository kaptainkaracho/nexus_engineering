/**
 * Process Mining KPI utilities (THE-325)
 *
 * Compensates for Minerva's inflated success-rate denominator
 * which includes in-flight (running) runs.
 *
 * Raw API:   succeeded / total_runs   (includes in-flight in denominator)
 * Adjusted:  succeeded / (succeeded + failed)  (terminal-only denominator)
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ProcessRunStatus = 'succeeded' | 'failed' | 'running' | 'pending' | 'error';

/** Individual process run returned by the Minerva mining API. */
export interface ProcessRun {
  id: string;
  processId: string;
  status: ProcessRunStatus;
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  error?: string;
  metadata?: Record<string, unknown>;
}

/** Summary KPI payload from the Minerva process mining endpoint. */
export interface ProcessMiningKPI {
  /** Total runs (succeeded + failed + running + pending + error) */
  totalRuns: number;
  /** Runs that completed successfully */
  succeeded: number;
  /** Runs that completed with a failure */
  failed: number;
  /** Runs currently in-flight (running / pending) */
  inFlight: number;
  /** Raw success rate as reported by Minerva (succeeded / totalRuns) */
  rawSuccessRate: number;
  /** ISO timestamp of the last calculation */
  calculatedAt: string;
}

/** Client-side adjusted success rate result. */
export interface AdjustedSuccessRate {
  /** Succeeded count */
  succeeded: number;
  /** Failed count */
  failed: number;
  /** Terminal runs only (succeeded + failed), excludes in-flight */
  terminalRuns: number;
  /** Adjusted success rate: succeeded / terminalRuns, 0-100 */
  adjustedRate: number;
  /** Original raw rate for comparison */
  rawRate: number;
  /** Number of in-flight runs excluded from denominator */
  inFlightExcluded: number;
  /** ISO timestamp */
  calculatedAt: string;
}

// ---------------------------------------------------------------------------
// Calculation helpers
// ---------------------------------------------------------------------------

/** Compute adjusted success rate from a KPI payload. */
export function computeAdjustedSuccessRate(kpi: ProcessMiningKPI): AdjustedSuccessRate {
  const terminalRuns = kpi.succeeded + kpi.failed;
  const adjustedRate = terminalRuns === 0
    ? 0
    : (kpi.succeeded / terminalRuns) * 100;

  return {
    succeeded: kpi.succeeded,
    failed: kpi.failed,
    terminalRuns,
    adjustedRate: Math.round(adjustedRate * 100) / 100,
    rawRate: kpi.rawSuccessRate,
    inFlightExcluded: kpi.inFlight,
    calculatedAt: new Date().toISOString(),
  };
}

/** Compute adjusted success rate directly from raw counts. */
export function adjustedSuccessRate(
  succeeded: number,
  failed: number,
): number {
  const terminal = succeeded + failed;
  if (terminal === 0) return 0;
  return Math.round((succeeded / terminal) * 10000) / 100;
}

/** Compute raw success rate (total runs denominator). */
export function rawSuccessRate(
  succeeded: number,
  totalRuns: number,
): number {
  if (totalRuns === 0) return 0;
  return Math.round((succeeded / totalRuns) * 10000) / 100;
}

/** Aggregate a list of ProcessRun into a KPI object. */
export function aggregateRuns(runs: ProcessRun[]): ProcessMiningKPI {
  let succeeded = 0;
  let failed = 0;
  let inFlight = 0;

  for (const run of runs) {
    switch (run.status) {
      case 'succeeded':
        succeeded++;
        break;
      case 'failed':
      case 'error':
        failed++;
        break;
      case 'running':
      case 'pending':
        inFlight++;
        break;
    }
  }

  const totalRuns = succeeded + failed + inFlight;
  const rawSuccessRate = totalRuns === 0
    ? 0
    : Math.round((succeeded / totalRuns) * 10000) / 100;

  return {
    totalRuns,
    succeeded,
    failed,
    inFlight,
    rawSuccessRate,
    calculatedAt: new Date().toISOString(),
  };
}
