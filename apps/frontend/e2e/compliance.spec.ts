import { test, expect } from './fixtures';
import type { ComplianceReport, ComplianceAggregation, Soc2ControlMapping } from './fixtures';

const MOCK_REPORTS: ComplianceReport[] = [
  { id: 'report_1', title: 'Q3 SOC2 Readiness', report_type: 'soc2', format: 'pdf', status: 'completed', created_at: '2025-07-15T10:00:00Z', completed_at: '2025-07-15T10:05:00Z', created_by: 'admin-1', file_path: '/tmp/reports/report_1.pdf' },
  { id: 'report_3', title: 'Gap Analysis W3', report_type: 'gap_analysis', format: 'csv', status: 'generating', created_at: '2025-07-16T12:00:00Z', completed_at: null, created_by: 'admin-1', file_path: null },
];

const MOCK_AGGREGATION: ComplianceAggregation = {
  generatedAt: '2025-07-16T12:00:00Z',
  summary: { totalNodes: 150, totalEdges: 320 },
  coverage: { overallCoveragePercent: 0.85, byType: { requirement: 0.9, test: 0.75, adr: 0.8 } },
  soc2: { totalMappings: 20, compliant: 15, nonCompliant: 3, notAssessed: 2, byCategory: { CC1: { compliant: 1, nonCompliant: 0, notAssessed: 0 }, CC2: { compliant: 0, nonCompliant: 1, notAssessed: 0 } } },
};

const MOCK_SOC2: Soc2ControlMapping[] = [
  { id: 'map_1', category: 'CC1', artifact_type: 'requirement', artifact_id: 'req-001', status: 'compliant', notes: 'Covered by policy', created_at: '2025-07-01T00:00:00Z', updated_at: '2025-07-01T00:00:00Z' },
  { id: 'map_2', category: 'CC2', artifact_type: 'adr', artifact_id: 'adr-005', status: 'non_compliant', notes: 'Missing procedure', created_at: '2025-07-01T00:00:00Z', updated_at: '2025-07-01T00:00:00Z' },
  { id: 'map_3', category: 'CC3', artifact_type: 'spec', artifact_id: 'spec-012', status: 'not_assessed', notes: null, created_at: '2025-07-01T00:00:00Z', updated_at: '2025-07-01T00:00:00Z' },
];

const NEW_REPORT: ComplianceReport = {
  id: 'report_new_1', title: 'New Test Report', report_type: 'coverage', format: 'pdf', status: 'generating', created_at: new Date().toISOString(), completed_at: null, created_by: 'admin-1', file_path: null,
};

test.describe('Compliance Dashboard', () => {
  test.beforeEach(({ api }) => {
    api.complianceReports({ data: MOCK_REPORTS, total: MOCK_REPORTS.length, hasMore: false });
    api.complianceAggregations(MOCK_AGGREGATION);
    api.soc2Mappings(MOCK_SOC2);
  });

  test('overview tab shows health metrics', async ({ page }) => {
    await page.goto('/#compliance-dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Compliance Dashboard')).toBeVisible();
    await expect(page.getByText('Compliance Health')).toBeVisible();
    await expect(page.getByText('85%')).toBeVisible();
    await expect(page.getByText('150')).toBeVisible();
    await expect(page.getByText('320')).toBeVisible();
  });

  test('reports tab lists reports', async ({ page }) => {
    await page.goto('/#compliance-dashboard');
    await page.waitForLoadState('networkidle');
    await page.getByRole('tab', { name: /^Reports/ }).click();
    await expect(page.getByText('Compliance Reports')).toBeVisible();
    await expect(page.getByText('Q3 SOC2 Readiness')).toBeVisible();
    await expect(page.getByText('Gap Analysis W3')).toBeVisible();
  });

  test('new report button opens generate dialog', async ({ page, api }) => {
    api.createComplianceReport(NEW_REPORT);
    await page.goto('/#compliance-dashboard');
    await page.waitForLoadState('networkidle');
    await page.getByRole('tab', { name: /^Reports/ }).click();
    await page.getByRole('button', { name: '+ New Report' }).click();
    await expect(page.getByRole('dialog', { name: 'Generate compliance report' })).toBeVisible();
    await page.getByLabel('Report Title').fill('New Test Report');
    await page.getByRole('button', { name: 'Generate' }).click();
    await expect(page.getByText('New Test Report')).toBeVisible({ timeout: 8_000 });
  });

  test('deletes a compliance report', async ({ page, api }) => {
    api.deleteComplianceReport('report_1');
    await page.goto('/#compliance-dashboard');
    await page.waitForLoadState('networkidle');
    await page.getByRole('tab', { name: /^Reports/ }).click();
    await page.getByRole('button', { name: /Delete.*Q3 SOC2/ }).click();
    await expect(page.getByRole('dialog', { name: 'Confirm delete' })).toBeVisible();
    await page.getByRole('button', { name: 'Delete', exact: true }).last().click();
  });

  test('soc2 tab shows control mappings', async ({ page }) => {
    await page.goto('/#compliance-dashboard');
    await page.waitForLoadState('networkidle');
    await page.getByRole('tab', { name: 'SOC2 Controls' }).click();
    await expect(page.getByRole('heading', { name: 'SOC2 Control Mappings' })).toBeVisible();
    await expect(page.getByText('Coverage Summary')).toBeVisible();
    await expect(page.getByText(/controls mapped/)).toBeVisible();
  });

  test('no uncaught page errors across all tabs', async ({ page, pageErrors }) => {
    await page.goto('/#compliance-dashboard');
    await page.waitForLoadState('networkidle');
    const tabs = ['Overview', 'Reports', 'SOC2 Controls'];
    for (const tabLabel of tabs) {
      await page.getByRole('tab', { name: tabLabel }).click();
      await page.waitForTimeout(500);
    }
    expect(pageErrors).toEqual([]);
  });
});
