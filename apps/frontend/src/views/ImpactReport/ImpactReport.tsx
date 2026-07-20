import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, Stack, Container, Button } from '@nexus-engineering/shared';
import { fetchImpactReport } from '../../api/client';
import type { ImpactReport as ImpactReportData, ImpactReportArtifact, RiskLevel } from '@nexus-engineering/shared';
import { downloadBlob, toCsv, toMarkdownImproved, printAsPdf, getExportFilename, copyToClipboard } from '../../utils/exportReport';

const RISK_BADGE: Record<RiskLevel, { label: string; className: string }> = {
  critical: 'bg-error-100 text-error-700 dark:bg-error-950 dark:text-error-300 ring-1 ring-error-300',
  high: 'bg-error-50 text-error-700 dark:bg-error-950 dark:text-error-300 ring-1 ring-error-200',
  medium: 'bg-warning-50 text-warning-700 dark:bg-warning-950 dark:text-warning-300 ring-1 ring-warning-200',
  low: 'bg-success-50 text-success-700 dark:bg-success-950 dark:text-success-300 ring-1 ring-success-200',
};

const IMPACT_BADGE: Record<ImpactReportArtifact['impactLevel'], { label: string; className: string }> = {
  direct: 'bg-error-100 text-error-700 dark:bg-error-950 dark:text-error-300',
  indirect: 'bg-warning-100 text-warning-700 dark:bg-warning-950 dark:text-warning-300',
  transitive: 'bg-info-100 text-info-700 dark:bg-info-950 dark:text-info-300',
};

const CATEGORY_LABEL: Record<string, string> = {
  test: 'Test',
  review: 'Review',
  architecture: 'Architecture',
  requirements: 'Requirements',
  coverage: 'Coverage',
};

export function ImpactReport({ file }: { file?: string }) {
  const [report, setReport] = useState<ImpactReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchImpactReport(file ? { file } : undefined);
      setReport(data);
    } catch {
      setError('Failed to generate the impact report. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [file]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleExport = useCallback(
    async (format: 'json' | 'markdown' | 'csv' | 'pdf') => {
      if (!report) return;
      if (format === 'pdf') {
        printAsPdf(report);
        return;
      }
      const filename = getExportFilename(format);
      let blob: Blob;
      if (format === 'json') {
        blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      } else if (format === 'csv') {
        blob = new Blob([toCsv(report)], { type: 'text/csv' });
      } else {
        blob = new Blob([toMarkdownImproved(report)], { type: 'text/markdown' });
      }
      downloadBlob(blob, filename);
    },
    [report],
  );

  const handleCopyMarkdown = useCallback(async () => {
    if (!report) return;
    const ok = await copyToClipboard(toMarkdownImproved(report));
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  }, [report]);

  return (
    <Container size="lg">
      <Stack gap={6}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-text-primary">Impact Report</h2>
            <p className="mt-1 text-sm text-text-secondary">
              Auto-generated change impact analysis: affected artifacts, risk level, and
              prioritized recommendations.
            </p>
          </div>
          {report && (
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={() => handleExport('json')}>
                Export JSON
              </Button>
              <Button variant="secondary" size="sm" onClick={() => handleExport('markdown')}>
                Export MD
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void handleCopyMarkdown()}
                aria-label={copied ? 'Markdown copied to clipboard' : 'Copy markdown report to clipboard'}
              >
                {copied ? 'Copied ✓' : 'Copy MD'}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => handleExport('csv')}>
                Export CSV
              </Button>
              <Button variant="secondary" size="sm" onClick={() => handleExport('pdf')}>
                Export PDF
              </Button>
            </div>
          )}
        </div>

        {loading && <ReportSkeleton />}
        {error && !loading && (
          <Card padding="lg">
            <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 text-center">
              <span className="text-4xl" aria-hidden="true">⚠️</span>
              <p role="alert" className="max-w-sm text-sm font-medium text-error-700 dark:text-error-300">
                {error}
              </p>
              <Button variant="primary" size="sm" onClick={() => void load()}>
                Retry
              </Button>
            </div>
          </Card>
        )}
        {!loading && !error && report && <ReportBody report={report} />}
      </Stack>
    </Container>
  );
}

