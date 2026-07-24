import type { ExecutionStatus, TestExecution } from '../../api/client';

export const STATUS_ORDER: ExecutionStatus[] = ['passed', 'failed', 'error', 'skipped', 'flaky'];

export type StatusCounts = Record<ExecutionStatus, number>;

export function emptyCounts(): StatusCounts {
  return { passed: 0, failed: 0, error: 0, skipped: 0, flaky: 0 };
}

/** Count executions by status. */
export function aggregateStatuses(executions: TestExecution[]): StatusCounts {
  const counts = emptyCounts();
  for (const e of executions) {
    if (e.status in counts) counts[e.status] += 1;
  }
  return counts;
}

/** Pass rate as a percentage, treating skipped/error/flaky as non-passing.
 *  Returns 0 when there are no executions. */
export function computePassRate(counts: StatusCounts): number {
  const total = counts.passed + counts.failed + counts.error + counts.skipped + counts.flaky;
  if (total === 0) return 0;
  return Math.round((counts.passed / total) * 100);
}

export interface SuiteCoverage {
  suiteId: string;
  passed: number;
  total: number;
  passRate: number;
}

/** Group executions by suite and compute per-suite pass rate. */
export function buildSuiteCoverage(executions: TestExecution[]): SuiteCoverage[] {
  const map = new Map<string, StatusCounts>();
  for (const e of executions) {
    const key = e.suiteId || 'default';
    if (!map.has(key)) map.set(key, emptyCounts());
    const c = map.get(key)!;
    if (e.status in c) c[e.status] += 1;
  }
  const suites: SuiteCoverage[] = [];
  for (const [suiteId, c] of map.entries()) {
    const total = c.passed + c.failed + c.error + c.skipped + c.flaky;
    suites.push({
      suiteId,
      passed: c.passed,
      total,
      passRate: total === 0 ? 0 : Math.round((c.passed / total) * 100),
    });
  }
  return suites.sort((a, b) => b.total - a.total || a.suiteId.localeCompare(b.suiteId));
}

export interface TrendPoint {
  label: string;
  passRate: number;
  total: number;
}

function dayLabel(iso?: string): string {
  if (!iso) return 'Unknown';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Unknown';
  return d.toISOString().slice(0, 10);
}

/** Group executions by calendar day and compute the daily pass rate. */
export function buildTrend(executions: TestExecution[]): TrendPoint[] {
  const map = new Map<string, StatusCounts>();
  for (const e of executions) {
    const key = dayLabel(e.startedAt);
    if (!map.has(key)) map.set(key, emptyCounts());
    const c = map.get(key)!;
    if (e.status in c) c[e.status] += 1;
  }
  const points: TrendPoint[] = [];
  for (const [label, c] of map.entries()) {
    const total = c.passed + c.failed + c.error + c.skipped + c.flaky;
    points.push({ label, passRate: computePassRate(c), total });
  }
  return points.sort((a, b) => a.label.localeCompare(b.label));
}

export function formatDuration(ms?: number): string {
  if (ms == null) return '—';
  if (ms < 1000) return `${ms}ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${Math.round(s % 60)}s`;
}

export function formatTimestamp(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
}
