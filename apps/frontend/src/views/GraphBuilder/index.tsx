import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Card, Container, Stack } from '@nexus-engineering/shared';
import {
  fetchTraceabilityGraph,
  type GraphEdge,
  type GraphNode,
  type GraphNodeType,
  type TraceabilityGraph,
} from '../../api/client';
import './GraphBuilder.css';

const COLUMN_ORDER: GraphNodeType[] = [
  'requirement',
  'architectureModel',
  'softwareComponent',
  'testCase',
];

const COLUMN_LABEL: Record<GraphNodeType, string> = {
  requirement: 'Requirements',
  architectureModel: 'Architecture',
  softwareComponent: 'Components',
  testCase: 'Tests',
};

// Token references: --color-info-500, --color-warning-500, --color-primary-500, --color-secondary-400
const TYPE_COLOR: Record<GraphNodeType, string> = {
  requirement: '#0EA5E9',       // info-500
  architectureModel: '#F59E0B', // warning-500
  softwareComponent: '#6366F1', // accent (indigo — no token, kept as-is)
  testCase: '#14B8A6',          // secondary-400 (teal — closest match)
};

const COL_W = 240;
const ROW_H = 92;
const PAD_X = 24;
const PAD_Y = 24;
const NODE_W = 172;
const NODE_H = 56;

interface NodePosition {
  x: number;
  y: number;
}

function columnOf(type: GraphNodeType): number {
  const idx = COLUMN_ORDER.indexOf(type);
  return idx < 0 ? COLUMN_ORDER.length : idx;
}

function layoutGraph(nodes: GraphNode[]) {
  const byCol = new Map<number, GraphNode[]>();
  for (const n of nodes) {
    const c = columnOf(n.type);
    const arr = byCol.get(c) ?? [];
    arr.push(n);
    byCol.set(c, arr);
  }
  const positions = new Map<string, NodePosition>();
  let maxRows = 0;
  let maxCol = 0;
  byCol.forEach((arr, c) => {
    arr.forEach((n, i) => {
      positions.set(n.id, { x: c * COL_W + PAD_X, y: i * ROW_H + PAD_Y });
    });
    maxRows = Math.max(maxRows, arr.length);
    maxCol = Math.max(maxCol, c);
  });
  const width = (maxCol + 1) * COL_W + PAD_X;
  const height = maxRows * ROW_H + PAD_Y + NODE_H;
  return { positions, width, height };
}

function nodeLabel(node: GraphNode): string {
  return node.title || node.name || node.id;
}

function shortId(id: string): string {
  return id.length > 8 ? `${id.slice(0, 6)}…` : id;
}

interface GraphBuilderProps {
  /** Deep-linked artifact id (from `#graph?artifact=<id>`). Highlights + centers the node. */
  selectedId?: string | null;
}