function ReportBody({ report }: { report: ImpactReportData }) {
  const { summary } = report;
  const hasArtifacts =
    summary.totalAffected > 0 ||
    summary.requirementCount + summary.featureCount + summary.testCount + summary.adrCount > 0;
  const generatedAt = useMemo(() => {
    try {
      return new Date(report.metadata.generatedAt).toLocaleString();
    } catch {
      return '—';
    }
  }, [report.metadata.generatedAt]);

  return (
    <Stack gap={6}>
      <div className="flex flex-wrap items-center gap-3">
        <RiskBadge level={report.riskLevel} />
        <span className="text-xs text-text-tertiary">
          Generated {generatedAt}
          {report.metadata.changeDescription ? ` · ${report.metadata.changeDescription}` : ''}
        </span>
      </div>

      {!hasArtifacts ? (
        <Card padding="lg">
          <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 text-center">
            <span className="text-4xl" aria-hidden="true">📭</span>
            <p className="max-w-sm text-sm text-text-tertiary">
              No impacted artifacts detected for the current changes.
            </p>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <SummaryStat label="Total affected" value={summary.totalAffected} />
            <SummaryStat label="Direct" value={summary.directCount} tone="error" />
            <SummaryStat label="Indirect" value={summary.indirectCount} tone="warning" />
            <SummaryStat label="Transitive" value={summary.transitiveCount} tone="info" />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryStat label="Requirements" value={summary.requirementCount} />
            <SummaryStat label="Features" value={summary.featureCount} />
            <SummaryStat label="Tests" value={summary.testCount} />
            <SummaryStat label="ADRs" value={summary.adrCount} />
          </div>

          <div className="rounded-xl border border-border bg-surface-primary px-4 py-3 text-sm text-text-secondary">
            Confidence range:{' '}
            <span className="font-semibold text-text-primary">
              {Math.round(summary.minConfidence * 100)}% – {Math.round(summary.maxConfidence * 100)}%
            </span>
          </div>

          <ArtifactGroup title="Requirements" artifacts={report.affectedRequirements} emptyHint="No requirements affected." />
          <ArtifactGroup title="Features" artifacts={report.affectedFeatures} emptyHint="No features affected." />
          <ArtifactGroup title="Tests" artifacts={report.affectedTests} emptyHint="No tests affected." />
          <ArtifactGroup title="Architecture Decisions" artifacts={report.affectedAdrs} emptyHint="No ADRs affected." />

          <RecommendationsList recommendations={report.recommendations} />
        </>
      )}
    </Stack>
  );
}

function RiskBadge({ level }: { level: RiskLevel }) {
  const style = RISK_BADGE[level];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold uppercase tracking-wide ${style.className}`}
    >
      <span className="h-2 w-2 rounded-full bg-current" aria-hidden="true" />
      {style.label} risk
    </span>
  );
}

function SummaryStat({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: number;
  tone?: 'neutral' | 'error' | 'warning' | 'info';
}) {
  const toneClass =
    tone === 'error'
      ? 'text-error-600 dark:text-error-400'
      : tone === 'warning'
        ? 'text-warning-600 dark:text-warning-400'
        : tone === 'info'
          ? 'text-info-600 dark:text-info-400'
          : 'text-text-primary';
  return (
    <div className="rounded-xl border border-border bg-surface-primary p-4">
      <p className={`text-3xl font-bold ${toneClass}`}>{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wide text-text-tertiary">{label}</p>
    </div>
  );
}

function ArtifactGroup({
  title,
  artifacts,
  emptyHint,
}: {
  title: string;
  artifacts: ImpactReportArtifact[];
  emptyHint: string;
}) {
  return (
    <Card padding="lg">
      <h3 className="mb-4 text-base font-semibold text-text-primary">{title}</h3>
      {artifacts.length === 0 ? (
        <p className="text-sm text-text-tertiary">{emptyHint}</p>
      ) : (
        <div className="-mx-2 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <caption className="sr-only">{title} impacted by this change</caption>
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-text-tertiary">
                <th scope="col" className="px-2 py-2 font-medium">Artifact</th>
                <th scope="col" className="px-2 py-2 font-medium">Type</th>
                <th scope="col" className="px-2 py-2 font-medium">Impact</th>
                <th scope="col" className="px-2 py-2 font-medium">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {artifacts.map((a) => (
                <tr key={a.id} className="border-b border-border last:border-b-0">
                  <td className="px-2 py-3">
                    <p className="text-sm font-medium text-text-primary">{a.title}</p>
                    <p className="text-xs text-text-tertiary">{a.id}</p>
                  </td>
                  <td className="px-2 py-3 text-sm capitalize text-text-secondary">{a.type}</td>
                  <td className="px-2 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${IMPACT_BADGE[a.impactLevel].className}`}
                    >
                      {IMPACT_BADGE[a.impactLevel].label}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-sm text-text-secondary">
                    {a.confidence} · {Math.round(a.confidenceScore * 100)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function RecommendationsList({
  recommendations,
}: {
  recommendations: ImpactReportData['recommendations'];
}) {
  if (recommendations.length === 0) return null;
  return (
    <Card padding="lg">
      <h3 className="mb-4 text-base font-semibold text-text-primary">Recommendations</h3>
      <ul role="list" className="flex flex-col gap-3">
        {recommendations.map((rec) => (
          <li
            key={rec.id}
            className="flex items-start gap-3 rounded-lg border border-border bg-surface-secondary px-4 py-3"
          >
            <span className={`mt-0.5 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${RISK_BADGE[rec.severity].className}`}>
              {rec.severity}
            </span>
            <div>
              <p className="text-sm font-medium text-text-primary">{rec.message}</p>
              <p className="text-xs text-text-tertiary">{CATEGORY_LABEL[rec.category] ?? rec.category}</p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function ReportSkeleton() {
  return (
    <Stack gap={4} aria-busy="true" aria-label="Loading impact report">
      <div className="h-8 w-40 animate-pulse rounded-full bg-surface-tertiary" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-surface-tertiary" />
        ))}
      </div>
      <div className="h-40 animate-pulse rounded-xl bg-surface-tertiary" />
      <div className="h-40 animate-pulse rounded-xl bg-surface-tertiary" />
    </Stack>
  );
}

export default ImpactReport;
