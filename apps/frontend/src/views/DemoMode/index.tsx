import { useCallback, useEffect, useState } from 'react';
import { Button, Card, Container, Stack, Grid } from '@nexus-engineering/shared';
import { ArrowLeft, CheckCircle, ExternalLink, FileText, GitBranch, Link2, Target, AlertTriangle } from 'lucide-react';
import { RouteLoadingSkeleton } from '@nexus-engineering/shared';

interface SeedRequirement {
  id: string;
  type: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  tags: string[];
}

interface SeedADR {
  id: string;
  title: string;
  status: string;
  context: string;
  decision: string;
  consequences: string[];
}

interface TraceNode {
  id: string;
  type: string;
  title?: string;
  name?: string;
}

interface TraceEdge {
  id: string;
  source_id: string;
  target_id: string;
  relationship_type: string;
  confidence: string;
}

interface DemoData {
  requirements: SeedRequirement[];
  adrs: SeedADR[];
  traceGraph: { nodes: TraceNode[]; edges: TraceEdge[] };
}

const PRIORITY_BADGES: Record<string, string> = {
  critical: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
  high: 'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
  medium: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300',
  low: 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300',
};

const STATUS_COLORS: Record<string, string> = {
  implemented: 'text-green-600 dark:text-green-400',
  accepted: 'text-green-600 dark:text-green-400',
  proposed: 'text-yellow-600 dark:text-yellow-400',
  deprecated: 'text-red-600 dark:text-red-400',
};

function ConfidenceDot({ confidence }: { confidence: string }) {
  const color =
    confidence === 'high' ? 'bg-green-500' : confidence === 'medium' ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <span className={`inline-block h-2 w-2 rounded-full ${color}`} aria-label={`Confidence: ${confidence}`} />
  );
}

