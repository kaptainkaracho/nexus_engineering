import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Card, Container, Stack } from '@nexus-engineering/shared';
import {
  fetchRegistry,
  fetchScanStatus,
  reparseArtifact as apiReparse,
  triggerScan,
  type DiscoveryArtifact,
  type RegistrySummary,
} from '../../api/client';
import { ScanOverview, type ScanPhase } from './ScanOverview';
import { ArtifactBrowser } from './ArtifactBrowser';
import { ArtifactDetailPanel } from './ArtifactDetailPanel';
import './DiscoveryDashboard.css';

const DEFAULT_REPOSITORY_PATH = '/repo';

function latestTimestamp(artifacts: DiscoveryArtifact[]): string | null {
  if (artifacts.length === 0) return null;
  return artifacts.reduce(
    (latest, a) => (new Date(a.createdAt).getTime() > new Date(latest).getTime() ? a.createdAt : latest),
    artifacts[0].createdAt,
  );
}

function emptySummary(): RegistrySummary {
  return {
    total: 0,
    byType: { requirement: 0, architecture: 0, adr: 0, spec: 0, unknown: 0 },
    byLifecycle: { discovered: 0, parsed: 0, indexed: 0, related: 0, error: 0 },
  };
}

export function DiscoveryDashboard() {
  const [artifacts, setArtifacts] = useState<DiscoveryArtifact[]>([]);
  const [summary, setSummary] = useState<RegistrySummary>(emptySummary());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<DiscoveryArtifact | null>(null);
  const [reparsing, setReparsing] = useState(false);

  const [phase, setPhase] = useState<ScanPhase>('idle');
  const [progressPct, setProgressPct] = useState<number | null>(null);
  const [lastScanAt, setLastScanAt] = useState<string | null>(null);
  const [lastScanFiles, setLastScanFiles] = useState<number | null>(null);

  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadRegistry = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetchRegistry();
      setArtifacts(res.data);
      setSummary(res.summary);
      setLastScanAt((prev) => prev ?? latestTimestamp(res.data));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load artifact registry');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRegistry();
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, [loadRegistry]);

  const pollScan = useCallback((scanId: string) => {
    const tick = async () => {
      try {
        const status = await fetchScanStatus(scanId);
        if (status.status === 'running') {
          const done = status.filesFound + status.artifactsDetected.length;
          setProgressPct(done > 0 ? Math.min(95, done) : null);
          pollRef.current = setTimeout(tick, 2000);
        } else if (status.status === 'failed') {
          setPhase('failed');
          setProgressPct(null);
        } else {
          setPhase('completed');
          setProgressPct(100);
          setLastScanAt(status.completedAt ?? new Date().toISOString());
          setLastScanFiles(status.filesFound);
          await loadRegistry();
        }
      } catch {
        setPhase('failed');
        setProgressPct(null);
      }
    };
    pollRef.current = setTimeout(tick, 500);
  }, [loadRegistry]);

  const handleRunScan = useCallback(
    async (repositoryPath: string) => {
      setPhase('running');
      setProgressPct(null);
      try {
        const res = await triggerScan(repositoryPath);
        if (res.status === 'running') {
          pollScan(res.scanId);
        } else if (res.status === 'failed') {
          setPhase('failed');
        } else {
          setPhase('completed');
          setProgressPct(100);
          setLastScanAt(new Date().toISOString());
          setLastScanFiles(res.filesFound ?? null);
          await loadRegistry();
        }
      } catch {
        setPhase('failed');
        setProgressPct(null);
      }
    },
    [loadRegistry, pollScan],
  );

  const handleReparse = useCallback(
    async (id: string) => {
      setReparsing(true);
      try {
        const updated = await apiReparse(id);
        await loadRegistry();
        setSelected((prev) => (prev && prev.id === id ? updated : prev));
      } catch {
        // Surface failure via the panel remaining; refresh best-effort
        await loadRegistry();
      } finally {
        setReparsing(false);
      }
    },
    [loadRegistry],
  );

  return (
    <Container size="lg" className="py-8">
      <Stack gap={2} className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Discovery Dashboard</h1>
        <p className="text-text-secondary">
          Scan repositories and browse automatically discovered engineering artifacts.
        </p>
      </Stack>

      {loadError && (
        <Card padding="lg" className="mb-6 border border-error-500/40">
          <Stack gap={3}>
            <p className="text-sm text-error-600 dark:text-error-400">
              Error loading artifact registry: {loadError}
            </p>
            <Button variant="secondary" size="sm" onClick={() => void loadRegistry()}>
              Retry
            </Button>
          </Stack>
        </Card>
      )}

      <ScanOverview
        summary={summary}
        lastScanAt={lastScanAt}
        lastScanFiles={lastScanFiles}
        phase={phase}
        progressPct={progressPct}
        onRunScan={handleRunScan}
        defaultPath={DEFAULT_REPOSITORY_PATH}
      />

      <ArtifactBrowser
        artifacts={artifacts}
        selectedId={selected?.id ?? null}
        onSelect={setSelected}
        loading={loading}
      />

      <ArtifactDetailPanel
        artifact={selected}
        onClose={() => setSelected(null)}
        onReparse={handleReparse}
        reparsing={reparsing}
      />
    </Container>
  );
}

export default DiscoveryDashboard;
