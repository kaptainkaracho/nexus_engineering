import { useState } from 'react';
import { Badge, Card, Stack, Container } from '@nexus-engineering/shared';

interface TraceNode {
  id: string;
  type: string;
  title?: string;
  confidenceScore?: number;
}

interface TraceEdge {
  sourceId: string;
  targetId: string;
  relationshipType: string;
  confidence: string;
  confidenceScore: number;
}

interface AxisCoverage {
  axis: string;
  total: number;
  linked: number;
  coveragePercent: number;
}

interface DomainCoverage {
  domain: string;
  totalArtifacts: number;
  coveredArtifacts: number;
  coveragePercent: number;
}

interface MockTraceGraph {
  nodes: TraceNode[];
  edges: TraceEdge[];
  coverage: {
    overallCoveragePercent: number;
    axes: AxisCoverage[];
    domainCoverage: DomainCoverage[];
    summary: {
      totalArtifacts: number;
      totalGaps: number;
      highRiskCount: number;
      mediumRiskCount: number;
      lowRiskCount: number;
    };
  };
}

const MOCK_DATA: MockTraceGraph = {
  nodes: [
    { id: 'req-001', type: 'requirement', title: 'User Authentication', confidenceScore: 1.0 },
    { id: 'req-002', type: 'requirement', title: 'Payment Processing', confidenceScore: 1.0 },
    { id: 'req-003', type: 'requirement', title: 'Order Tracking', confidenceScore: 0.9 },
    { id: 'feat-001', type: 'feature', title: 'Login Flow', confidenceScore: 1.0 },
    { id: 'feat-002', type: 'feature', title: 'Checkout Flow', confidenceScore: 0.95 },
    { id: 'feat-003', type: 'feature', title: 'Real-time Tracking', confidenceScore: 0.8 },
    { id: 'arch-001', type: 'architecture', title: 'Auth Service', confidenceScore: 1.0 },
    { id: 'arch-002', type: 'architecture', title: 'Payment Gateway', confidenceScore: 0.9 },
    { id: 'arch-003', type: 'architecture', title: 'GPS Tracker Module', confidenceScore: 0.7 },
    { id: 'test-001', type: 'testCase', title: 'Auth Integration Test', confidenceScore: 1.0 },
    { id: 'test-002', type: 'testCase', title: 'Payment End-to-End', confidenceScore: 0.85 },
    { id: 'test-003', type: 'testCase', title: 'Order Status Poll', confidenceScore: 0.6 },
    { id: 'result-001', type: 'result', title: 'Auth Test: PASS', confidenceScore: 1.0 },
    { id: 'result-002', type: 'result', title: 'Payment Test: FAIL', confidenceScore: 0.7 },
    { id: 'result-003', type: 'result', title: 'Tracking Test: PASS', confidenceScore: 0.65 },
  ],
  edges: [
    { sourceId: 'req-001', targetId: 'feat-001', relationshipType: 'satisfies', confidence: 'high', confidenceScore: 1.0 },
    { sourceId: 'req-002', targetId: 'feat-002', relationshipType: 'satisfies', confidence: 'high', confidenceScore: 0.95 },
    { sourceId: 'req-003', targetId: 'feat-003', relationshipType: 'satisfies', confidence: 'medium', confidenceScore: 0.8 },
    { sourceId: 'feat-001', targetId: 'arch-001', relationshipType: 'implements', confidence: 'high', confidenceScore: 1.0 },
    { sourceId: 'feat-002', targetId: 'arch-002', relationshipType: 'implements', confidence: 'high', confidenceScore: 0.9 },
    { sourceId: 'feat-003', targetId: 'arch-003', relationshipType: 'implements', confidence: 'medium', confidenceScore: 0.7 },
    { sourceId: 'req-001', targetId: 'test-001', relationshipType: 'verifiedBy', confidence: 'high', confidenceScore: 1.0 },
    { sourceId: 'req-002', targetId: 'test-002', relationshipType: 'verifiedBy', confidence: 'medium', confidenceScore: 0.85 },
    { sourceId: 'req-003', targetId: 'test-003', relationshipType: 'verifiedBy', confidence: 'low', confidenceScore: 0.6 },
    { sourceId: 'test-001', targetId: 'result-001', relationshipType: 'produces', confidence: 'high', confidenceScore: 1.0 },
    { sourceId: 'test-002', targetId: 'result-002', relationshipType: 'produces', confidence: 'medium', confidenceScore: 0.7 },
    { sourceId: 'test-003', targetId: 'result-003', relationshipType: 'produces', confidence: 'low', confidenceScore: 0.65 },
    { sourceId: 'arch-001', targetId: 'test-001', relationshipType: 'testedBy', confidence: 'high', confidenceScore: 1.0 },
    { sourceId: 'arch-002', targetId: 'test-002', relationshipType: 'testedBy', confidence: 'medium', confidenceScore: 0.85 },
  ],
  coverage: {
    overallCoveragePercent: 73,
    axes: [
      { axis: 'requirement', total: 3, linked: 3, coveragePercent: 100 },
      { axis: 'feature', total: 3, linked: 3, coveragePercent: 100 },
      { axis: 'testCase', total: 3, linked: 2, coveragePercent: 67 },
      { axis: 'result', total: 3, linked: 1, coveragePercent: 33 },
    ],
    domainCoverage: [
      { domain: 'authentication', totalArtifacts: 4, coveredArtifacts: 4, coveragePercent: 100 },
      { domain: 'payments', totalArtifacts: 4, coveredArtifacts: 3, coveragePercent: 75 },
      { domain: 'logistics', totalArtifacts: 4, coveredArtifacts: 2, coveragePercent: 50 },
    ],
    summary: {
      totalArtifacts: 15,
      totalGaps: 6,
      highRiskCount: 1,
      mediumRiskCount: 2,
      lowRiskCount: 3,
    },
  },
};

