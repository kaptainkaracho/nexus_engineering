import { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { Container, Stack, Card, Badge, Alert, Grid } from '@nexus-engineering/shared';
import { fetchTraceImpact } from '../../api/client';
import type { ImpactAnalysisData } from '../../api/client';

const IMPACT_LEVEL_COLORS: Record<string, string> = {
  direct: '#ef4444',
  indirect: '#f59e0b',
  transitive: '#3b82f6',
};

const IMPACT_LEVEL_LABELS: Record<string, string> = {
  direct: 'Direct',
  indirect: 'Indirect',
  transitive: 'Transitive',
};

const CONFIDENCE_COLORS: Record<string, string> = {
  high: '#22c55e',
  medium: '#f59e0b',
  low: '#ef4444',
};

function confidenceLabel(score: number): string {
  if (score >= 0.7) return 'High';
  if (score >= 0.4) return 'Medium';
  return 'Low';
}

function confidenceColor(score: number): string {
  if (score >= 0.7) return CONFIDENCE_COLORS.high;
  if (score >= 0.4) return CONFIDENCE_COLORS.medium;
  return CONFIDENCE_COLORS.low;
}

interface ImpactAnalysisProps {
  initialArtifactId?: string;
}

export function ImpactAnalysis({ initialArtifactId }: ImpactAnalysisProps) {
  const [data, setData] = useState<ImpactAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [artifactId, setArtifactId] = useState(initialArtifactId || '');
  const [activeTab, setActiveTab] = useState<'summary' | 'artifacts' | 'chains' | 'graph'>('summary');
  const svgRef = useRef<SVGSVGElement>(null);

  const loadImpact = useCallback((id: string) => {
    if (!id.trim()) {
      setError('Please enter an artifact ID');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    fetchTraceImpact(id.trim())
      .then((result) => {
        setData(result);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load impact analysis. Please try again.');
        setLoading(false);
      });
  }, []);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      loadImpact(artifactId);
    },
    [artifactId, loadImpact],
  );

  useEffect(() => {
    if (initialArtifactId) {
      loadImpact(initialArtifactId);
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!data || !data.impactGraph || data.impactGraph.nodes.length === 0 || !svgRef.current) return;

    const { nodes: rawNodes, edges: rawEdges } = data.impactGraph;

    const width = svgRef.current.clientWidth;
    const height = 500;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const g = svg.append('g');

    const nodeMap = new Map(rawNodes.map((n) => [n.id, n]));

    const links = rawEdges
      .filter((e) => nodeMap.has(e.sourceId) && nodeMap.has(e.targetId))
      .map((e) => ({ sourceId: e.sourceId, targetId: e.targetId, relationshipType: e.relationshipType }));

    const nodes = rawNodes.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      confidenceScore: n.confidenceScore,
    }));

    const linkElements = g
      .append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#6b7280')
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.4)
      .attr('stroke-dasharray', (d) => (d.relationshipType === 'dependsOn' ? '4,4' : 'none'));

    const nodeGroup = g.append('g').attr('class', 'nodes').selectAll('g').data(nodes).join('g');

    const drag = d3
      .drag<SVGGElement, typeof nodes[number]>()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = (d as any).x;
        d.fy = (d as any).y;
      })
      .on('drag', (event, d) => {
        (d as any).fx = event.x;
        (d as any).fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        (d as any).fx = null;
        (d as any).fy = null;
      });

    nodeGroup.call(drag as any);

    nodeGroup
      .append('circle')
      .attr('r', 10)
      .attr('fill', (d) => {
        const level = data.artifacts.find((a) => a.id === d.id);
        return level ? IMPACT_LEVEL_COLORS[level.impactLevel] : '#6b7280';
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    nodeGroup
      .append('text')
      .text((d) => d.title ?? d.id.slice(0, 8))
      .attr('x', 14)
      .attr('y', 4)
      .attr('font-size', '11px')
      .attr('fill', '#e2e8f0');

    nodeGroup.append('title').text((d) => `${d.title || d.id}\nConfidence: ${((d.confidenceScore || 0) * 100).toFixed(0)}%`);

    const simulation = d3
      .forceSimulation<typeof nodes[number]>(nodes)
      .force(
        'link',
        d3
          .forceLink<typeof nodes[number], d3.SimulationLinkDatum<typeof nodes[number]>>(links as any)
          .id((d) => d.id)
          .distance(100),
      )
      .force('charge', d3.forceManyBody().strength(-250))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide(25));

    simulation.on('tick', () => {
      linkElements
        .attr('x1', (d: any) => (d.source as any).x!)
        .attr('y1', (d: any) => (d.source as any).y!)
        .attr('x2', (d: any) => (d.target as any).x!)
        .attr('y2', (d: any) => (d.target as any).y!);

      nodeGroup.attr('transform', (d) => `translate(${(d as any).x},${(d as any).y})`);
    });

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    return () => {
      simulation.stop();
    };
  }, [data]);

  if (loading) {
    return (
      <Container size="lg">
        <Stack gap={6}>
          <div>
            <h2 className="text-2xl font-bold text-text-primary">Impact Analysis</h2>
            <p className="mt-1 text-sm text-text-secondary">Analyzing artifact dependencies...</p>
          </div>
          <Card variant="outlined" padding="lg">
            <div className="flex min-h-[300px] items-center justify-center text-text-secondary">
              <svg className="mr-3 h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Loading impact data...
            </div>
          </Card>
        </Stack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="lg">
        <Stack gap={6}>
          <div>
            <h2 className="text-2xl font-bold text-text-primary">Impact Analysis</h2>
          </div>
          <Alert variant="error" title="Error">{error}</Alert>
        </Stack>
      </Container>
    );
  }

  const totalAffected = data?.summary?.totalAffected ?? 0;
  const directCount = data?.summary?.directCount ?? 0;
  const indirectCount = data?.summary?.indirectCount ?? 0;
  const transitiveCount = data?.summary?.transitiveCount ?? 0;
  const minConfidence = data?.summary?.minConfidence ?? 0;
  const maxConfidence = data?.summary?.maxConfidence ?? 0;

  return (
    <Container size="lg">
      <Stack gap={6}>
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Impact Analysis</h2>
          <p className="mt-1 text-sm text-text-secondary">
            View dependency chains and analyze the impact of changes to artifacts.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-3">
          <div style={{ flex: 1 }}>
            <Input
              placeholder="Enter artifact ID (e.g., REQ-001)"
              value={artifactId}
              onChange={(e) => setArtifactId(e.target.value)}
              aria-label="Artifact ID"
            />
          </div>
          <Button type="submit" variant="primary">
            Analyze
          </Button>
        </form>

        {!data && (
          <Card variant="outlined" padding="lg">
            <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
              <svg className="mb-3 h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 20V10M6 20V4M18 20v-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-sm">Enter an artifact ID to see its impact analysis</p>
            </div>
          </Card>
        )}

        {data && (
          <>
            <Stack gap={4}>
              <Grid cols={4}>
                <Card padding="md">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-text-primary">{totalAffected}</div>
                    <div className="text-xs text-text-secondary mt-1">Total Affected</div>
                  </div>
                </Card>
                <Card padding="md">
                  <div className="text-center">
                    <div className="text-2xl font-bold" style={{ color: IMPACT_LEVEL_COLORS.direct }}>
                      {directCount}
                    </div>
                    <div className="text-xs text-text-secondary mt-1">Direct</div>
                  </div>
                </Card>
                <Card padding="md">
                  <div className="text-center">
                    <div className="text-2xl font-bold" style={{ color: IMPACT_LEVEL_COLORS.indirect }}>
                      {indirectCount}
                    </div>
                    <div className="text-xs text-text-secondary mt-1">Indirect</div>
                  </div>
                </Card>
                <Card padding="md">
                  <div className="text-center">
                    <div className="text-2xl font-bold" style={{ color: IMPACT_LEVEL_COLORS.transitive }}>
                      {transitiveCount}
                    </div>
                    <div className="text-xs text-text-secondary mt-1">Transitive</div>
                  </div>
                </Card>
              </Grid>

              <div role="tablist" className="flex gap-1 border-b border-border-secondary pb-0">
                {(['summary', 'artifacts', 'chains', 'graph'] as const).map((tab) => (
                  <button
                    key={tab}
                    role="tab"
                    aria-selected={activeTab === tab}
                    aria-controls={`panel-${tab}`}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      activeTab === tab
                        ? 'border-b-2 border-primary-500 text-text-primary'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              <div role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={activeTab}>
                {activeTab === 'summary' && (
                  <Card padding="lg">
                    <Stack gap={4}>
                      <div>
                        <h3 className="text-lg font-semibold text-text-primary">Impact Summary</h3>
                        <p className="mt-1 text-sm text-text-secondary">
                          Artifact: <code className="text-xs bg-bg-tertiary px-1.5 py-0.5 rounded">{data.artifactId}</code>
                          {data.confidenceThreshold > 0 && (
                            <span className="ml-2 text-xs text-text-secondary">
                              (confidence threshold: {Math.round(data.confidenceThreshold * 100)}%)
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-text-secondary mb-2">Confidence Range</h4>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 rounded-full bg-bg-tertiary overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${((maxConfidence - minConfidence) / (maxConfidence || 1)) * 100}%`,
                                  background: `linear-gradient(to right, ${confidenceColor(minConfidence)}, ${confidenceColor(maxConfidence)})`,
                                }}
                              />
                            </div>
                            <span className="text-xs text-text-secondary">
                              {Math.round(minConfidence * 100)}% - {Math.round(maxConfidence * 100)}%
                            </span>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-text-secondary mb-2">Scope</h4>
                          <p className="text-xs text-text-primary break-all">
                            {data.scope.artifactTypes && data.scope.artifactTypes.length > 0
                              ? `Types: ${data.scope.artifactTypes.join(', ')}`
                              : 'All artifact types'}
                          </p>
                        </div>
                      </div>

                      {data.chains && data.chains.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-text-secondary mb-2">Top Impact Chains</h4>
                          <Stack gap={2}>
                            {data.chains
                              .sort((a, b) => (b.confidenceScore ?? 0) - (a.confidenceScore ?? 0))
                              .slice(0, 5)
                              .map((chain, i) => (
                                <div
                                  key={i}
                                  className="flex items-center gap-2 rounded border border-border-secondary p-2"
                                >
                                  <Badge color={confidenceColor(chain.confidenceScore ?? 0)} size="sm">
                                    {confidenceLabel(chain.confidenceScore ?? 0)}
                                  </Badge>
                                  <span className="text-xs text-text-secondary">
                                    {chain.level}
                                  </span>
                                  <code className="text-xs text-text-primary">
                                    {chain.path.join(' → ')}
                                  </code>
                                </div>
                              ))}
                          </Stack>
                        </div>
                      )}
                    </Stack>
                  </Card>
                )}

                {activeTab === 'artifacts' && data.artifacts && data.artifacts.length > 0 && (
                  <Card padding="lg">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm" role="table">
                        <thead>
                          <tr className="border-b border-border-secondary">
                            <th className="pb-2 text-left font-medium text-text-secondary" scope="col">Artifact</th>
                            <th className="pb-2 text-left font-medium text-text-secondary" scope="col">Type</th>
                            <th className="pb-2 text-left font-medium text-text-secondary" scope="col">Impact Level</th>
                            <th className="pb-2 text-left font-medium text-text-secondary" scope="col">Relationship</th>
                            <th className="pb-2 text-left font-medium text-text-secondary" scope="col">Confidence</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.artifacts.map((artifact) => (
                            <tr key={artifact.id} className="border-b border-border-secondary/50">
                              <td className="py-2">
                                <code className="text-xs bg-bg-tertiary px-1.5 py-0.5 rounded">{artifact.id}</code>
                              </td>
                              <td className="py-2 text-text-secondary">{artifact.type}</td>
                              <td className="py-2">
                                <Badge color={IMPACT_LEVEL_COLORS[artifact.impactLevel]} size="sm">
                                  {IMPACT_LEVEL_LABELS[artifact.impactLevel]}
                                </Badge>
                              </td>
                              <td className="py-2 text-text-secondary">{artifact.relationshipType}</td>
                              <td className="py-2">
                                <div className="flex items-center gap-2">
                                  <div className="h-1.5 w-16 rounded-full bg-bg-tertiary overflow-hidden">
                                    <div
                                      className="h-full rounded-full"
                                      style={{
                                        width: `${(artifact.confidenceScore ?? 0) * 100}%`,
                                        backgroundColor: confidenceColor(artifact.confidenceScore ?? 0),
                                      }}
                                    />
                                  </div>
                                  <span className="text-xs text-text-secondary">
                                    {Math.round((artifact.confidenceScore ?? 0) * 100)}%
                                  </span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                )}

                {activeTab === 'artifacts' && data.artifacts && data.artifacts.length === 0 && (
                  <Card padding="lg">
                    <div className="flex items-center justify-center py-8 text-text-secondary">
                      <p>No affected artifacts found for this artifact.</p>
                    </div>
                  </Card>
                )}

                {activeTab === 'chains' && data.chains && data.chains.length > 0 && (
                  <Card padding="lg">
                    <Stack gap={3}>
                      <h3 className="text-lg font-semibold text-text-primary">Dependency Chains</h3>
                      {data.chains
                        .sort((a, b) => (b.confidenceScore ?? 0) - (a.confidenceScore ?? 0))
                        .map((chain, i) => (
                          <div
                            key={i}
                            className="flex flex-col gap-1 rounded border border-border-secondary p-3"
                          >
                            <div className="flex items-center gap-2">
                              <Badge color={confidenceColor(chain.confidenceScore ?? 0)} size="sm">
                                {confidenceLabel(chain.confidenceScore ?? 0)}
                              </Badge>
                              <Badge color={IMPACT_LEVEL_COLORS[chain.level]} size="sm">
                                {IMPACT_LEVEL_LABELS[chain.level]}
                              </Badge>
                              <span className="text-xs text-text-secondary ml-auto">
                                Confidence: {Math.round((chain.confidenceScore ?? 0) * 100)}%
                              </span>
                            </div>
                            <code className="text-sm text-text-primary">
                              {chain.path.join(' → ')}
                            </code>
                          </div>
                        ))}
                    </Stack>
                  </Card>
                )}

                {activeTab === 'chains' && data.chains && data.chains.length === 0 && (
                  <Card padding="lg">
                    <div className="flex items-center justify-center py-8 text-text-secondary">
                      <p>No dependency chains found.</p>
                    </div>
                  </Card>
                )}

                {activeTab === 'graph' && (
                  <Card variant="outlined" padding="lg">
                    {data.impactGraph && data.impactGraph.nodes.length > 0 ? (
                      <div className="relative">
                        <div className="mb-3 flex items-center gap-4 text-xs text-text-secondary">
                          <span className="flex items-center gap-1">
                            <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: IMPACT_LEVEL_COLORS.direct }} /> Direct
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: IMPACT_LEVEL_COLORS.indirect }} /> Indirect
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: IMPACT_LEVEL_COLORS.transitive }} /> Transitive
                          </span>
                          <span className="flex items-center gap-1 ml-auto">
                            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Scroll to zoom
                          </span>
                        </div>
                        <svg
                          ref={svgRef}
                          className="h-[500px] w-full rounded border border-border-secondary bg-bg-secondary"
                        />
                      </div>
                    ) : (
                      <div className="flex min-h-[300px] items-center justify-center text-text-secondary">
                        <p>No impact graph data available.</p>
                      </div>
                    )}
                  </Card>
                )}
              </div>
            </Stack>
          </>
        )}
      </Stack>
    </Container>
  );
}

export default ImpactAnalysis;