export function DemoMode() {
  const [data, setData] = useState<DemoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'requirements' | 'adrs' | 'trace'>('requirements');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/demo/sample-data');
      if (!res.ok) throw new Error('Failed to load demo data');
      setData(await res.json());
    } catch {
      setError('Could not load demo data. The demo server may be starting up.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-secondary">
        <Container size="lg">
          <RouteLoadingSkeleton variant="grid" />
        </Container>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-surface-secondary flex items-center justify-center p-4">
        <Card padding="lg" className="max-w-md w-full text-center">
          <Stack gap={4} align="center">
            <AlertTriangle className="h-10 w-10 text-warning-500" />
            <h2 className="text-lg font-semibold text-text-primary">Demo Unavailable</h2>
            <p className="text-sm text-text-secondary">{error}</p>
            <Button variant="primary" onClick={loadData}>
              Retry
            </Button>
          </Stack>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-secondary">
      <header className="border-b border-border bg-surface-primary">
        <Container size="lg">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500 text-sm font-bold text-text-inverse">
                N
              </div>
              <div>
                <p className="text-lg font-bold text-text-primary">Nexus Demo</p>
                <p className="text-xs text-text-tertiary">Read-only preview with sample data</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                icon={<ArrowLeft className="h-4 w-4" />}
                onClick={() => {
                  window.location.hash = '#/';
                }}
                aria-label="Back to home"
              >
                <span className="hidden sm:inline">Home</span>
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  window.location.hash = '#/register';
                }}
              >
                Sign Up Free
              </Button>
            </div>
          </div>
        </Container>
      </header>

      <Container size="lg">
        <Stack gap={8} className="py-8">
          <Stack gap={2}>
            <h1 className="text-3xl font-bold text-text-primary">Nexus Engineering Platform</h1>
            <p className="text-text-secondary max-w-2xl">
              Full-stack requirements traceability, architecture decision tracking, and impact analysis.
              Explore the demo data below — this is a read-only sandbox.
            </p>
          </Stack>

          <Grid cols={3} gap={4}>
            <Card variant="elevated" padding="md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-300">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">{data.requirements.length}</p>
                  <p className="text-xs text-text-tertiary">Requirements</p>
                </div>
              </div>
            </Card>
            <Card variant="elevated" padding="md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary-50 text-secondary-600 dark:bg-secondary-950 dark:text-secondary-300">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">{data.adrs.length}</p>
                  <p className="text-xs text-text-tertiary">ADRs</p>
                </div>
              </div>
            </Card>
            <Card variant="elevated" padding="md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-50 text-accent-600 dark:bg-accent-950 dark:text-accent-300">
                  <Link2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">{data.traceGraph.edges.length}</p>
                  <p className="text-xs text-text-tertiary">Trace Links</p>
                </div>
              </div>
            </Card>
          </Grid>

          <div className="flex gap-2 border-b border-border pb-0" role="tablist" aria-label="Demo data sections">
            {([
              { key: 'requirements', label: `Requirements (${data.requirements.length})` },
              { key: 'adrs', label: `Architecture Decisions (${data.adrs.length})` },
              { key: 'trace', label: `Trace Graph (${data.traceGraph.nodes.length} nodes)` },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                role="tab"
                aria-selected={selectedTab === tab.key}
                onClick={() => setSelectedTab(tab.key)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                  selectedTab === tab.key
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-text-tertiary hover:text-text-secondary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {selectedTab === 'requirements' && (
            <div role="tabpanel" aria-label="Requirements">
              <Stack gap={3}>
              {data.requirements.map((req) => (
                <Card key={req.id} padding="md">
                  <Stack gap={2}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono text-text-tertiary">{req.id}</span>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_BADGES[req.priority] || ''}`}>
                            {req.priority}
                          </span>
                          <span className={`text-xs font-medium ${STATUS_COLORS[req.status] || 'text-text-tertiary'}`}>
                            {req.status}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-text-primary mt-1">{req.title}</h3>
                        <p className="text-sm text-text-secondary mt-0.5">{req.description}</p>
                      </div>
                    </div>
                    {req.tags.length > 0 && (
                      <div className="flex gap-1.5 flex-wrap">
                        {req.tags.map((tag) => (
                          <span key={tag} className="inline-flex items-center rounded bg-surface-secondary px-1.5 py-0.5 text-xs text-text-tertiary">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </Stack>
                </Card>
              ))}
            </Stack>
            </div>
          )}

          {selectedTab === 'adrs' && (
            <div role="tabpanel" aria-label="Architecture Decision Records">
              <Stack gap={3}>
              {data.adrs.map((adr) => (
                <Card key={adr.id} padding="md">
                  <Stack gap={3}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-text-tertiary">{adr.id}</span>
                          <span className={`text-xs font-medium ${STATUS_COLORS[adr.status] || 'text-text-tertiary'}`}>
                            {adr.status}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-text-primary mt-1">{adr.title}</h3>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-1">Context</p>
                      <p className="text-sm text-text-secondary">{adr.context}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-1">Decision</p>
                      <p className="text-sm text-text-secondary">{adr.decision}</p>
                    </div>
                    {adr.consequences.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-1">Consequences</p>
                        <ul className="list-none space-y-1">
                          {adr.consequences.map((c, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                              <CheckCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-green-500" />
                              {c}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </Stack>
                </Card>
              ))}
            </Stack>
            </div>
          )}

          {selectedTab === 'trace' && (
            <div role="tabpanel" aria-label="Trace Graph">
              <Stack gap={6}>
              <div>
                <h3 className="text-sm font-medium text-text-tertiary uppercase tracking-wide mb-3">Nodes ({data.traceGraph.nodes.length})</h3>
                <Grid cols={2} gap={3}>
                  {data.traceGraph.nodes.map((node) => (
                    <Card key={node.id} padding="sm">
                      <div className="flex items-center gap-2">
                        <GitBranch className="h-3.5 w-3.5 flex-shrink-0 text-text-tertiary" />
                        <div className="min-w-0">
                          <p className="text-xs font-mono text-text-tertiary truncate">{node.id}</p>
                          <p className="text-sm font-medium text-text-primary truncate">{node.title || node.name || node.id}</p>
                          <span className="inline-flex items-center rounded bg-surface-secondary px-1.5 py-0.5 text-xs text-text-tertiary">
                            {node.type}
                          </span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </Grid>
              </div>
              <div>
                <h3 className="text-sm font-medium text-text-tertiary uppercase tracking-wide mb-3">Edges ({data.traceGraph.edges.length})</h3>
                <Card padding="md">
                  <div className="space-y-2">
                    {data.traceGraph.edges.slice(0, 15).map((edge) => (
                      <div key={edge.id} className="flex items-center gap-2 text-sm">
                        <ConfidenceDot confidence={edge.confidence} />
                        <span className="font-mono text-xs text-text-tertiary truncate max-w-[200px]">{edge.source_id}</span>
                        <span className="text-text-tertiary">→</span>
                        <span className="font-mono text-xs text-text-tertiary truncate max-w-[200px]">{edge.target_id}</span>
                        <span className="text-xs text-text-tertiary ml-auto">{edge.relationship_type}</span>
                      </div>
                    ))}
                    {data.traceGraph.edges.length > 15 && (
                      <p className="text-xs text-text-tertiary text-center pt-2">
                        + {data.traceGraph.edges.length - 15} more edges
                      </p>
                    )}
                  </div>
                </Card>
              </div>
            </Stack>
            </div>
          )}

          <Card variant="elevated" padding="lg" className="border border-primary-200 dark:border-primary-800">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <Stack gap={1}>
                <h3 className="text-lg font-semibold text-text-primary">Ready to get started?</h3>
                <p className="text-sm text-text-secondary">
                  Sign up free — no credit card required. Import your own data or start with demo seed data.
                </p>
              </Stack>
              <Button
                variant="primary"
                size="lg"
                icon={<ExternalLink className="h-4 w-4" />}
                onClick={() => {
                  window.location.hash = '#/register';
                }}
              >
                Create Free Account
              </Button>
            </div>
          </Card>
        </Stack>
      </Container>
    </div>
  );
}
