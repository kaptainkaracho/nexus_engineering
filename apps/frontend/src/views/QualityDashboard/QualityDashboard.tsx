import { useCallback, useEffect, useState } from 'react';
import {
  Card, Stack, Container, Badge, Button,
  type CoverageAnalysisReport,
  type AxisCoverage,
  type DomainCoverage,
  type CrossArtifactGap,
} from '@nexus-engineering/shared';
import { fetchTraceCoverage } from '../../api/client';

const AXIS_LABELS: Record<string, string> = {
  requirement: 'Requirement',
  feature: 'Feature',
  testCase: 'Test Case',
  architectureModel: 'Architecture',
  softwareComponent: 'Component',
  result: 'Result',
};

function formatScore(score: number): string {
  return `${Math.round(score * 100)}%`;
}

function healthColor(pct: number): string {
  if (pct >= 80) return 'text-success-600 dark:text-success-400';
  if (pct >= 50) return 'text-warning-600 dark:text-warning-400';
  return 'text-error-600 dark:text-error-400';
}

function healthBg(pct: number): string {
  if (pct >= 80) return 'bg-success-100 dark:bg-success-950';
  if (pct >= 50) return 'bg-warning-100 dark:bg-warning-950';
  return 'bg-error-100 dark:bg-error-950';
}

function healthLabel(pct: number): string {
  if (pct >= 80) return 'Healthy';
  if (pct >= 50) return 'Needs Attention';
  return 'Critical';
}

function coverageBarColor(pct: number): string {
  if (pct >= 80) return 'bg-success-500 dark:bg-success-400';
  if (pct >= 50) return 'bg-warning-500 dark:bg-warning-400';
  return 'bg-error-500 dark:bg-error-400';
}

function gapSeverityBadge(severity: string): string {
  const map: Record<string, React.ComponentProps<typeof Badge>['variant']> = {
    high: 'critical',
    medium: 'warning',
    low: 'info',
  };
  return map[severity] ?? 'info';
}

function gapTypeLabel(type: string): string {
  const map: Record<string, string> = {
    missingDownstream: 'Missing Downstream',
    missingUpstream: 'Missing Upstream',
    orphan: 'Orphan Artifact',
  };
  return map[type] ?? type;
}

function artifactTypeLabel(type: string): string {
  const map: Record<string, string> = {
    requirement: 'Requirement',
    feature: 'Feature',
    testCase: 'Test Case',
    architectureModel: 'Architecture',
    softwareComponent: 'Component',
  };
  return map[type] ?? type;
}

interface DashboardData {
  report: CoverageAnalysisReport;
}

function EmptyState() {
  return (
    <Container size="lg">
      <Stack gap={6} align="center" className="pt-20">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-tertiary">
          <svg
            className="h-8 w-8 text-text-tertiary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <Stack gap={2} align="center">
          <p className="text-lg font-semibold text-text-primary">No trace quality data</p>
          <p className="text-sm text-text-secondary">
            Traceability links need to be discovered before quality metrics are available.
          </p>
        </Stack>
      </Stack>
    </Container>
  );
}

