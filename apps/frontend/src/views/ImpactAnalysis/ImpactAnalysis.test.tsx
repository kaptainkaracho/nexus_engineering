import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { buildLevelMap, BLAST_RADIUS_COLORS, BLAST_RADIUS_LABELS } from './BlastRadiusOverlay';
import { ImpactDiffView } from './ImpactDiffView';
import type { ImpactAnalysisData } from '../../api/client';

const baseImpact: ImpactAnalysisData = {
  scope: { artifactIds: ['a-1'] },
  artifactId: 'a-1',
  confidenceThreshold: 0.4,
  artifacts: [
    { id: 'a-1', type: 'architecture', title: 'Auth Service', impactLevel: 'direct', relationshipType: 'implements', confidenceScore: 1 },
    { id: 'a-2', type: 'feature', title: 'Login Flow', impactLevel: 'indirect', relationshipType: 'satisfies', confidenceScore: 0.8 },
  ],
  impactGraph: {
    nodes: [
      { id: 'a-1', type: 'architecture', title: 'Auth Service', confidenceScore: 1 },
      { id: 'a-2', type: 'feature', title: 'Login Flow', confidenceScore: 0.8 },
      { id: 'a-3', type: 'result', title: 'Auth Test', confidenceScore: 0.6 },
    ],
    edges: [],
  },
  chains: [],
  summary: { totalAffected: 2, directCount: 1, indirectCount: 1, transitiveCount: 0, minConfidence: 0.8, maxConfidence: 1 },
};

describe('buildLevelMap', () => {
  it('returns empty map for null impact', () => {
    expect(buildLevelMap(null).size).toBe(0);
  });

  it('maps artifact impact levels', () => {
    const map = buildLevelMap(baseImpact);
    expect(map.get('a-1')).toBe('direct');
    expect(map.get('a-2')).toBe('indirect');
  });

  it('infers indirect for impactGraph nodes not present as artifacts', () => {
    const map = buildLevelMap(baseImpact);
    expect(map.get('a-3')).toBe('indirect');
  });
});

describe('BLAST_RADIUS color scale', () => {
  it('uses green -> yellow -> red ramp', () => {
    expect(BLAST_RADIUS_COLORS.none).toBe('#22C55E');
    expect(BLAST_RADIUS_COLORS.indirect).toBe('#F59E0B');
    expect(BLAST_RADIUS_COLORS.direct).toBe('#EF4444');
    expect(BLAST_RADIUS_COLORS.transitive).toBe('#FB923C');
    expect(BLAST_RADIUS_LABELS.direct).toBe('Direct impact');
  });
});

describe('ImpactDiffView', () => {
  it('prompts to capture a baseline when none exists', () => {
    render(<ImpactDiffView before={null} after={baseImpact} onCaptureBaseline={() => {}} />);
    expect(screen.getByText(/No baseline captured yet/i)).toBeTruthy();
  });

  it('computes added / removed / unchanged counts', () => {
    const before: ImpactAnalysisData = {
      ...baseImpact,
      artifacts: [baseImpact.artifacts[0]],
      summary: { ...baseImpact.summary, totalAffected: 1, indirectCount: 0 },
    };
    const after: ImpactAnalysisData = {
      ...baseImpact,
      artifacts: [baseImpact.artifacts[0], baseImpact.artifacts[1]],
      summary: { ...baseImpact.summary, totalAffected: 2, indirectCount: 1 },
    };
    render(<ImpactDiffView before={before} after={after} onCaptureBaseline={() => {}} />);
    expect(screen.getByText('Added').parentElement?.querySelector('.text-3xl')?.textContent).toBe('1');
    expect(screen.getByText('Removed').parentElement?.querySelector('.text-3xl')?.textContent).toBe('0');
    expect(screen.getByText('Unchanged').parentElement?.querySelector('.text-3xl')?.textContent).toBe('1');
  });
});