const TYPE_TOKEN: Record<string, string> = {
  requirement: 'primary',
  feature: 'secondary',
  architecture: 'warning',
  testCase: 'success',
  result: 'neutral',
};

function typeColorMap(type: string): { bg: string; text: string; border: string; dot: string } {
  const token = TYPE_TOKEN[type] ?? 'neutral';
  return {
    bg: `bg-${token}-50 dark:bg-${token}-950`,
    text: `text-${token}-700 dark:text-${token}-300`,
    border: `border-${token}-200 dark:border-${token}-800`,
    dot: `bg-${token}-500`,
  };
}

function confidenceBadgeVariant(score: number): string {
  if (score >= 0.9) return 'success';
  if (score >= 0.7) return 'warning';
  return 'critical';
}

function confidenceTextColor(score: number): string {
  if (score >= 0.9) return 'text-success-600 dark:text-success-400';
  if (score >= 0.7) return 'text-warning-600 dark:text-warning-400';
  return 'text-error-600 dark:text-error-400';
}

function coverageTextColor(pct: number): string {
  if (pct >= 80) return 'text-success-600 dark:text-success-400';
  if (pct >= 50) return 'text-warning-600 dark:text-warning-400';
  return 'text-error-600 dark:text-error-400';
}

function coverageBarColor(pct: number): string {
  if (pct >= 80) return 'bg-success-500 dark:bg-success-400';
  if (pct >= 50) return 'bg-warning-500 dark:bg-warning-400';
  return 'bg-error-500 dark:bg-error-400';
}

