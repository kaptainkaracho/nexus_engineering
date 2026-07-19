import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, Container, Grid, Stack } from '@nexus-engineering/shared';
import {
  fetchTestResults,
  type ExecutionStatus,
  type TestExecution,
} from '../../api/client';
import { PassRateTrend, StatusDistribution, SuiteCoverage, STATUS_COLORS, STATUS_LABELS } from './charts';
import {
  aggregateStatuses,
  buildSuiteCoverage,
  buildTrend,
  computePassRate,
  formatDuration,
  formatTimestamp,
  STATUS_ORDER,
} from './stats';
import './TestResultsDashboard.css';

const STATUS_BADGE: Record<ExecutionStatus, string> = {
  passed: 'approved',
  failed: 'rejected',
  error: 'critical',
  skipped: 'low',
  flaky: 'medium',
};

type FilterValue = ExecutionStatus | 'all';

function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: string;
}) {
  return (
    <Card padding="md">
      <Stack gap={1}>
        <span className="text-xs font-medium uppercase tracking-wide text-text-tertiary">
          {label}
        </span>
        <span
          className="text-3xl font-bold tabular-nums"
          style={accent ? { color: accent } : undefined}
        >
          {value}
        </span>
        {hint && <span className="text-xs text-text-tertiary">{hint}</span>}
      </Stack>
    </Card>
  );
}

