import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Card, Stack, Container, Badge, Button, Input, Select, Alert,
} from '@nexus-engineering/shared';
import {
  fetchComplianceReports,
  fetchComplianceAggregations,
  fetchSoc2Mappings,
  generateComplianceReport,
  deleteComplianceReport,
  getComplianceReportDownloadUrl,
  SOC2_CATEGORIES,
  SOC2_CATEGORY_LABELS,
  VALID_REPORT_TYPES,
  VALID_REPORT_FORMATS,
  type ComplianceReport,
  type ComplianceReportType,
  type ComplianceReportFormat,
  type ComplianceAggregationResult,
  type Soc2ControlMapping,
} from '../../api/client';

const REPORT_TYPE_LABELS: Record<ComplianceReportType, string> = {
  coverage: 'Coverage Report',
  traceability: 'Traceability Report',
  audit: 'Audit Report',
  gap_analysis: 'Gap Analysis',
  soc2: 'SOC2 Compliance',
  full: 'Full Compliance Report',
};

const REPORT_FORMAT_LABELS: Record<ComplianceReportFormat, string> = {
  json: 'JSON',
  csv: 'CSV',
  pdf: 'PDF',
};

function statusBadgeVariant(status: string): string {
  if (status === 'completed') return 'success';
  if (status === 'generating') return 'warning';
  return 'critical';
}

function statusLabel(status: string): string {
  if (status === 'completed') return 'Completed';
  if (status === 'generating') return 'Generating';
  return 'Failed';
}

function formatScore(pct: number): string {
  return `${Math.round(pct * 100)}%`;
}

function coverageBarColor(pct: number): string {
  if (pct >= 80) return 'bg-success-500 dark:bg-success-400';
  if (pct >= 50) return 'bg-warning-500 dark:bg-warning-400';
  return 'bg-error-500 dark:bg-error-400';
}

function healthColor(pct: number): string {
  if (pct >= 80) return 'text-success-600 dark:text-success-400';
  if (pct >= 50) return 'text-warning-600 dark:text-warning-400';
  return 'text-error-600 dark:text-error-400';
}

function mapStatus(s: string): 'compliant' | 'non_compliant' | 'not_assessed' {
  if (s === 'compliant' || s === 'non_compliant' || s === 'not_assessed') return s;
  return 'not_assessed';
}

function statusDot(status: string): string {
  if (status === 'compliant') return 'bg-success-500';
  if (status === 'non_compliant') return 'bg-error-500';
  return 'bg-surface-tertiary';
}

/* ─── Empty / Loading / Error States ─── */

function EmptyState() {
  return (
    <Container size="lg">
      <Stack gap={6} align="center" className="pt-20">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-tertiary">
          <svg className="h-8 w-8 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <Stack gap={2} align="center">
          <p className="text-lg font-semibold text-text-primary">No compliance reports</p>
          <p className="text-sm text-text-secondary">Generate your first compliance report to get started.</p>
          <p className="text-sm text-text-tertiary">Try the SOC2 mappings tab to see control coverage.</p>
        </Stack>
      </Stack>
    </Container>
  );
}

function LoadingState() {
  return (
    <Container size="lg">
      <Stack gap={6}>
        {[0, 1, 2].map((i) => (
          <Card key={i} padding="lg" role="status" aria-busy="true">
            <Stack gap={4}>
              <div className="h-5 w-48 animate-pulse rounded-lg bg-surface-tertiary" />
              <div className="h-32 w-full animate-pulse rounded-lg bg-surface-tertiary" />
            </Stack>
          </Card>
        ))}
      </Stack>
    </Container>
  );
}

function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Container size="lg">
      <Alert variant="error" onDismiss={onRetry}>
        <strong>Error:</strong> {message}
      </Alert>
    </Container>
  );
}

/* ─── Health Overview ─── */

