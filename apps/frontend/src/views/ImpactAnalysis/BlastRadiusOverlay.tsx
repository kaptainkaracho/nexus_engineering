import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { TraceGraphData, ImpactAnalysisData } from '../../api/client';

export type BlastRadiusLevel = 'direct' | 'indirect' | 'transitive' | 'none';

export const BLAST_RADIUS_COLORS: Record<BlastRadiusLevel, string> = {
  direct: '#EF4444', // red — directly impacted
  indirect: '#F59E0B', // yellow — indirectly impacted
  transitive: '#FB923C', // orange — transitively impacted
  none: '#22C55E', // green — no impact
};

export const BLAST_RADIUS_LABELS: Record<BlastRadiusLevel, string> = {
  direct: 'Direct impact',
  indirect: 'Indirect impact',
  transitive: 'Transitive impact',
  none: 'No impact',
};

interface SimNode extends d3.SimulationNodeDatum {
  id: string;
  title?: string;
  level: BlastRadiusLevel;
  confidenceScore?: number;
}

interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  relationshipType: string;
  confidenceScore: number;
}

interface BlastRadiusOverlayProps {
  graph: TraceGraphData;
  impact: ImpactAnalysisData | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function buildLevelMap(impact: ImpactAnalysisData | null): Map<string, BlastRadiusLevel> {
  const map = new Map<string, BlastRadiusLevel>();
  if (!impact) return map;
  for (const artifact of impact.artifacts) {
    map.set(artifact.id, artifact.impactLevel);
  }
  for (const node of impact.impactGraph.nodes) {
    if (!map.has(node.id)) map.set(node.id, 'indirect');
  }
  return map;
}

export function BlastRadiusOverlay({ graph, impact, selectedId, onSelect }: BlastRadiusOverlayProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const levelMap = buildLevelMap(impact);

  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const { nodes: rawNodes, edges: rawEdges } = graph;
    if (!rawNodes || rawNodes.length === 0) return;

    const width = svgEl.clientWidth || 1000;
    const height = 520;

    const nodes: SimNode[] = rawNodes.map((n) => ({
      id: n.id,
      title: n.title,
      level: levelMap.get(n.id) ?? 'none',
      confidenceScore: n.confidenceScore,
    }));
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    const links: SimLink[] = rawEdges
      .filter((e) => nodeMap.has(e.sourceId) && nodeMap.has(e.targetId))
      .map((e) => ({
        source: e.sourceId,
        target: e.targetId,
        relationshipType: e.relationshipType,
        confidenceScore: e.confidenceScore,
      }));

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();
    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const g = svg.append('g');

    const link = g
      .append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#CBD5E1')
      .attr('stroke-opacity', 0.5)
      .attr('stroke-width', 1.5);

    const nodeGroup = g
      .append('g')
      .attr('class', 'nodes')
      .selectAll<SVGGElement, SimNode>('g')
      .data(nodes)
      .join('g')
      .style('cursor', 'pointer')
      .on('click', (_event, d) => onSelect(d.id));

    nodeGroup
      .append('circle')
      .attr('r', (d) => (d.id === selectedId ? 16 : 11))
      .attr('fill', (d) => BLAST_RADIUS_COLORS[d.level])
      .attr('stroke', (d) => (d.id === selectedId ? '#0F172A' : '#FFFFFF'))
      .attr('stroke-width', (d) => (d.id === selectedId ? 3 : 2));

    nodeGroup
      .append('text')
      .text((d) => (d.title ? d.title : d.id).slice(0, 18))
      .attr('x', 16)
      .attr('y', 4)
      .attr('font-size', '11px')
      .attr('fill', '#334155')
      .attr('pointer-events', 'none');

    nodeGroup.append('title').text((d) => `${d.title ?? d.id}\n${BLAST_RADIUS_LABELS[d.level]}`);

    const simulation = d3
      .forceSimulation<SimNode>(nodes)
      .force(
        'link',
        d3
          .forceLink<SimNode, SimLink>(links as unknown as SimLink[])
          .id((d) => d.id)
          .distance(90)
          .strength(0.4)
      )
      .force('charge', d3.forceManyBody().strength(-320))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide(28));

    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as SimNode).x ?? 0)
        .attr('y1', (d) => (d.source as SimNode).y ?? 0)
        .attr('x2', (d) => (d.target as SimNode).x ?? 0)
        .attr('y2', (d) => (d.target as SimNode).y ?? 0);
      nodeGroup.attr('transform', (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.4, 3])
      .on('zoom', (event) => g.attr('transform', event.transform));
    svg.call(zoom as unknown as (selection: d3.Selection<SVGSVGElement, unknown, null, undefined>) => void);

    return () => {
      simulation.stop();
    };
  }, [graph, impact, selectedId, onSelect, levelMap]);

  return (
    <svg
      ref={svgRef}
      role="img"
      aria-label="Dependency graph with blast radius heat-map overlay"
      className="w-full rounded-xl border border-border bg-surface-primary"
      style={{ height: 520 }}
    />
  );
}
