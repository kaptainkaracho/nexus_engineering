import { useEffect, useMemo, useState } from 'react';
import { Card, Stack, Container } from '@nexus-engineering/shared';
import { fetchTraceGraph, fetchTraceImpact } from '../../api/client';
import type { TraceGraphData, ImpactAnalysisData } from '../../api/client';
import { BlastRadiusOverlay, BLAST_RADIUS_COLORS, BLAST_RADIUS_LABELS, BlastRadiusLevel } from './BlastRadiusOverlay';
import { ImpactDiffView } from './ImpactDiffView';

type ViewMode = 'overlay' | 'diff';

const IMPACT_LEVEL_ORDER: BlastRadiusLevel[] = ['direct', 'indirect', 'transitive', 'none'];

export function ImpactAnalysis() {
  const [graph, setGraph] = useState<TraceGraphData | null>(null);
  const [graphError, setGraphError] = useState<string | null>(null);

  const [artifactId, setArtifactId] = useState('');
  const [threshold, setThreshold] = useState(0.4);
  const [impact, setImpact] = useState<ImpactAnalysisData | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [impactError, setImpactError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [baseline, setBaseline] = useState<ImpactAnalysisData | null>(null);
  const [mode, setMode] = useState<ViewMode>('overlay');

  useEffect(() => {
    let cancelled = false;
    fetchTraceGraph()
      .then((data) => {
        if (!cancelled) setGraph(data);
      })
      .catch(() => {
        if (!cancelled) setGraphError('Failed to load dependency graph');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const runAnalysis = async () => {
    if (!artifactId.trim()) {
      setImpactError('Enter an artifact ID to analyze');
      return;
    }
    setAnalyzing(true);
    setImpactError(null);
    try {
      const data = await fetchTraceImpact(artifactId.trim(), { confidenceThreshold: threshold });
      setImpact(data);
      setSelectedId(null);
    } catch {
      setImpactError('Failed to run impact analysis');
    } finally {
      setAnalyzing(false);
    }
  };

  interface SelectedDetail {
    id: string;
    title: string;
    type?: string;
    relationshipType?: string;
    confidenceScore?: number;
  }

  const { selectedDetail, selectedLevel } = useMemo(() => {
    if (!selectedId || !impact) return { selectedDetail: null as SelectedDetail | null, selectedLevel: 'none' as BlastRadiusLevel };
    const artifact = impact.artifacts.find((a) => a.id === selectedId);
    if (artifact) {
      return {
        selectedDetail: {
          id: artifact.id,
          title: artifact.title,
          type: artifact.type,
          relationshipType: artifact.relationshipType,
          confidenceScore: artifact.confidenceScore,
        } as SelectedDetail,
        selectedLevel: artifact.impactLevel as BlastRadiusLevel,
      };
    }
    const node = impact.impactGraph.nodes.find((n) => n.id === selectedId);
    if (node) {
      return {
        selectedDetail: {
          id: node.id,
          title: node.title ?? node.id,
          confidenceScore: node.confidenceScore,
        } as SelectedDetail,
        selectedLevel: 'indirect' as BlastRadiusLevel,
      };
    }
    return { selectedDetail: null as SelectedDetail | null, selectedLevel: 'none' as BlastRadiusLevel };
  }, [selectedId, impact]);

  const summary = impact?.summary;

  return (
    <Container size="lg">
      <Stack gap={6}>
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Impact Analysis</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Run a traceability impact analysis, visualize the blast radius across the dependency
            graph, and diff before/after change scope.
          </p>
        </div>

        <Card padding="lg">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
            <div className="flex-1">
              <label htmlFor="artifact-input" className="mb-1 block text-sm font-medium text-text-secondary">
                Artifact ID
              </label>
              <input
                id="artifact-input"
                type="text"
                value={artifactId}
                onChange={(e) => setArtifactId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runAnalysis()}
                placeholder="e.g. arch-001"
                className="w-full rounded-lg border border-border bg-surface-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              />
            </div>
            <div>
              <label htmlFor="threshold-select" className="mb-1 block text-sm font-medium text-text-secondary">
                Confidence threshold
              </label>
              <select
                id="threshold-select"
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="rounded-lg border border-border bg-surface-primary px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                <option value={0.4}>Low (≥ 0.4)</option>
                <option value={0.7}>Medium (≥ 0.7)</option>
                <option value={0.9}>High (≥ 0.9)</option>
              </select>
            </div>
            <button
              type="button"
              onClick={runAnalysis}
              disabled={analyzing}
              className="rounded-lg bg-primary-500 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:opacity-60"
            >
              {analyzing ? 'Analyzing…' : 'Analyze impact'}
            </button>
          </div>
          {impactError && (
            <p role="alert" className="mt-3 text-sm font-medium text-error-600 dark:text-error-400">
              {impactError}
            </p>
          )}
        </Card>

        {summary && (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Total affected" value={summary.totalAffected} />
            <StatCard label="Direct" value={summary.directCount} tone="error" />
            <StatCard label="Indirect" value={summary.indirectCount} tone="warning" />
            <StatCard label="Transitive" value={summary.transitiveCount} tone="neutral" />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 border-b border-border pb-3">
          <TabButton active={mode === 'overlay'} onClick={() => setMode('overlay')}>
            Blast Radius Overlay
          </TabButton>
          <TabButton active={mode === 'diff'} onClick={() => setMode('diff')}>
            Diff View
          </TabButton>
          {impact && (
            <button
              type="button"
              onClick={() => setBaseline(impact)}
              className="ml-auto rounded-lg border border-border bg-surface-primary px-3 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:border-primary-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              {baseline ? 'Update baseline' : 'Capture baseline'}
            </button>
          )}
        </div>

        {mode === 'overlay' ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card padding="lg" className="lg:col-span-2">
              {graphError ? (
                <EmptyState message={graphError} />
              ) : !graph || graph.nodes.length === 0 ? (
                <EmptyState message="No dependency graph available" />
              ) : (
                <BlastRadiusOverlay
                  graph={graph}
                  impact={impact}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                />
              )}
              <Legend />
            </Card>

            <Card padding="lg">
              <h3 className="mb-4 text-base font-semibold text-text-primary">Impact Detail</h3>
              {selectedDetail ? (
                <Stack gap={3}>
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-3 w-3 rounded-full"
                      style={{ backgroundColor: BLAST_RADIUS_COLORS[selectedLevel] }}
                      aria-hidden="true"
                    />
                    <span className="text-sm font-semibold text-text-primary">
                      {selectedDetail.title}
                    </span>
                  </div>
                  <DetailRow label="ID" value={selectedDetail.id} />
                  {'type' in selectedDetail && <DetailRow label="Type" value={selectedDetail.type} />}
                  <DetailRow label="Impact" value={BLAST_RADIUS_LABELS[selectedLevel]} />
                  {'relationshipType' in selectedDetail && (
                    <DetailRow label="Relationship" value={selectedDetail.relationshipType} />
                  )}
                  {'confidenceScore' in selectedDetail && selectedDetail.confidenceScore !== undefined && (
                    <DetailRow label="Confidence" value={`${Math.round(selectedDetail.confidenceScore * 100)}%`} />
                  )}
                </Stack>
              ) : (
                <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 py-8 text-center">
                  <span className="text-4xl" aria-hidden="true">🎯</span>
                  <p className="max-w-xs text-sm text-text-tertiary">
                    Run an analysis, then click a node on the graph to inspect its blast radius impact.
                  </p>
                </div>
              )}
            </Card>
          </div>
        ) : (
          <Card padding="lg">
            {impact ? (
              <ImpactDiffView before={baseline} after={impact} onCaptureBaseline={() => setBaseline(impact)} />
            ) : (
              <EmptyState message="Run an impact analysis to enable the diff view" />
            )}
          </Card>
        )}
      </Stack>
    </Container>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
        active ? 'bg-primary-500 text-white' : 'bg-surface-primary text-text-secondary hover:bg-surface-tertiary'
      }`}
    >
      {children}
    </button>
  );
}

function StatCard({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: number;
  tone?: 'neutral' | 'error' | 'warning';
}) {
  const toneClass =
    tone === 'error'
      ? 'text-error-600 dark:text-error-400'
      : tone === 'warning'
      ? 'text-warning-600 dark:text-warning-400'
      : 'text-text-primary';
  return (
    <div className="rounded-xl border border-border bg-surface-primary p-4">
      <p className={`text-3xl font-bold ${toneClass}`}>{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wide text-text-tertiary">{label}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-2 last:border-b-0">
      <span className="text-xs uppercase tracking-wide text-text-tertiary">{label}</span>
      <span className="text-sm font-medium text-text-primary">{value ?? '—'}</span>
    </div>
  );
}

function Legend() {
  return (
    <div className="mt-4 flex flex-wrap gap-4">
      {IMPACT_LEVEL_ORDER.map((level) => (
        <div key={level} className="flex items-center gap-2">
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ backgroundColor: BLAST_RADIUS_COLORS[level] }}
            aria-hidden="true"
          />
          <span className="text-xs text-text-secondary">{BLAST_RADIUS_LABELS[level]}</span>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 py-8 text-center">
      <span className="text-4xl" aria-hidden="true">📭</span>
      <p className="max-w-sm text-sm text-text-tertiary">{message}</p>
    </div>
  );
}

export default ImpactAnalysis;