export function GraphBuilder({ selectedId }: GraphBuilderProps) {
  const [graph, setGraph] = useState<TraceabilityGraph>({
    nodes: [],
    edges: [],
    totalNodes: 0,
    totalEdges: 0,
  });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(selectedId ?? null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    fetchTraceabilityGraph()
      .then((g) => {
        if (cancelled) return;
        setGraph(g);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : 'Failed to load traceability graph');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setActiveId(selectedId ?? null);
  }, [selectedId]);

  const { positions, width, height } = useMemo(
    () => layoutGraph(graph.nodes),
    [graph.nodes],
  );

  const nodesById = useMemo(() => {
    const m = new Map<string, GraphNode>();
    graph.nodes.forEach((n) => m.set(n.id, n));
    return m;
  }, [graph.nodes]);

  const connectedEdges = useMemo(() => {
    if (!activeId) return [];
    return graph.edges.filter((e) => e.sourceId === activeId || e.targetId === activeId);
  }, [activeId, graph.edges]);

  useEffect(() => {
    if (activeId && activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    }
  }, [activeId]);

  const activeNode = activeId ? nodesById.get(activeId) ?? null : null;

  return (
    <Container size="lg" className="py-8">
      <Stack gap={2} className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Graph Builder</h1>
        <p className="text-text-secondary">
          Explore traceability between requirements, architecture, components, and tests.
        </p>
      </Stack>

      {loadError && (
        <Card padding="lg" className="mb-6 border border-error-500/40">
          <Stack gap={3}>
            <p className="text-sm text-error-600 dark:text-error-400">
              Error loading traceability graph: {loadError}
            </p>
            <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </Stack>
        </Card>
      )}

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <Stat label="Nodes" value={graph.totalNodes} />
        <Stat label="Trace links" value={graph.totalEdges} />
        <div className="flex flex-wrap items-center gap-3" role="list" aria-label="Node types">
          {COLUMN_ORDER.map((t) => (
            <span key={t} role="listitem" className="flex items-center gap-1.5 text-xs text-text-tertiary">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: TYPE_COLOR[t] }}
                aria-hidden="true"
              />
              {COLUMN_LABEL[t]}
            </span>
          ))}
        </div>
      </div>

      {loading ? (
        <Card padding="lg">
          <p className="py-16 text-center text-sm text-text-tertiary">Loading traceability graph…</p>
        </Card>
      ) : graph.nodes.length === 0 ? (
        <Card padding="lg">
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <span className="text-2xl" aria-hidden="true">🕸️</span>
            <p className="text-lg font-semibold text-text-primary">No traceability data yet</p>
            <p className="max-w-sm text-sm text-text-tertiary">
              Run a discovery scan and ensure artifacts have trace links to populate the graph.
            </p>
          </div>
        </Card>
      ) : (
        <div
          className="graph-canvas"
          role="group"
          aria-label="Traceability graph. Each node is focusable; activate a node to inspect its trace links."
          style={{ overflow: 'auto' }}
        >
          <div
            ref={canvasRef}
            className="graph-inner relative"
            style={{ width, height }}
          >
            <svg
              className="graph-edges pointer-events-none absolute inset-0"
              width={width}
              height={height}
              aria-hidden="true"
            >
              <defs>
                <marker
                  id="graph-arrow"
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
              {graph.edges.map((edge, i) => {
                const s = positions.get(edge.sourceId);
                const t = positions.get(edge.targetId);
                if (!s || !t) return null;
                const sx = s.x + NODE_W / 2;
                const sy = s.y + NODE_H / 2;
                const tx = t.x + NODE_W / 2;
                const ty = t.y + NODE_H / 2;
                const isActive =
                  !!activeId && (edge.sourceId === activeId || edge.targetId === activeId);
                return (
                  <line
                    key={`${edge.sourceId}-${edge.targetId}-${i}`}
                    x1={sx}
                    y1={sy}
                    x2={tx}
                    y2={ty}
                    stroke={isActive ? '#6366F1' : '#CBD5E1'}
                    strokeWidth={isActive ? 2.5 : 1.2}
                    markerEnd="url(#graph-arrow)"
                    opacity={activeId && !isActive ? 0.25 : 1}
                  >
                    <title>{edge.relationshipType}</title>
                  </line>
                );
              })}
            </svg>

            {graph.nodes.map((node) => {
              const pos = positions.get(node.id);
              if (!pos) return null;
              const isActive = node.id === activeId;
              const isNeighbor = connectedEdges.some(
                (e) => e.sourceId === node.id || e.targetId === node.id,
              );
              return (
                <button
                  key={node.id}
                  ref={isActive ? activeRef : undefined}
                  type="button"
                  aria-pressed={isActive}
                  aria-label={`${nodeLabel(node)} — ${COLUMN_LABEL[node.type]}${isActive ? ' (selected)' : ''}`}
                  onClick={() => setActiveId(isActive ? null : node.id)}
                  className={`graph-node absolute flex flex-col items-start justify-center rounded-lg border bg-surface-primary px-3 text-left shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                    isActive ? 'graph-node--active' : 'hover:bg-surface-secondary'
                  }`}
                  style={{
                    left: pos.x,
                    top: pos.y,
                    width: NODE_W,
                    height: NODE_H,
                    borderColor: isActive ? TYPE_COLOR[node.type] : undefined,
                    opacity: activeId && !isActive && !isNeighbor ? 0.4 : 1,
                  }}
                >
                  <span
                    className="mb-1 h-1.5 w-1.5 rounded-full"
                    style={{ background: TYPE_COLOR[node.type] }}
                    aria-hidden="true"
                  />
                  <span className="w-full truncate text-xs font-medium text-text-primary">
                    {nodeLabel(node)}
                  </span>
                  <span className="w-full truncate font-mono text-[10px] text-text-tertiary">
                    {shortId(node.id)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selectedId && !activeNode && !loading && (
        <Card padding="lg" className="mt-6 border border-warning-500/40">
          <p className="text-sm text-warning-600 dark:text-warning-400">
            Artifact <span className="font-mono">{shortId(selectedId)}</span> is not part of the
            current traceability graph. Showing the full graph instead.
          </p>
        </Card>
      )}

      {activeNode && (
        <Card padding="lg" className="mt-6">
          <Stack gap={3}>
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: TYPE_COLOR[activeNode.type] }}
                aria-hidden="true"
              />
              <h2 className="text-base font-semibold text-text-primary">{nodeLabel(activeNode)}</h2>
            </div>
            <p className="text-xs text-text-tertiary">
              {COLUMN_LABEL[activeNode.type]} · <span className="font-mono">{activeNode.id}</span>
            </p>
            {connectedEdges.length === 0 ? (
              <p className="text-sm text-text-tertiary">No trace links connected to this artifact.</p>
            ) : (
              <ul className="flex flex-col gap-2" aria-label="Connected trace links">
                {connectedEdges.map((edge, i) => {
                  const otherId = edge.sourceId === activeNode.id ? edge.targetId : edge.sourceId;
                  const direction = edge.sourceId === activeNode.id ? '→' : '←';
                  const other = nodesById.get(otherId);
                  return (
                    <li
                      key={`${edge.sourceId}-${edge.targetId}-${i}`}
                      className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-surface-secondary px-3 py-2 text-sm"
                    >
                      <span aria-hidden="true">{direction}</span>
                      <span className="font-medium text-text-primary">
                        {other ? nodeLabel(other) : shortId(otherId)}
                      </span>
                      <span className="dash-badge dash-badge--type-unknown">
                        {edge.relationshipType}
                      </span>
                      <span className="text-xs text-text-tertiary">{edge.confidence}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Stack>
        </Card>
      )}
    </Container>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col">
      <span className="text-2xl font-bold text-text-primary">{value}</span>
      <span className="text-xs uppercase tracking-wide text-text-tertiary">{label}</span>
    </div>
  );
}

export default GraphBuilder;