function HealthOverview({ data }: { data: ComplianceAggregationResult }) {
  const { summary, coverage, soc2 } = data;
  const overallPct = coverage?.overallCoveragePercent ?? 0;

  const metrics = [
    { label: 'Overall Coverage', value: formatScore(overallPct), color: healthColor(overallPct) },
    { label: 'Total Nodes', value: String(summary?.totalNodes ?? 0), color: 'text-text-primary' },
    { label: 'Total Edges', value: String(summary?.totalEdges ?? 0), color: 'text-text-primary' },
    ...(soc2
      ? [{ label: 'SOC2 Coverage', value: formatScore(soc2.totalMappings > 0 ? soc2.compliant / soc2.totalMappings : 0), color: healthColor(soc2.totalMappings > 0 ? soc2.compliant / soc2.totalMappings : 0) }]
      : []),
  ];

  return (
    <Card padding="lg">
      <Stack gap={4}>
        <h3 className="text-base font-semibold text-text-primary">Compliance Health</h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {metrics.map((m) => (
            <div key={m.label} className={`rounded-xl p-4 ring-1 ring-inset ring-border/50 dark:ring-border/30 ${overallPct >= 80 ? 'bg-success-50 dark:bg-success-950' : overallPct >= 50 ? 'bg-warning-50 dark:bg-warning-950' : 'bg-error-50 dark:bg-error-950'}`}>
              <p className="text-xs font-medium uppercase tracking-wide text-text-tertiary">{m.label}</p>
              <p className={`mt-1 text-2xl font-bold ${m.color}`}>{m.value}</p>
            </div>
          ))}
        </div>
        <div>
          <div className="flex items-center justify-between text-xs text-text-tertiary">
            <span>Overall Compliance Coverage</span>
            <span className="font-semibold">{overallPct >= 0.8 ? 'Healthy' : overallPct >= 0.5 ? 'Needs Attention' : 'Critical'}</span>
          </div>
          <div className="mt-1.5 h-3 w-full overflow-hidden rounded-full bg-surface-tertiary dark:bg-surface-quaternary">
            <div
              className={`h-full rounded-full transition-all duration-700 ${coverageBarColor(overallPct)}`}
              style={{ width: `${overallPct * 100}%` }}
              role="progressbar"
              aria-valuenow={Math.round(overallPct * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Overall coverage: ${Math.round(overallPct * 100)}%`}
            />
          </div>
        </div>
      </Stack>
    </Card>
  );
}

/* ─── Report List ─── */

function ReportList({
  reports,
  onGenerate,
  onDelete,
}: {
  reports: ComplianceReport[];
  onGenerate: () => void;
  onDelete: (id: string) => void;
}) {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDownload = (report: ComplianceReport) => {
    if (report.file_path || report.status !== 'completed') return;
    const url = getComplianceReportDownloadUrl(report.id);
    window.open(url, '_blank', 'noopener');
  };

  const grouped = useMemo(() => {
    const map = new Map<string, ComplianceReport[]>();
    for (const r of reports) {
      const key = r.report_type;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return map;
  }, [reports]);

  if (reports.length === 0) return <EmptyState />;

  return (
    <Container size="lg">
      <Stack gap={6}>
        <div className="flex items-center justify-between">
          <Stack gap={1}>
            <h2 className="text-2xl font-bold text-text-primary">Compliance Reports</h2>
            <p className="text-sm text-text-secondary">{reports.length} report{reports.length !== 1 ? 's' : ''} generated</p>
          </Stack>
          <Button variant="primary" onClick={onGenerate}>
            + New Report
          </Button>
        </div>

        <Stack gap={4}>
          {Array.from(grouped.entries()).map(([type, items]) => (
            <Card key={type} padding="lg">
              <Stack gap={4}>
                <div className="flex items-center gap-2">
                  <Badge variant="info">{REPORT_TYPE_LABELS[type as ComplianceReportType] ?? type}</Badge>
                  <Badge variant="secondary">{items.length}</Badge>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm" role="table" aria-label={`${type} reports`}>
                    <thead>
                      <tr className="border-b border-border text-xs uppercase tracking-wide text-text-tertiary">
                        <th className="pb-2 pr-4 font-medium" scope="col">Title</th>
                        <th className="pb-2 pr-4 font-medium" scope="col">Format</th>
                        <th className="pb-2 pr-4 font-medium" scope="col">Status</th>
                        <th className="pb-2 pr-4 font-medium" scope="col">Created</th>
                        <th className="pb-2 pr-4 font-medium" scope="col">Completed</th>
                        <th className="pb-2 font-medium" scope="col">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {items.map((r) => (
                        <tr key={r.id} className="hover:bg-surface-secondary/50">
                          <td className="py-3 pr-4 font-medium text-text-primary">{r.title}</td>
                          <td className="py-3 pr-4">
                            <Badge variant="info">{REPORT_FORMAT_LABELS[r.format]}</Badge>
                          </td>
                          <td className="py-3 pr-4">
                            <Badge variant={statusBadgeVariant(r.status)}>{statusLabel(r.status)}</Badge>
                          </td>
                          <td className="py-3 pr-4 text-text-secondary">
                            {new Date(r.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 pr-4 text-text-secondary">
                            {r.completed_at ? new Date(r.completed_at).toLocaleDateString() : '—'}
                          </td>
                          <td className="py-3">
                            <Stack direction="row" gap={2}>
                              {r.status === 'completed' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  icon={<svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>}
                                  onClick={() => handleDownload(r)}
                                  aria-label={`Download ${r.title}`}
                                >
                                  Download
                                </Button>
                              )}
                              {r.status !== 'generating' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  icon={<svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>}
                                  onClick={() => setDeleteId(r.id)}
                                  aria-label={`Delete ${r.title}`}
                                >
                                  Delete
                                </Button>
                              )}
                            </Stack>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Stack>
            </Card>
          ))}
        </Stack>

        {deleteId && (
          <Card padding="lg">
            <Stack gap={4}>
              <p className="text-sm text-text-primary">Are you sure you want to delete this report? This action cannot be undone.</p>
              <Stack direction="row" gap={3}>
                <Button variant="danger" onClick={() => { onDelete(deleteId); setDeleteId(null); }}>Confirm Delete</Button>
                <Button variant="ghost" onClick={() => setDeleteId(null)}>Cancel</Button>
              </Stack>
            </Stack>
          </Card>
        )}
      </Stack>
    </Container>
  );
}

/* ─── Generate Report Modal ─── */

interface GenerateModalProps {
  open: boolean;
  onClose: () => void;
  onGenerate: (req: { title: string; reportType: ComplianceReportType; format: ComplianceReportFormat }) => void;
  generating: boolean;
}

function GenerateModal({ open, onClose, onGenerate, generating }: GenerateModalProps) {
  const [title, setTitle] = useState('');
  const [reportType, setReportType] = useState<ComplianceReportType>('coverage');
  const [format, setFormat] = useState<ComplianceReportFormat>('pdf');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!title.trim()) { setError('Report title is required'); return; }
    onGenerate({ title: title.trim(), reportType, format });
    setTitle('');
    setError(null);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" role="dialog" aria-modal="true" aria-label="Generate compliance report">
      <div className="w-full max-w-md rounded-2xl bg-surface-primary p-6 shadow-xl ring-1 ring-border">
        <Stack gap={5}>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-text-primary">Generate Report</h3>
            <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </Button>
          </div>

          <Input
            label="Report Title"
            placeholder="e.g., Q3 SOC2 Readiness"
            value={title}
            onChange={(e) => { setTitle(e.target.value); setError(null); }}
            error={error ? 'Title is required' : undefined}
            fullWidth
          />

          <Select
            label="Report Type"
            value={reportType}
            onChange={(e) => setReportType(e.target.value as ComplianceReportType)}
          >
            {VALID_REPORT_TYPES.map((t) => (
              <option key={t} value={t}>{REPORT_TYPE_LABELS[t]}</option>
            ))}
          </Select>

          <Select
            label="Format"
            value={format}
            onChange={(e) => setFormat(e.target.value as ComplianceReportFormat)}
          >
            {VALID_REPORT_FORMATS.map((f) => (
              <option key={f} value={f}>{REPORT_FORMAT_LABELS[f]}</option>
            ))}
          </Select>

          <Stack direction="row" gap={3} className="mt-2">
            <Button variant="primary" onClick={handleSubmit} loading={generating} disabled={generating}>
              {generating ? 'Generating...' : 'Generate'}
            </Button>
            <Button variant="ghost" onClick={onClose} disabled={generating}>Cancel</Button>
          </Stack>
        </Stack>
      </div>
    </div>
  );
}

/* ─── SOC2 Mappings Panel ─── */

function Soc2MappingsPanel({ mappings }: { mappings: Soc2ControlMapping[] }) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeStatus, setActiveStatus] = useState<string>('all');

  const stats = useMemo(() => {
    const byCategory: Record<string, { total: number; compliant: number; nonCompliant: number; notAssessed: number }> = {};
    const byStatus: Record<string, number> = {};
    for (const m of mappings) {
      if (!byCategory[m.category]) byCategory[m.category] = { total: 0, compliant: 0, nonCompliant: 0, notAssessed: 0 };
      byCategory[m.category].total++;
      byCategory[m.category][m.status]++;
      byStatus[m.status] = (byStatus[m.status] || 0) + 1;
    }
    return { byCategory, byStatus };
  }, [mappings]);

  const filtered = useMemo(() => {
    return mappings.filter((m) => {
      if (activeCategory !== 'all' && m.category !== activeCategory) return false;
      if (activeStatus !== 'all' && m.status !== activeStatus) return false;
      return true;
    });
  }, [mappings, activeCategory, activeStatus]);

  const hasData = mappings.length > 0;
  const totalMappings = mappings.length;
  const compliantCount = stats.byStatus['compliant'] || 0;
  const coveragePct = totalMappings > 0 ? compliantCount / totalMappings : 0;

  return (
    <Container size="lg">
      <Stack gap={6}>
        <Stack gap={1}>
          <h2 className="text-2xl font-bold text-text-primary">SOC2 Control Mappings</h2>
          <p className="text-sm text-text-secondary">
            {totalMappings} controls mapped across {Object.keys(stats.byCategory).length} categories
          </p>
        </Stack>

        {/* Coverage summary */}
        <Card padding="lg">
          <Stack gap={4}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-text-primary">Coverage Summary</h3>
              <Badge variant={coveragePct >= 0.8 ? 'success' : coveragePct >= 0.5 ? 'warning' : 'critical'}>
                {formatScore(coveragePct)} compliant
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-success-600 dark:text-success-400">{compliantCount}</p>
                <p className="text-xs text-text-tertiary">Compliant</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-error-600 dark:text-error-400">{stats.byStatus['non_compliant'] || 0}</p>
                <p className="text-xs text-text-tertiary">Non-Compliant</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-text-tertiary">{stats.byStatus['not_assessed'] || 0}</p>
                <p className="text-xs text-text-tertiary">Not Assessed</p>
              </div>
            </div>
          </Stack>
        </Card>

        {/* Category grid */}
        {hasData && (
          <Card padding="lg">
            <Stack gap={4}>
              <h3 className="text-base font-semibold text-text-primary">Category Breakdown</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(stats.byCategory).map(([cat, counts]) => {
                  const pct = counts.total > 0 ? counts.compliant / counts.total : 0;
                  return (
                    <button
                      key={cat}
                      className="rounded-xl p-4 text-left ring-1 ring-border transition-colors hover:bg-surface-secondary dark:ring-border/30"
                      onClick={() => setActiveCategory(activeCategory === cat ? 'all' : cat)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-text-primary">{SOC2_CATEGORY_LABELS[cat as keyof typeof SOC2_CATEGORY_LABELS] ?? cat}</span>
                        <Badge variant={pct >= 0.8 ? 'success' : pct >= 0.5 ? 'warning' : 'critical'}>
                          {formatScore(pct)}
                        </Badge>
                      </div>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-tertiary dark:bg-surface-quaternary">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${coverageBarColor(pct)}`}
                          style={{ width: `${pct * 100}%` }}
                        />
                      </div>
                      <div className="mt-2 flex items-center gap-3 text-xs text-text-secondary">
                        <span>{counts.compliant} compliant</span>
                        <span>{counts.nonCompliant} non-compliant</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Stack>
          </Card>
        )}

        {/* Filtered mappings table */}
        <Card padding="lg">
          <Stack gap={4}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-base font-semibold text-text-primary">Controls</h3>
              <Stack direction="row" gap={3}>
                <Select value={activeCategory} onChange={(e) => setActiveCategory(e.target.value)}>
                  <option value="all">All Categories</option>
                  {SOC2_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}: {SOC2_CATEGORY_LABELS[c]}</option>
                  ))}
                </Select>
                <Select value={activeStatus} onChange={(e) => setActiveStatus(e.target.value)}>
                  <option value="all">All Status</option>
                  <option value="compliant">Compliant</option>
                  <option value="non_compliant">Non-Compliant</option>
                  <option value="not_assessed">Not Assessed</option>
                </Select>
              </Stack>
            </div>

            {filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-text-secondary">No controls match the current filters.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm" role="table" aria-label="SOC2 controls">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase tracking-wide text-text-tertiary">
                      <th className="pb-2 pr-4 font-medium" scope="col">Category</th>
                      <th className="pb-2 pr-4 font-medium" scope="col">Artifact Type</th>
                      <th className="pb-2 pr-4 font-medium" scope="col">Artifact ID</th>
                      <th className="pb-2 pr-4 font-medium" scope="col">Status</th>
                      <th className="pb-2 font-medium" scope="col">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((m) => (
                      <tr key={m.id} className="hover:bg-surface-secondary/50">
                        <td className="py-2.5 pr-4">
                          <Stack direction="row" gap={2} align="center">
                            <div className={`h-2.5 w-2.5 rounded-full ${statusDot(m.status)}`} />
                            <span className="font-medium text-text-primary">{m.category}</span>
                          </Stack>
                        </td>
                        <td className="py-2.5 pr-4">
                          <Badge variant="info">{m.artifact_type}</Badge>
                        </td>
                        <td className="py-2.5 pr-4 font-mono text-xs text-text-secondary">{m.artifact_id}</td>
                        <td className="py-2.5 pr-4">
                          <Badge variant={m.status === 'compliant' ? 'success' : m.status === 'non_compliant' ? 'critical' : 'secondary'}>
                            {m.status.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="py-2.5 text-text-secondary truncate max-w-[200px]">{m.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}

/* ─── Main Dashboard ─── */

export function ComplianceDashboard() {
  type Tab = 'overview' | 'reports' | 'soc2';
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [reports, setReports] = useState<ComplianceReport[]>([]);
  const [aggregation, setAggregation] = useState<ComplianceAggregationResult | null>(null);
  const [soc2Mappings, setSoc2Mappings] = useState<Soc2ControlMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [reportsRes, aggRes] = await Promise.all([
        fetchComplianceReports({ limit: 100 }),
        fetchComplianceAggregations(),
      ]);
      setReports(reportsRes.data);
      setAggregation(aggRes);

      const mappings = await fetchSoc2Mappings({ limit: 500 });
      setSoc2Mappings(mappings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Poll for generating reports
  useEffect(() => {
    const hasGenerating = reports.some((r) => r.status === 'generating');
    if (!hasGenerating || generating) return;

    pollTimer.current = setInterval(async () => {
      try {
        const res = await fetchComplianceReports({ limit: 100 });
        setReports(res.data);
        const remaining = res.data.filter((r) => r.status === 'generating');
        if (remaining.length === 0 && pollTimer.current) {
          clearInterval(pollTimer.current);
          pollTimer.current = null;
          await loadData();
        }
      } catch {
        // ignore poll errors
      }
    }, 3000);

    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, [reports, generating, loadData]);

  const handleGenerate = async (req: { title: string; reportType: ComplianceReportType; format: ComplianceReportFormat }) => {
    setGenerating(true);
    try {
      const newReport = await generateComplianceReport(req);
      setReports((prev) => [newReport, ...prev]);
      setShowModal(false);
      // Start polling
      if (pollTimer.current) clearInterval(pollTimer.current);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteComplianceReport(id);
      setReports((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete report');
    }
  };

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'reports', label: 'Reports', count: reports.length },
    { key: 'soc2', label: 'SOC2 Controls' },
  ];

  if (loading) return <LoadingState />;
  if (error) return <ErrorBanner message={error} onRetry={loadData} />;

  const hasAnyData = reports.length > 0 || aggregation || soc2Mappings.length > 0;
  if (!hasAnyData) return <EmptyState />;

  return (
    <Container size="lg">
      <Stack gap={6}>
        {/* Header */}
        <Stack gap={2}>
          <h2 className="text-2xl font-bold text-text-primary">Compliance Dashboard</h2>
          <p className="text-sm text-text-secondary">
            Monitor compliance coverage, generate reports, and track SOC2 control mappings.
          </p>
        </Stack>

        {/* Tab bar */}
        <div className="flex gap-0 border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-text-tertiary hover:text-text-secondary'
              }`}
              onClick={() => setActiveTab(tab.key)}
              role="tab"
              aria-selected={activeTab === tab.key}
            >
              {tab.label}
              {tab.count !== undefined && (
                <Badge variant="secondary" className="ml-1.5">{tab.count}</Badge>
              )}
              {activeTab === tab.key && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 dark:bg-primary-400" />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'overview' && aggregation && (
          <Stack gap={6}>
            <HealthOverview data={aggregation} />
            <Card padding="lg">
              <Stack gap={4}>
                <h3 className="text-base font-semibold text-text-primary">Recent Reports</h3>
                {reports.length === 0 ? (
                  <p className="text-sm text-text-secondary">No reports yet. Switch to the Reports tab to generate one.</p>
                ) : (
                  <Stack gap={3}>
                    {reports.slice(0, 5).map((r) => (
                      <div key={r.id} className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-surface-secondary/50">
                        <Stack direction="row" gap={3} align="center">
                          <Badge variant="info">{REPORT_TYPE_LABELS[r.report_type]}</Badge>
                          <Badge variant="secondary">{REPORT_FORMAT_LABELS[r.format]}</Badge>
                          <span className="font-medium text-text-primary">{r.title}</span>
                        </Stack>
                        <Badge variant={statusBadgeVariant(r.status)}>{statusLabel(r.status)}</Badge>
                      </div>
                    ))}
                  </Stack>
                )}
              </Stack>
            </Card>
          </Stack>
        )}

        {activeTab === 'reports' && (
          <ReportList reports={reports} onGenerate={() => setShowModal(true)} onDelete={handleDelete} />
        )}

        {activeTab === 'soc2' && <Soc2MappingsPanel mappings={soc2Mappings} />}

        {/* Generate Modal */}
        <GenerateModal
          open={showModal}
          onClose={() => setShowModal(false)}
          onGenerate={handleGenerate}
          generating={generating}
        />
      </Stack>
    </Container>
  );
}