export function TraceGraph() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const data = MOCK_DATA;
  const nodeMap = new Map(data.nodes.map(n => [n.id, n]));
  const selected = selectedNode ? nodeMap.get(selectedNode) : null;

  const connectedEdges = selected
    ? data.edges.filter(e => e.sourceId === selected.id || e.targetId === selected.id)
    : [];

  const connectedNodeIds = new Set(
    selected
      ? connectedEdges.flatMap(e => [e.sourceId, e.targetId])
      : [selectedNode!]
  );

  const overallPct = data.coverage.overallCoveragePercent;

  return (
    <Container size="lg">
      <Stack gap={6}>
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Trace Graph</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Visualize traceability relationships across requirements, architecture, and tests.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card padding="lg">
            <p className="text-sm font-medium text-text-tertiary uppercase tracking-wide">Overall Coverage</p>
            <p className={`mt-2 text-3xl font-bold ${coverageTextColor(overallPct)}`}>
              {overallPct}%
            </p>
            <p className="mt-1 text-xs text-text-tertiary">
              {data.coverage.summary.totalArtifacts} artifacts analyzed
            </p>
          </Card>

          <Card padding="lg">
            <p className="text-sm font-medium text-text-tertiary uppercase tracking-wide">High Risk Gaps</p>
            <p className="mt-2 text-3xl font-bold text-error-600 dark:text-error-400">
              {data.coverage.summary.highRiskCount}
            </p>
            <p className="mt-1 text-xs text-text-tertiary">
              {data.coverage.summary.totalGaps} total gaps
            </p>
          </Card>

          <Card padding="lg">
            <p className="text-sm font-medium text-text-tertiary uppercase tracking-wide">Direct Links</p>
            <p className="mt-2 text-3xl font-bold text-primary-600 dark:text-primary-400">
              {data.edges.length}
            </p>
            <p className="mt-1 text-xs text-text-tertiary">
              traceability relationships
            </p>
          </Card>
        </div>

        <Stack gap={6}>
          <Card padding="lg">
            <h3 className="text-base font-semibold text-text-primary mb-4">V-Model Coverage by Axis</h3>
            <Stack gap={3}>
              {data.coverage.axes.map(axis => (
                <div key={axis.axis} className="flex items-center gap-3">
                  <span className="w-28 text-sm font-medium text-text-secondary capitalize">{axis.axis}</span>
                  <div className="flex-1 h-3 bg-surface-tertiary rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${coverageBarColor(axis.coveragePercent)}`}
                      style={{ width: `${axis.coveragePercent}%` }}
                    />
                  </div>
                  <span className="w-12 text-right text-sm text-text-secondary">{axis.coveragePercent}%</span>
                  <span className="w-20 text-right text-xs text-text-tertiary">
                    {axis.linked}/{axis.total}
                  </span>
                </div>
              ))}
            </Stack>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card padding="lg" className="lg:col-span-1">
              <h3 className="text-base font-semibold text-text-primary mb-4">Nodes ({data.nodes.length})</h3>
              <Stack gap={2}>
                {data.nodes.map(node => {
                  const colors = typeColorMap(node.type);
                  const isSelected = selectedNode === node.id;
                  const isConnected = selectedNode !== null && connectedNodeIds.has(node.id);
                  return (
                    <button
                      key={node.id}
                      onClick={() => setSelectedNode(isSelected ? null : node.id)}
                      className={`w-full text-left rounded-lg border px-3 py-2 transition-all ${
                        isSelected
                          ? `${colors.bg} ${colors.border} ring-2 ring-primary-500`
                          : isConnected
                          ? `${colors.bg} ${colors.border} opacity-100`
                          : selectedNode !== null
                          ? 'opacity-30'
                          : 'bg-surface-primary border-border hover:border-border-hover'
                      }`}
                      aria-label={`Select node: ${node.title || node.id}`}
                      aria-pressed={isSelected}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`inline-block h-2 w-2 rounded-full ${colors.dot}`} />
                        <span className={`text-sm font-medium ${colors.text}`}>
                          {node.title || node.id}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-text-tertiary capitalize">{node.type}</span>
                        {node.confidenceScore !== undefined && (
                          <Badge variant={confidenceBadgeVariant(node.confidenceScore)}>
                            {Math.round(node.confidenceScore * 100)}%
                          </Badge>
                        )}
                      </div>
                    </button>
                  );
                })}
              </Stack>
            </Card>

            <Card padding="lg" className="lg:col-span-2">
              <h3 className="text-base font-semibold text-text-primary mb-4">
                {selected ? `Links: ${selected.title}` : 'Trace Links'}
              </h3>
              {selected ? (
                <Stack gap={2}>
                  {connectedEdges.length > 0 ? (
                    connectedEdges.map((edge, i) => {
                      const source = nodeMap.get(edge.sourceId);
                      const target = nodeMap.get(edge.targetId);
                      const edgeColors = typeColorMap(source?.type ?? 'result');
                      return (
                        <div key={i} className="flex items-center gap-2 py-2 border-b border-border last:border-b-0">
                          <span className={`text-xs font-mono px-2 py-1 rounded ${edgeColors.bg} ${edgeColors.text}`}>
                            {source?.title || source?.id}
                          </span>
                          <span className="flex-1 text-center">
                            <span className={`text-xs font-medium ${confidenceTextColor(edge.confidenceScore)}`}>
                              {edge.relationshipType} ({Math.round(edge.confidenceScore * 100)}%)
                            </span>
                          </span>
                          <span className={`text-xs font-mono px-2 py-1 rounded ${typeColorMap(target?.type ?? 'result').bg} ${typeColorMap(target?.type ?? 'result').text}`}>
                            {target?.title || target?.id}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-text-tertiary text-center py-8">No links found for this node</p>
                  )}
                </Stack>
              ) : (
                <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 py-8 text-center">
                  <span className="text-4xl" aria-hidden="true">🕸️</span>
                  <p className="text-sm text-text-tertiary max-w-md">
                    Click a node on the left to view its traceability links.
                    Hover states show confidence scores for each relationship.
                  </p>
                </div>
              )}
            </Card>
          </div>

          <Card variant="outlined" padding="lg">
            <h3 className="text-base font-semibold text-text-primary mb-4">Domain Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.coverage.domainCoverage.map(domain => (
                <div key={domain.domain} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-secondary capitalize">{domain.domain}</span>
                    <span className={`text-sm font-bold ${coverageTextColor(domain.coveragePercent)}`}>
                      {domain.coveragePercent}%
                    </span>
                  </div>
                  <div className="h-2 bg-surface-tertiary rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${coverageBarColor(domain.coveragePercent)}`}
                      style={{ width: `${domain.coveragePercent}%` }}
                    />
                  </div>
                  <p className="text-xs text-text-tertiary">
                    {domain.coveredArtifacts} of {domain.totalArtifacts} artifacts
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </Stack>
      </Stack>
    </Container>
  );
}

export default TraceGraph;