function LoadingState() {
  return (
    <Container size="lg">
      <Stack gap={6}>
        {[0, 1, 2, 3].map((i) => (
          <Card key={i} padding="lg" role="status" aria-busy="true">
            <Stack gap={4}>
              <div className="h-5 w-48 animate-pulse rounded-lg bg-surface-tertiary" />
              <div className="h-32 w-full animate-pulse rounded-lg bg-surface-tertiary" />
            </Stack>
          </Card>
        ))}
      </Stack>
    </Container>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <Container size="lg">
      <Stack gap={6} align="center" className="pt-20">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-error-100 dark:bg-error-950">
          <svg
            className="h-8 w-8 text-error-600 dark:text-error-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>
        <Stack gap={2} align="center">
          <p className="text-lg font-semibold text-text-primary">Failed to load quality data</p>
          <p className="text-sm text-text-secondary">
            The traceability backend may be unavailable. Check your connection and try again.
          </p>
          <Button variant="primary" onClick={onRetry}>
            Retry
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
}

function HealthOverview({ report }: { report: CoverageAnalysisReport }) {
  const overallPct = report.overallCoveragePercent ?? 0;
  const summary = report.summary ?? { totalArtifacts: 0, totalGaps: 0, highRiskCount: 0, mediumRiskCount: 0, lowRiskCount: 0 };

  const metrics = [
    { label: 'Overall Coverage', value: formatScore(overallPct), color: healthColor(overallPct), icon: '📊' },
    { label: 'Total Artifacts', value: String(summary.totalArtifacts ?? 0), color: 'text-text-primary', icon: '📦' },
    { label: 'High Risk Gaps', value: String(summary.highRiskCount ?? 0), color: summary.highRiskCount > 0 ? 'text-error-600 dark:text-error-400' : 'text-text-primary', icon: '🔴' },
    { label: 'Medium Risk Gaps', value: String(summary.mediumRiskCount ?? 0), color: summary.mediumRiskCount > 0 ? 'text-warning-600 dark:text-warning-400' : 'text-text-primary', icon: '🟡' },
    { label: 'Low Risk Gaps', value: String(summary.lowRiskCount ?? 0), color: 'text-text-tertiary', icon: '🟢' },
    { label: 'Total Gaps', value: String(summary.totalGaps ?? 0), color: 'text-text-primary', icon: '⚠️' },
  ];

  return (
    <Card padding="lg">
      <Stack gap={4}>
        <h3 className="text-base font-semibold text-text-primary">Health Overview</h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {metrics.map((m) => (
            <div key={m.label} className={`${healthBg(overallPct)} rounded-xl p-4 ring-1 ring-inset ring-border/50 dark:ring-border/30`}>
              <div className="flex items-center gap-2">
                <span className="text-lg">{m.icon}</span>
                <p className="text-xs font-medium uppercase tracking-wide text-text-tertiary">{m.label}</p>
              </div>
              <p className={`mt-1 text-2xl font-bold ${m.color}`}>{m.value}</p>
            </div>
          ))}
        </div>
        {/* Overall progress bar */}
        <div>
          <div className="flex items-center justify-between text-xs text-text-tertiary">
            <span>Overall Traceability Health</span>
            <span className="font-semibold">{healthLabel(overallPct)}</span>
          </div>
          <div className="mt-1.5 h-3 w-full overflow-hidden rounded-full bg-surface-tertiary dark:bg-surface-quaternary">
            <div
              className={`h-full rounded-full transition-all duration-700 ${coverageBarColor(overallPct)}`}
              style={{ width: `${overallPct * 100}%` }}
              role="progressbar"
              aria-valuenow={Math.round(overallPct * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Overall coverage: ${Math.round(overallPct * 100)}%`}
            />
          </div>
        </div>
      </Stack>
    </Card>
  );
}

function CoverageByAxis({ axes }: { axes: AxisCoverage[] }) {
  if (!axes || axes.length === 0) {
    return (
      <Card padding="lg">
        <Stack gap={4}>
          <h3 className="text-base font-semibold text-text-primary">Coverage by Axis</h3>
          <p className="text-sm text-text-secondary">No axis data available.</p>
        </Stack>
      </Card>
    );
  }

  const maxPct = Math.max(...axes.map((a) => a.coveragePercent ?? 0), 1);

  return (
    <Card padding="lg">
      <Stack gap={4}>
        <h3 className="text-base font-semibold text-text-primary">Coverage by Axis</h3>
        <div className="space-y-4">
          {axes.map((axis) => {
            const pct = axis.coveragePercent ?? 0;
            return (
              <div key={axis.axis}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-text-primary">{AXIS_LABELS[axis.axis] ?? axis.axis}</span>
                  <span className="text-text-tertiary">
                    {axis.linked ?? 0}/{axis.total ?? 0} ({formatScore(pct)})
                  </span>
                </div>
                <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-surface-tertiary dark:bg-surface-quaternary">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${coverageBarColor(pct)}`}
                    style={{ width: `${maxPct > 0 ? (pct / maxPct) * 100 : 0}%` }}
                    role="progressbar"
                    aria-valuenow={Math.round(pct * 100)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${AXIS_LABELS[axis.axis] ?? axis.axis} coverage: ${Math.round(pct * 100)}%`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Stack>
    </Card>
  );
}

function DomainBreakdown({ domains }: { domains: DomainCoverage[] }) {
  if (!domains || domains.length === 0) {
    return (
      <Card padding="lg">
        <Stack gap={4}>
          <h3 className="text-base font-semibold text-text-primary">Domain Breakdown</h3>
          <p className="text-sm text-text-secondary">No domain data available.</p>
        </Stack>
      </Card>
    );
  }

  return (
    <Card padding="lg">
      <Stack gap={4}>
        <h3 className="text-base font-semibold text-text-primary">Domain Breakdown</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {domains.map((domain) => {
            const pct = domain.coveragePercent ?? 0;
            return (
              <div
                key={domain.domain}
                className="rounded-xl p-4 ring-1 ring-inset ring-border/50 dark:ring-border/30"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-text-primary">{domain.domain || 'Unnamed'}</span>
                  <Badge variant={pct >= 80 ? 'success' : pct >= 50 ? 'warning' : 'critical'}>
                    {formatScore(pct)}
                  </Badge>
                </div>
                <div className="mt-2 flex items-center gap-4 text-xs text-text-secondary">
                  <span>{domain.totalArtifacts ?? 0} total</span>
                  <span>{domain.coveredArtifacts ?? 0} covered</span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-tertiary dark:bg-surface-quaternary">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${coverageBarColor(pct)}`}
                    style={{ width: `${pct * 100}%` }}
                    role="progressbar"
                    aria-valuenow={Math.round(pct * 100)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${domain.domain} coverage: ${Math.round(pct * 100)}%`}
                  />
                </div>
                {domain.axes && domain.axes.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-text-tertiary">Axes</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {domain.axes.map((a) => (
                        <Badge key={a.axis} variant={a.coveragePercent >= 0.8 ? 'success' : a.coveragePercent >= 0.5 ? 'warning' : 'critical'}>
                          {AXIS_LABELS[a.axis] ?? a.axis}: {formatScore(a.coveragePercent)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Stack>
    </Card>
  );
}

function GapList({ gaps }: { gaps: CrossArtifactGap[] }) {
  if (!gaps || gaps.length === 0) {
    return (
      <Card padding="lg">
        <Stack gap={4}>
          <h3 className="text-base font-semibold text-text-primary">Gap List</h3>
          <p className="text-sm text-text-secondary">No gaps found — traceability is complete.</p>
        </Stack>
      </Card>
    );
  }

  return (
    <Card padding="lg">
      <Stack gap={4}>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-text-primary">Gap List</h3>
          <Badge variant="critical">{gaps.length} gaps</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" role="table" aria-label="Traceability gaps">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-text-tertiary">
                <th className="pb-2 pr-4 font-medium" scope="col">Artifact</th>
                <th className="pb-2 pr-4 font-medium" scope="col">Type</th>
                <th className="pb-2 pr-4 font-medium" scope="col">Gap Type</th>
                <th className="pb-2 pr-4 font-medium" scope="col">Severity</th>
                <th className="pb-2 font-medium" scope="col">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {gaps.map((gap, i) => (
                <tr key={`${gap.artifactId}-${i}`} className="hover:bg-surface-secondary/50">
                  <td className="py-2.5 pr-4 font-medium text-text-primary">{gap.artifactTitle || gap.artifactId}</td>
                  <td className="py-2.5 pr-4">
                    <Badge variant="info">{artifactTypeLabel(gap.axis)}</Badge>
                  </td>
                  <td className="py-2.5 pr-4 text-text-secondary">
                    {gapTypeLabel(gap.gapType)}
                  </td>
                  <td className="py-2.5 pr-4">
                    <Badge variant={gapSeverityBadge(gap.severity)}>{gap.severity}</Badge>
                  </td>
                  <td className="py-2.5 text-text-secondary">{gap.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Stack>
    </Card>
  );
}

export function QualityDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const report = await fetchTraceCoverage();
      // Normalize report to CoverageAnalysisReport shape
      if ('overallCoveragePercent' in report && 'axes' in report) {
        setData({ report: report as CoverageAnalysisReport });
      } else {
        const alternate = report as { domain: string; coverage: any; overallCoveragePercent: number };
        setData({
          report: {
            overallCoveragePercent: alternate.overallCoveragePercent ?? 0,
            axes: [],
            crossArtifactGaps: [],
            domainCoverage: alternate.coverage?.axes
              ? []
              : [{
                  domain: alternate.domain || 'default',
                  totalArtifacts: alternate.coverage?.totalArtifacts ?? 0,
                  coveredArtifacts: alternate.coverage?.coveredArtifacts ?? 0,
                  coveragePercent: alternate.coverage?.coveragePercent ?? 0,
                  axes: [],
                  gaps: [],
                }],
            summary: {
              totalArtifacts: alternate.coverage?.totalArtifacts ?? 0,
              totalGaps: 0,
              highRiskCount: 0,
              mediumRiskCount: 0,
              lowRiskCount: 0,
            },
          } as CoverageAnalysisReport,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState onRetry={loadData} />;
  if (!data) return <EmptyState />;
  if (data.report.overallCoveragePercent === 0 && data.report.domainCoverage.length === 0) return <EmptyState />;

  return (
    <Container size="lg">
      <Stack gap={6}>
        <Stack gap={2}>
          <h2 className="text-2xl font-bold text-text-primary">Trace Quality Dashboard</h2>
          <p className="text-sm text-text-secondary">
            Executive visibility into traceability health across your codebase.
          </p>
        </Stack>

        <HealthOverview report={data.report} />
        <CoverageByAxis axes={data.report.axes ?? []} />
        <DomainBreakdown domains={data.report.domainCoverage ?? []} />
        <GapList gaps={data.report.crossArtifactGaps ?? []} />
      </Stack>
    </Container>
  );
}
