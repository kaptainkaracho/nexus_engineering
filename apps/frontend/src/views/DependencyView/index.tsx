import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Card, Container, Stack } from '@nexus-engineering/shared';
import {
  fetchDependencyGraph,
  type DependencyGraphResult,
  type GraphNodeType,
} from '../../api/client';
import './DependencyView.css';

const TYPE_COLOR: Record<string, string> = {
  requirement: '#0EA5E9',
  architectureModel: '#F59E0B',
  softwareComponent: '#6366F1',
  testCase: '#14B8A6',
};

const TYPE_LABEL: Record<string, string> = {
  requirement: 'Requirements',
  architectureModel: 'Architecture',
  softwareComponent: 'Components',
  testCase: 'Tests',
};

export function DependencyView() {
  const [graph, setGraph] = useState<DependencyGraphResult>({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const nodeTypes = useMemo(() => {
    const types = new Set(graph.nodes.map((n) => n.type));
    return Array.from(types);
  }, [graph.nodes]);

  const filteredNodes = useMemo(() => {
    if (!activeFilter) return graph.nodes;
    return graph.nodes.filter((n) => n.type === activeFilter);
  }, [graph.nodes, activeFilter]);

  const filteredNodeIds = useMemo(() => new Set(filteredNodes.map((n) => n.id)), [filteredNodes]);

  const filteredEdges = useMemo(() => {
    return graph.edges.filter(
      (e) => filteredNodeIds.has(e.sourceId) && filteredNodeIds.has(e.targetId),
    );
  }, [graph.edges, filteredNodeIds]);

  const connectedEdges = useMemo(() => {
    if (!selectedNode) return [];
    return graph.edges.filter(
      (e) => e.sourceId === selectedNode || e.targetId === selectedNode,
    );
  }, [graph.edges, selectedNode]);

  const activeNode = useMemo(() => {
    if (!selectedNode) return null;
    return graph.nodes.find((n) => n.id === selectedNode) ?? null;
  }, [graph.nodes, selectedNode]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    fetchDependencyGraph()
      .then((g) => {
        if (cancelled) return;
        setGraph(g);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : 'Failed to load dependency graph');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
          <p className="text-sm text-text-tertiary">Loading dependency graph…</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <Card padding="lg" className="mt-6 border border-error-500/40">
        <Stack gap={3}>
          <p className="text-sm text-error-600 dark:text-error-400">{loadError}</p>
          <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Stack>
      </Card>
    );
  }

  if (graph.nodes.length === 0) {
    return (
      <Card padding="lg" className="mt-6">
        <p className="text-sm text-text-tertiary">No dependency data available. Add artifacts to build the graph.</p>
      </Card>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-bold text-text-primary">Dependency View</h2>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by type">
          <button
            type="button"
            onClick={() => setActiveFilter(null)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
              !activeFilter
                ? 'border-primary-500 bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-400'
                : 'border-border bg-surface-secondary text-text-tertiary hover:border-border hover:bg-surface-tertiary'
            }`}
            aria-pressed={!activeFilter}
          >
            All ({graph.nodes.length})
          </button>
          {nodeTypes.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setActiveFilter(activeFilter === type ? null : type)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                activeFilter === type
                  ? 'border-primary-500 bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-400'
                  : 'border-border bg-surface-secondary text-text-tertiary hover:border-border hover:bg-surface-tertiary'
              }`}
              aria-pressed={activeFilter === type}
              style={activeFilter === type ? {} : {}}
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: TYPE_COLOR[type] || '#94A3B8' }}
                aria-hidden="true"
              />
              {TYPE_LABEL[type] || type}
            </button>
          ))}
        </div>
      </div>

      <div ref={canvasRef} className="graph-canvas dependency-graph">
        <div className="graph-inner">
          <svg width={800} height={600} className="dependency-graph-svg">
            <defs>
              <marker
                id="dep-graph-arrow"
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M0,0 L10,5 L0,10 z" fill="#94A3B8" />
              </marker>
            </defs>
            {filteredEdges.map((edge, i) => {
              const source = filteredNodes.find((n) => n.id === edge.sourceId);
              const target = filteredNodes.find((n) => n.id === edge.targetId);
              if (!source || !target) return null;
              const isActive = selectedNode && (edge.sourceId === selectedNode || edge.targetId === selectedNode);
              return (
                <line
                  key={`edge-${i}`}
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke={isActive ? '#6366F1' : '#CBD5E1'}
                  strokeWidth={isActive ? 2.5 : 1.2}
                  markerEnd="url(#dep-graph-arrow)"
                  opacity={selectedNode && !isActive ? 0.25 : 1}
                >
                  <title>{edge.relationshipType}</title>
                </line>
              );
            })}
            {filteredNodes.map((node) => {
              const isSelected = node.id === selectedNode;
              const isNeighbor = selectedNode && connectedEdges.some(
                (e) => e.sourceId === node.id || e.targetId === node.id,
              );
              return (
                <g key={node.id}>
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isSelected ? 28 : 20}
                    fill={isSelected ? TYPE_COLOR[node.type] || '#6366F1' : '#F8FAFC'}
                    stroke={isSelected ? (TYPE_COLOR[node.type] || '#6366F1') : '#CBD5E1'}
                    strokeWidth={isSelected ? 3 : 1.5}
                    className="cursor-pointer"
                    onClick={() => setSelectedNode(isSelected ? null : node.id)}
                    role="button"
                    aria-label={`${node.title} — ${TYPE_LABEL[node.type] || node.type}${isSelected ? ' (selected)' : ''}`}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedNode(isSelected ? null : node.id);
                      }
                    }}
                  />
                  <text
                    x={node.x}
                    y={node.y + 4}
                    textAnchor="middle"
                    className="pointer-events-none select-none"
                    fontSize={isSelected ? 11 : 10}
                    fontWeight={isSelected ? 600 : 400}
                    fill={isSelected ? '#FFFFFF' : '#334155'}
                  >
                    {node.title.length > 12 ? `${node.title.slice(0, 10)}…` : node.title}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {selectedNode && activeNode && (
        <Card padding="lg" className="mt-6">
          <Stack gap={3}>
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: TYPE_COLOR[activeNode.type] || '#94A3B8' }}
                aria-hidden="true"
              />
              <h3 className="text-base font-semibold text-text-primary">{activeNode.title}</h3>
              <span className="font-mono text-xs text-text-tertiary">{activeNode.id}</span>
            </div>
            <p className="text-xs text-text-tertiary">
              {TYPE_LABEL[activeNode.type] || activeNode.type} · {connectedEdges.length} connection{connectedEdges.length !== 1 ? 's' : ''}
            </p>
            {connectedEdges.length === 0 ? (
              <p className="text-sm text-text-tertiary">No dependencies connected to this artifact.</p>
            ) : (
              <ul className="flex flex-col gap-2" aria-label="Connected dependencies">
                {connectedEdges.map((edge, i) => {
                  const otherId = edge.sourceId === selectedNode ? edge.targetId : edge.sourceId;
                  const direction = edge.sourceId === selectedNode ? '→' : '←';
                  const other = graph.nodes.find((n) => n.id === otherId);
                  return (
                    <li
                      key={`${edge.sourceId}-${edge.targetId}-${i}`}
                      className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-surface-secondary px-3 py-2 text-sm"
                    >
                      <span aria-hidden="true" className="text-text-tertiary">{direction}</span>
                      <span className="font-medium text-text-primary">{other?.title || otherId}</span>
                      <span className="dash-badge dash-badge--type-unknown">{edge.relationshipType}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Stack>
        </Card>
      )}
    </div>
  );
}

export default DependencyView;
