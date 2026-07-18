import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { GraphBuilder } from './index';
import { fetchTraceabilityGraph } from '../../api/client';
import type { GraphEdge, GraphNode, TraceabilityGraph } from '../../api/client';

vi.mock('../../api/client', () => ({
  fetchTraceabilityGraph: vi.fn(),
}));

const nodes: GraphNode[] = [
  { id: 'req-1', type: 'requirement', title: 'Auth Requirement' },
  { id: 'arch-1', type: 'architectureModel', name: 'Auth Architecture' },
  { id: 'comp-1', type: 'softwareComponent', name: 'Auth Service' },
  { id: 'test-1', type: 'testCase', name: 'Auth Test' },
];

const edges: GraphEdge[] = [
  { sourceId: 'req-1', targetId: 'arch-1', relationshipType: 'satisfies', confidence: 'high' },
  { sourceId: 'arch-1', targetId: 'comp-1', relationshipType: 'tracesTo', confidence: 'high' },
  { sourceId: 'req-1', targetId: 'test-1', relationshipType: 'verifies', confidence: 'medium' },
];

function graphResponse(): TraceabilityGraph {
  return {
    nodes,
    edges,
    totalNodes: nodes.length,
    totalEdges: edges.length,
  };
}

beforeEach(() => {
  vi.mocked(fetchTraceabilityGraph).mockReset();
  Element.prototype.scrollIntoView = vi.fn();
});

describe('GraphBuilder', () => {
  it('shows a loading state while the graph is fetched', () => {
    vi.mocked(fetchTraceabilityGraph).mockReturnValue(new Promise(() => {}));
    render(<GraphBuilder />);
    expect(screen.getByText('Loading traceability graph…')).toBeInTheDocument();
  });

  it('renders an empty state when there are no nodes', async () => {
    vi.mocked(fetchTraceabilityGraph).mockResolvedValue({
      nodes: [],
      edges: [],
      totalNodes: 0,
      totalEdges: 0,
    });
    render(<GraphBuilder />);
    expect(await screen.findByText('No traceability data yet')).toBeInTheDocument();
  });

  it('renders nodes, edges and stats from the graph', async () => {
    vi.mocked(fetchTraceabilityGraph).mockResolvedValue(graphResponse());
    render(<GraphBuilder />);
    expect(await screen.findByText('Auth Requirement')).toBeInTheDocument();
    expect(screen.getByText('Auth Architecture')).toBeInTheDocument();
    expect(screen.getByLabelText(/Auth Requirement — Requirements/)).toBeInTheDocument();
    const edges = document.querySelectorAll('svg line');
    expect(edges.length).toBe(3);
  });

  it('selects a node on click and shows its trace links', async () => {
    vi.mocked(fetchTraceabilityGraph).mockResolvedValue(graphResponse());
    render(<GraphBuilder />);
    const node = await screen.findByLabelText(/Auth Requirement — Requirements/);
    fireEvent.click(node);
    expect(node).toHaveAttribute('aria-pressed', 'true');
    const detail = await screen.findByLabelText('Connected trace links');
    const { getAllByText } = within(detail);
    expect(getAllByText('satisfies').length).toBeGreaterThan(0);
    expect(getAllByText('verifies').length).toBeGreaterThan(0);
  });

  it('highlights the deep-linked node via selectedId', async () => {
    vi.mocked(fetchTraceabilityGraph).mockResolvedValue(graphResponse());
    render(<GraphBuilder selectedId="arch-1" />);
    const node = await screen.findByLabelText(/Auth Architecture — Architecture \(selected\)/);
    expect(node).toHaveAttribute('aria-pressed', 'true');
    const detail = await screen.findByLabelText('Connected trace links');
    expect(within(detail).getByText('tracesTo')).toBeInTheDocument();
  });

  it('warns when the deep-linked artifact is not in the graph', async () => {
    vi.mocked(fetchTraceabilityGraph).mockResolvedValue(graphResponse());
    render(<GraphBuilder selectedId="missing-id" />);
    expect(
      await screen.findByText(/is not part of the current traceability graph/i),
    ).toBeInTheDocument();
  });
});
