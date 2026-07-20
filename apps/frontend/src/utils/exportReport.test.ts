import { describe, it, expect, vi, afterEach } from 'vitest';
import { toCsv, toMarkdownImproved, copyToClipboard, getExportFilename } from './exportReport';
import type { ImpactReport } from '@nexus-engineering/shared';

const baseReport: ImpactReport = {
  summary: {
    totalAffected: 2,
    directCount: 1,
    indirectCount: 1,
    transitiveCount: 0,
    requirementCount: 1,
    featureCount: 0,
    testCount: 1,
    adrCount: 0,
    minConfidence: 0.65,
    maxConfidence: 1,
  },
  affectedRequirements: [
    {
      id: 'req-1',
      type: 'requirement',
      title: 'User can export reports',
      impactLevel: 'direct',
      relationshipType: 'implements',
      confidence: 'high',
      confidenceScore: 1,
      path: ['specs/auth'],
    },
  ],
  affectedFeatures: [],
  affectedTests: [
    {
      id: 'test-1',
      type: 'test',
      title: 'Export handler test',
      impactLevel: 'indirect',
      relationshipType: 'verifies',
      confidence: 'medium',
      confidenceScore: 0.65,
      path: ['tests'],
    },
  ],
  affectedAdrs: [],
  riskLevel: 'high',
  recommendations: [
    {
      id: 'rec-1',
      severity: 'high',
      category: 'test',
      message: 'Add regression test for CSV export',
    },
  ],
  metadata: {
    changedFiles: ['src/utils/exportReport.ts'],
    resolvedArtifactIds: ['req-1', 'test-1'],
    changeDescription: 'Add export utility',
    generatedAt: '2026-07-20T12:00:00.000Z',
  },
};

describe('toMarkdownImproved', () => {
  it('includes the report heading and risk level', () => {
    const md = toMarkdownImproved(baseReport);
    expect(md).toContain('# Impact Report');
    expect(md).toContain('HIGH');
  });

  it('renders all artifact groups with counts', () => {
    const md = toMarkdownImproved(baseReport);
    expect(md).toContain('## Requirements');
    expect(md).toContain('## Features');
    expect(md).toContain('## Tests');
    expect(md).toContain('## Architecture Decisions');
  });

  it('emits a markdown table row for each affected artifact', () => {
    const md = toMarkdownImproved(baseReport);
    expect(md).toContain('req-1');
    expect(md).toContain('User can export reports');
    expect(md).toContain('test-1');
    expect(md).toContain('Export handler test');
  });

  it('includes a recommendations section', () => {
    const md = toMarkdownImproved(baseReport);
    expect(md).toContain('## Recommendations');
    expect(md).toContain('Add regression test for CSV export');
  });

  it('shows "None affected" for empty groups', () => {
    const md = toMarkdownImproved({ ...baseReport, affectedFeatures: [] });
    expect(md).toContain('_None affected._');
  });
});

describe('toCsv', () => {
  it('includes a summary header and counts', () => {
    const csv = toCsv(baseReport);
    expect(csv).toContain('Impact Report Export');
    expect(csv).toContain('Risk Level,Total Affected,Direct,Indirect,Transitive');
    expect(csv).toContain('high,2,1,1,0');
  });

  it('emits a csv row per affected artifact', () => {
    const csv = toCsv(baseReport);
    expect(csv).toContain('req-1');
    expect(csv).toContain('test-1');
  });

  it('quotes titles that could contain commas', () => {
    const csv = toCsv({
      ...baseReport,
      affectedRequirements: [
        { ...baseReport.affectedRequirements[0], title: 'Title, with comma' },
      ],
    });
    expect(csv).toContain('"Title, with comma"');
  });
});

describe('copyToClipboard', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses the async clipboard API when available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    const ok = await copyToClipboard('hello');
    expect(ok).toBe(true);
    expect(writeText).toHaveBeenCalledWith('hello');
  });

  it('returns false when the clipboard API rejects', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    const ok = await copyToClipboard('hello');
    expect(ok).toBe(false);
  });
});

describe('getExportFilename', () => {
  it('produces dated filenames per format', () => {
    expect(getExportFilename('json')).toMatch(/^impact-report-\d{4}-\d{2}-\d{2}\.json$/);
    expect(getExportFilename('markdown')).toMatch(/^impact-report-\d{4}-\d{2}-\d{2}\.md$/);
    expect(getExportFilename('csv')).toMatch(/^impact-report-\d{4}-\d{2}-\d{2}\.csv$/);
    expect(getExportFilename('pdf')).toMatch(/^impact-report-\d{4}-\d{2}-\d{2}\.pdf$/);
  });
});
