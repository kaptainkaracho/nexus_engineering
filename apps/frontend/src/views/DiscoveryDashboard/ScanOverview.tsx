import { useState } from 'react';
import { Button, Card, Input, Stack } from '@nexus-engineering/shared';
import type { RegistrySummary } from '../../api/client';
import {
  LIFECYCLE_LABEL,
  LIFECYCLE_ORDER,
  TYPE_LABEL,
  TYPE_ORDER,
  relativeTime,
} from './constants';

export type ScanPhase = 'idle' | 'running' | 'completed' | 'failed';

interface ScanOverviewProps {
  summary: RegistrySummary;
  lastScanAt: string | null;
  lastScanFiles: number | null;
  phase: ScanPhase;
  progressPct: number | null;
  onRunScan: (repositoryPath: string) => void;
  defaultPath: string;
}

const TYPE_COLORS: Record<string, string> = {
  requirement: '#0EA5E9',
  architecture: '#F59E0B',
  adr: '#6366F1',
  spec: '#14B8A6',
  unknown: '#64748B',
};

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <Card padding="lg" className="flex-1">
      <Stack gap={1}>
        <span className="text-sm text-text-tertiary">{label}</span>
        <span
          className="text-3xl font-bold text-text-primary"
          style={accent ? { color: accent } : undefined}
        >
          {value}
        </span>
        {sub ? <span className="text-xs text-text-tertiary">{sub}</span> : null}
      </Stack>
    </Card>
  );
}

export function ScanOverview({
  summary,
  lastScanAt,
  lastScanFiles,
  phase,
  progressPct,
  onRunScan,
  defaultPath,
}: ScanOverviewProps) {
  const [path, setPath] = useState(defaultPath);
  const errorCount = summary.byLifecycle.error;
  const total = summary.total;
  const segmentSum = TYPE_ORDER.reduce((acc, t) => acc + (summary.byType[t] || 0), 0) || 1;

  return (
    <section aria-labelledby="scan-overview-heading">
      <h2
        id="scan-overview-heading"
        className="mb-4 text-sm font-medium uppercase tracking-wide text-text-tertiary"
      >
        Scan Overview
      </h2>

      <div className="flex flex-wrap gap-6">
        <StatCard label="Total Artifacts" value={total} sub="across all repositories" />
        <StatCard
          label="Last Scan"
          value={lastScanAt ? relativeTime(lastScanAt) : 'Never'}
          sub={lastScanAt ? new Date(lastScanAt).toLocaleString() : 'Run a scan to begin'}
        />
        <StatCard
          label="Files Scanned"
          value={lastScanFiles ?? '—'}
          sub="in the last scan session"
        />
        <StatCard
          label="Errors"
          value={errorCount}
          sub="artifacts need attention"
          accent={errorCount > 0 ? '#DC2626' : undefined}
        />
      </div>

      <Card padding="lg" className="mt-6">
        <Stack gap={4}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Input
                label="Repository path"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="/path/to/repository"
                fullWidth
                aria-label="Repository path to scan"
              />
            </div>
            <Button
              onClick={() => onRunScan(path.trim() || defaultPath)}
              loading={phase === 'running'}
              disabled={phase === 'running'}
              aria-label="Run repository scan"
            >
              {phase === 'running' ? 'Scanning…' : 'Run Scan'}
            </Button>
          </div>

          {(phase === 'running' || phase === 'completed' || phase === 'failed') && (
            <div
              role="status"
              aria-live="polite"
              className="flex flex-col gap-2"
            >
              <div className="dash-progress" aria-hidden="true">
                <div
                  className={
                    progressPct === null
                      ? 'dash-progress__bar dash-progress__bar--indeterminate'
                      : 'dash-progress__bar'
                  }
                  style={progressPct !== null ? { width: `${Math.min(100, Math.max(0, progressPct))}%` } : undefined}
                />
              </div>
              <span className="text-xs text-text-tertiary">
                {phase === 'running' && 'Scan in progress…'}
                {phase === 'completed' && 'Scan complete. Artifact registry refreshed.'}
                {phase === 'failed' && 'Scan failed. Please check the repository path and retry.'}
              </span>
            </div>
          )}
        </Stack>
      </Card>

      <Card padding="lg" className="mt-6">
        <Stack gap={3}>
          <h3 className="text-sm font-medium text-text-tertiary">Artifacts by type</h3>
          <div className="dash-typebar" aria-hidden="true">
            {TYPE_ORDER.map((t) =>
              summary.byType[t] > 0 ? (
                <div
                  key={t}
                  className="dash-typebar__segment"
                  style={{
                    width: `${(summary.byType[t] / segmentSum) * 100}%`,
                    background: TYPE_COLORS[t],
                  }}
                />
              ) : null,
            )}
          </div>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {TYPE_ORDER.map((t) => (
              <li key={t} className="flex items-center gap-2 text-sm">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: TYPE_COLORS[t] }}
                  aria-hidden="true"
                />
                <span className="text-text-secondary">{TYPE_LABEL[t]}</span>
                <span className="ml-auto font-medium text-text-primary">{summary.byType[t]}</span>
              </li>
            ))}
          </ul>
        </Stack>
      </Card>

      <Card padding="lg" className="mt-6">
        <Stack gap={3}>
          <h3 className="text-sm font-medium text-text-tertiary">Lifecycle distribution</h3>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {LIFECYCLE_ORDER.map((l) => (
              <li key={l} className="flex items-center gap-2 text-sm">
                <span className={`dash-badge dash-badge--${l}`}>{LIFECYCLE_LABEL[l]}</span>
                <span className="ml-auto font-medium text-text-primary">{summary.byLifecycle[l]}</span>
              </li>
            ))}
          </ul>
        </Stack>
      </Card>
    </section>
  );
}
