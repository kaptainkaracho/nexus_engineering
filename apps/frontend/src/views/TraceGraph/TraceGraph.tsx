import { useState } from 'react';
import { Card, Stack, Container } from '@nexus-engineering/shared';

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

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  requirement: { bg: 'bg-blue-50 dark:bg-blue-950', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800', dot: 'bg-blue-500' },
  feature: { bg: 'bg-purple-50 dark:bg-purple-950', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800', dot: 'bg-purple-500' },
  architecture: { bg: 'bg-amber-50 dark:bg-amber-950', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800', dot: 'bg-amber-500' },
  testCase: { bg: 'bg-green-50 dark:bg-green-950', text: 'text-green-700 dark:text-green-300', border: 'border-green-200 dark:border-green-800', dot: 'bg-green-500' },
  result: { bg: 'bg-gray-50 dark:bg-gray-950', text: 'text-gray-700 dark:text-gray-300', border: 'border-gray-200 dark:border-gray-800', dot: 'bg-gray-500' },
};

const CONFIDENCE_COLORS: Record<string, string> = {
  high: 'text-green-600 dark:text-green-400',
  medium: 'text-yellow-600 dark:text-yellow-400',
  low: 'text-red-600 dark:text-red-400',
};

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

  return (
    <Container size="lg">
      <Stack gap={6}>
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Trace Graph</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Visualize traceability relationships across requirements, architecture, and tests.
          </p>
        </div>

        <Grid3>
          <Card padding="lg">
            <p className="text-sm font-medium text-text-tertiary uppercase tracking-wide">Overall Coverage</p>
            <p className={`mt-2 text-3xl font-bold ${data.coverage.overallCoveragePercent >= 80 ? 'text-green-600 dark:text-green-400' : data.coverage.overallCoveragePercent >= 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
              {data.coverage.overallCoveragePercent}%
            </p>
            <p className="mt-1 text-xs text-text-tertiary">
              {data.coverage.summary.totalArtifacts} artifacts analyzed
            </p>
          </Card>

          <Card padding="lg">
            <p className="text-sm font-medium text-text-tertiary uppercase tracking-wide">High Risk Gaps</p>
            <p className="mt-2 text-3xl font-bold text-red-600 dark:text-red-400">
              {data.coverage.summary.highRiskCount}
            </p>
            <p className="mt-1 text-xs text-text-tertiary">
              {data.coverage.summary.totalGaps} total gaps
            </p>
          </Card>

          <Card padding="lg">
            <p className="text-sm font-medium text-text-tertiary uppercase tracking-wide">Direct Links</p>
            <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">
              {data.edges.length}
            </p>
            <p className="mt-1 text-xs text-text-tertiary">
              traceability relationships
            </p>
          </Card>
        </Grid3>

        <Stack gap={6}>
          <Card padding="lg">
            <h3 className="text-base font-semibold text-text-primary mb-4">V-Model Coverage by Axis</h3>
            <Stack gap={3}>
              {data.coverage.axes.map(axis => (
                <div key={axis.axis} className="flex items-center gap-3">
                  <span className="w-28 text-sm font-medium text-text-secondary capitalize">{axis.axis}</span>
                  <div className="flex-1 h-3 bg-surface-tertiary rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${axis.coveragePercent >= 80 ? 'bg-green-500' : axis.coveragePercent >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
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
                  const colors = TYPE_COLORS[node.type] || TYPE_COLORS.result;
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
                          <span className={`text-xs font-medium ${CONFIDENCE_COLORS[node.confidenceScore >= 0.9 ? 'high' : node.confidenceScore >= 0.7 ? 'medium' : 'low']}`}>
                            {Math.round(node.confidenceScore * 100)}%
                          </span>
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
                      const edgeColors = CONFIDENCE_COLORS[edge.confidence] || 'text-text-tertiary';
                      return (
                        <div key={i} className="flex items-center gap-2 py-2 border-b border-border last:border-b-0">
                          <span className={`text-xs font-mono px-2 py-1 rounded ${TYPE_COLORS[source?.type || 'result'].bg} ${TYPE_COLORS[source?.type || 'result'].text}`}>
                            {source?.title || source?.id}
                          </span>
                          <span className="flex-1 text-center">
                            <span className={`text-xs font-medium ${edgeColors}`}>
                              {edge.relationshipType} ({Math.round(edge.confidenceScore * 100)}%)
                            </span>
                          </span>
                          <span className={`text-xs font-mono px-2 py-1 rounded ${TYPE_COLORS[target?.type || 'result'].bg} ${TYPE_COLORS[target?.type || 'result'].text}`}>
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
            <Grid3>
              {data.coverage.domainCoverage.map(domain => (
                <div key={domain.domain} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-secondary capitalize">{domain.domain}</span>
                    <span className={`text-sm font-bold ${domain.coveragePercent >= 80 ? 'text-green-600 dark:text-green-400' : domain.coveragePercent >= 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                      {domain.coveragePercent}%
                    </span>
                  </div>
                  <div className="h-2 bg-surface-tertiary rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${domain.coveragePercent >= 80 ? 'bg-green-500' : domain.coveragePercent >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${domain.coveragePercent}%` }}
                    />
                  </div>
                  <p className="text-xs text-text-tertiary">
                    {domain.coveredArtifacts} of {domain.totalArtifacts} artifacts
                  </p>
                </div>
              ))}
            </Grid3>
          </Card>
        </Stack>
      </Stack>
    </Container>
  );
}

function Grid3({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {children}
    </div>
  );
}

export default TraceGraph;
