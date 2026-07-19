import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Container, Stack, Card } from '@nexus-engineering/shared';
import { fetchTraceGraph } from '../../api/client';
import type { TraceGraphData } from '../../api/client';

const NODE_COLORS: Record<string, string> = {
  requirement: '#3b82f6',
  architectureModel: '#8b5cf6',
  softwareComponent: '#10b981',
  testCase: '#f59e0b',
};

const LINK_COLORS: Record<string, string> = {
  verifies: '#22c55e',
  satisfies: '#3b82f6',
  tracesTo: '#8b5cf6',
  dependsOn: '#f59e0b',
  refines: '#ec4899',
  conflictsWith: '#ef4444',
};

const NODE_LABELS: Record<string, string> = {
  requirement: 'Req',
  architectureModel: 'Arch',
  softwareComponent: 'Comp',
  testCase: 'Test',
};

interface SimNode {
  id: string;
  type: string;
  title?: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface SimLink {
  sourceId: string;
  targetId: string;
  relationshipType: string;
  confidence: string;
}

export function TraceGraph() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [data, setData] = useState<TraceGraphData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTraceGraph().then((graph) => {
      setData(graph);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!data || !svgRef.current) return;

    const { nodes: rawNodes, edges: rawEdges } = data;

    const nodes: SimNode[] = rawNodes.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
    }));

    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    const links: SimLink[] = rawEdges
      .filter((e) => nodeMap.has(e.sourceId) && nodeMap.has(e.targetId))
      .map((e) => ({
        sourceId: e.sourceId,
        targetId: e.targetId,
        relationshipType: e.relationshipType,
        confidence: e.confidence,
      }));

    if (nodes.length === 0) return;

    const width = svgRef.current.clientWidth;
    const height = 600;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const g = svg.append('g');

    const linkElements = g
      .append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', (d) => LINK_COLORS[d.relationshipType] ?? '#6b7280')
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.6);

    const drag = d3
      .drag<SVGGElement, SimNode>()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    const nodeGroup = g.append('g').attr('class', 'nodes').selectAll('g').data(nodes).join('g');

    nodeGroup.call(drag as any);

    nodeGroup
      .append('circle')
      .attr('r', 8)
      .attr('fill', (d) => NODE_COLORS[d.type] ?? '#6b7280')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    nodeGroup
      .append('text')
      .text((d) => d.title ?? `${NODE_LABELS[d.type] ?? d.type}:${d.id.slice(0, 6)}`)
      .attr('x', 12)
      .attr('y', 4)
      .attr('font-size', '11px')
      .attr('fill', '#e2e8f0');

    nodeGroup.append('title').text((d) => d.title ?? d.id);

    const simulation = d3
      .forceSimulation<SimNode>(nodes)
      .force(
        'link',
        d3
          .forceLink<SimNode, d3.SimulationLinkDatum<SimNode>>(links as any)
          .id((d) => d.id)
          .distance(120),
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide(30));

    simulation.on('tick', () => {
      linkElements
        .attr('x1', (d: any) => (d.source as SimNode).x!)
        .attr('y1', (d: any) => (d.source as SimNode).y!)
        .attr('x2', (d: any) => (d.target as SimNode).x!)
        .attr('y2', (d: any) => (d.target as SimNode).y!);

      nodeGroup.attr('transform', (d) => `translate(${d.x},${d.y})`);
    });

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    return () => {
      simulation.stop();
    };
  }, [data]);

  return (
    <Container size="lg">
      <Stack gap={6}>
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Trace Graph</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Visualize traceability relationships across requirements, architecture, and tests.
          </p>
        </div>

        <Card variant="outlined" padding="lg">
          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center text-text-secondary">
              Loading graph...
            </div>
          ) : data && data.nodes.length === 0 ? (
            <div className="flex min-h-[300px] items-center justify-center text-text-secondary">
              No trace data available.
            </div>
          ) : (
            <svg
              ref={svgRef}
              className="h-[600px] w-full rounded border border-border-secondary bg-bg-secondary"
            />
          )}
        </Card>
      </Stack>
    </Container>
  );
}

export default TraceGraph;