export function TestResultsDashboard() {
  const [executions, setExecutions] = useState<TestExecution[]>([]);
  const [documents, setDocuments] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterValue>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchTestResults();
      setExecutions(res.executions);
      setDocuments(res.documents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load test results');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo(() => aggregateStatuses(executions), [executions]);
  const total = executions.length;
  const passRate = useMemo(() => computePassRate(counts), [counts]);
  const suites = useMemo(() => buildSuiteCoverage(executions), [executions]);
  const trend = useMemo(() => buildTrend(executions), [executions]);

  const filtered = useMemo(
    () => (filter === 'all' ? executions : executions.filter((e) => e.status === filter)),
    [executions, filter],
  );

  const filterOptions: FilterValue[] = ['all', ...STATUS_ORDER];

  const isEmpty = !loading && !error && total === 0;

  return (
    <Container size="lg" className="py-8">
      <Stack gap={2} className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Test Results Dashboard</h1>
        <p className="text-text-secondary">
          Execution evidence across {documents} test document{documents === 1 ? '' : 's'}.
          Track pass/fail trends and per-suite coverage from your TER pipeline.
        </p>
      </Stack>

      {error && (
        <Card padding="lg" className="mb-6 border border-error-500/40">
          <Stack gap={3}>
            <p className="text-sm text-error-600 dark:text-error-400" role="alert">
              Error loading test results: {error}
            </p>
            <div>
              <Button variant="secondary" size="sm" onClick={() => void load()}>
                Retry
              </Button>
            </div>
          </Stack>
        </Card>
      )}

      {loading && (
        <div className="ter-skeletons" aria-hidden="true">
          <div className="ter-skeleton ter-skeleton-card" />
          <div className="ter-skeleton ter-skeleton-card" />
          <div className="ter-skeleton ter-skeleton-card" />
          <div className="ter-skeleton ter-skeleton-card" />
        </div>
      )}

      {isEmpty && (
        <Card padding="lg" className="mb-6">
          <Stack gap={2} className="items-center py-8 text-center">
            <p className="text-text-secondary">No test results available yet.</p>
            <p className="max-w-sm text-sm text-text-tertiary">
              Run your test pipeline to publish <code>.ter.yaml</code> documents, then refresh to
              see trends and coverage.
            </p>
            <Button variant="secondary" size="sm" onClick={() => void load()}>
              Refresh
            </Button>
          </Stack>
        </Card>
      )}

      {!loading && !error && !isEmpty && (
        <>
          <Grid cols={4} gap={4} className="mb-6">
            <StatCard label="Total Executions" value={total} hint={`${documents} documents`} />
            <StatCard
              label="Pass Rate"
              value={`${passRate}%`}
              accent={passRate >= 90 ? '#16A34A' : passRate >= 70 ? '#8B5CF6' : '#DC2626'}
            />
            <StatCard label="Failed" value={counts.failed + counts.error} hint="failures + errors" />
            <StatCard label="Flaky" value={counts.flaky} hint="non-deterministic" />
          </Grid>

          <Card padding="lg" className="mb-6">
            <Stack gap={3}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-text-primary">Status Distribution</h2>
                <StatusDistribution counts={counts} total={total} />
              </div>
              <ul className="flex flex-wrap gap-x-4 gap-y-2">
                {STATUS_ORDER.map((s) => (
                  <li key={s} className="flex items-center gap-2 text-sm text-text-secondary">
                    <span
                      className="inline-block h-3 w-3 rounded-full"
                      style={{ backgroundColor: STATUS_COLORS[s] }}
                      aria-hidden="true"
                    />
                    {STATUS_LABELS[s]}
                    <span className="tabular-nums text-text-tertiary">{counts[s]}</span>
                  </li>
                ))}
              </ul>
            </Stack>
          </Card>

          <Grid cols={2} gap={6} className="mb-6">
            <Card padding="lg">
              <Stack gap={3}>
                <h2 className="text-lg font-semibold text-text-primary">Pass Rate Trend</h2>
                {trend.length === 0 ? (
                  <p className="py-8 text-center text-sm text-text-tertiary">
                    No timestamped runs to chart.
                  </p>
                ) : (
                  <PassRateTrend points={trend} />
                )}
              </Stack>
            </Card>
            <Card padding="lg">
              <Stack gap={3}>
                <h2 className="text-lg font-semibold text-text-primary">Suite Coverage</h2>
                {suites.length === 0 ? (
                  <p className="py-8 text-center text-sm text-text-tertiary">
                    No suites detected.
                  </p>
                ) : (
                  <SuiteCoverage suites={suites.slice(0, 8)} />
                )}
              </Stack>
            </Card>
          </Grid>

          <Card padding="lg">
            <Stack gap={4}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-text-primary">Executions</h2>
                <div
                  role="group"
                  aria-label="Filter executions by status"
                  className="flex flex-wrap gap-2"
                >
                  {filterOptions.map((opt) => {
                    const isActive = filter === opt;
                    const count =
                      opt === 'all' ? total : counts[opt as ExecutionStatus];
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setFilter(opt)}
                        aria-pressed={isActive}
                        className={`ter-filter-chip ${isActive ? 'is-active' : ''}`}
                      >
                        {opt === 'all' ? 'All' : STATUS_LABELS[opt as ExecutionStatus]}
                        <span className="ter-filter-count">{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="ter-table-wrap">
                <table className="ter-table">
                  <caption className="sr-only">
                    Test executions, {filtered.length} shown
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Suite</th>
                      <th scope="col">Case</th>
                      <th scope="col">Status</th>
                      <th scope="col">Duration</th>
                      <th scope="col">Retries</th>
                      <th scope="col">Started</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((e) => {
                      const open = expandedId === e.id;
                      return (
                         <Fragment key={e.id}>
                          <tr
                            className="ter-row"
                            onClick={() => setExpandedId(open ? null : e.id)}
                            tabIndex={0}
                            role="button"
                            aria-expanded={open}
                            onKeyDown={(ev) => {
                              if (ev.key === 'Enter' || ev.key === ' ') {
                                ev.preventDefault();
                                setExpandedId(open ? null : e.id);
                              }
                            }}
                          >
                            <td className="font-medium">{e.suiteId}</td>
                            <td>{e.caseId}</td>
                            <td>
                              <Badge variant={STATUS_BADGE[e.status]}>{STATUS_LABELS[e.status]}</Badge>
                            </td>
                            <td className="tabular-nums">{formatDuration(e.durationMs)}</td>
                            <td className="tabular-nums">{e.retries ?? 0}</td>
                            <td className="text-text-tertiary">{formatTimestamp(e.startedAt)}</td>
                          </tr>
                          {open && (
                            <tr className="ter-detail-row">
                              <td colSpan={6}>
                                <Stack gap={2} className="py-2">
                                  <span className="text-xs font-medium uppercase tracking-wide text-text-tertiary">
                                    Execution {e.id}
                                  </span>
                                  {e.error ? (
                                    <pre className="ter-error-block" aria-label="Error details">
                                      {e.error.type ? `${e.error.type}: ` : ''}
                                      {e.error.message}
                                      {e.error.stack ? `\n\n${e.error.stack}` : ''}
                                    </pre>
                                  ) : (
                                    <p className="text-sm text-text-tertiary">
                                      No error captured for this execution.
                                    </p>
                                  )}
                                  {e.artifacts && e.artifacts.length > 0 && (
                                    <ul className="flex flex-wrap gap-2">
                                      {e.artifacts.map((a, i) => (
                                        <li key={i}>
                                          <Badge variant="info">
                                            {a.type}
                                            {a.url ? ' ↗' : ''}
                                          </Badge>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </Stack>
                              </td>
                            </tr>
                          )}
                         </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Stack>
          </Card>
        </>
      )}
    </Container>
  );
}
