import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Card, Container, Stack } from '@nexus-engineering/shared';
import {
  triggerMultiScan,
  fetchMultiScanStatus,
  fetchArtifactsByRepository,
  type DiscoveryArtifact,
  type MultiRepoScanEntry,
  type ByRepositoryResponse,
} from '../../api/client';
import { RepoArtifactList } from './RepoArtifactList';

interface PendingPath {
  path: string;
  id: string;
}

let idCounter = 0;
function nextId(): string {
  return `rp-${++idCounter}`;
}

function initialPaths(): PendingPath[] {
  return [{ path: '/repo', id: nextId() }];
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString();
}

export function MultiRepoDashboard() {
  const [repoPaths, setRepoPaths] = useState<PendingPath[]>(initialPaths);
  const [scanning, setScanning] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [scanEntries, setScanEntries] = useState<MultiRepoScanEntry[]>([]);
  const [totalFiles, setTotalFiles] = useState<number | null>(null);
  const [totalArtifacts, setTotalArtifacts] = useState<number | null>(null);
  const [scanDuration, setScanDuration] = useState<number | null>(null);
  const [scanErrors, setScanErrors] = useState<string[]>([]);
  const [scanStatus, setScanStatus] = useState<'idle' | 'running' | 'completed' | 'failed'>('idle');

  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [repoArtifacts, setRepoArtifacts] = useState<DiscoveryArtifact[]>([]);
  const [loadingArtifacts, setLoadingArtifacts] = useState(false);
  const [artifactError, setArtifactError] = useState<string | null>(null);

  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, []);

  const pollSession = useCallback((sid: string) => {
    const tick = async () => {
      try {
        const session = await fetchMultiScanStatus(sid);
        setScanEntries(session.scans);
        setTotalFiles(session.totalFilesFound);
        setTotalArtifacts(session.totalArtifactsDetected);
        if (session.scanTimeMs != null) setScanDuration(session.scanTimeMs);
        if (session.errors.length > 0) {
          setScanErrors(session.errors.map((e) => `${e.repositoryPath}: ${e.message}`));
        }

        if (session.status === 'running') {
          pollRef.current = setTimeout(tick, 2000);
        } else if (session.status === 'failed') {
          setScanStatus('failed');
        } else {
          setScanStatus('completed');
        }
      } catch {
        setScanStatus('failed');
      }
    };
    pollRef.current = setTimeout(tick, 500);
  }, []);

  const handleAddPath = useCallback(() => {
    setRepoPaths((prev) => [...prev, { path: '', id: nextId() }]);
  }, []);

  const handleRemovePath = useCallback((id: string) => {
    setRepoPaths((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const handlePathChange = useCallback((id: string, value: string) => {
    setRepoPaths((prev) =>
      prev.map((p) => (p.id === id ? { ...p, path: value } : p)),
    );
  }, []);

  const handleScan = useCallback(async () => {
    const paths = repoPaths
      .map((p) => p.path.trim())
      .filter((p) => p.length > 0);
    if (paths.length === 0) return;

    setScanning(true);
    setScanStatus('running');
    setSessionId(null);
    setScanEntries([]);
    setTotalFiles(null);
    setTotalArtifacts(null);
    setScanDuration(null);
    setScanErrors([]);
    setSelectedRepo(null);
    setRepoArtifacts([]);

    try {
      const response = await triggerMultiScan({
        repositoryPaths: paths,
        scanMode: 'parallel',
      });
      setSessionId(response.sessionId);
      setScanEntries(response.scans);
      setTotalFiles(response.totalFilesFound);
      setTotalArtifacts(response.totalArtifactsDetected);
      if (response.scanTimeMs) setScanDuration(response.scanTimeMs);
      if (response.errors.length > 0) {
        setScanErrors(response.errors.map((e) => `${e.repositoryPath}: ${e.message}`));
      }

      const allDone = response.scans.every(
        (s) => s.status === 'completed' || s.status === 'failed',
      );
      if (allDone) {
        setScanStatus('completed');
        setScanning(false);
      } else {
        pollSession(response.sessionId);
      }
    } catch (err) {
      setScanStatus('failed');
      setScanErrors([err instanceof Error ? err.message : 'Failed to trigger scan']);
      setScanning(false);
    }
  }, [repoPaths, pollSession]);

  const handleSelectRepo = useCallback(async (repoPath: string) => {
    setSelectedRepo(repoPath);
    setLoadingArtifacts(true);
    setArtifactError(null);
    try {
      const result: ByRepositoryResponse = await fetchArtifactsByRepository(repoPath);
      setRepoArtifacts(result.data);
    } catch (err) {
      setArtifactError(
        err instanceof Error ? err.message : 'Failed to load artifacts',
      );
      setRepoArtifacts([]);
    } finally {
      setLoadingArtifacts(false);
    }
  }, []);

  const getEntryStatus = (repoPath: string): MultiRepoScanEntry | undefined => {
    return scanEntries.find((e) => e.repositoryPath === repoPath);
  };

  return (
    <Container size="lg">
      <Stack gap={8}>
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Multi-Repository Scanner</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Scan multiple repositories simultaneously to discover engineering artifacts across your projects.
          </p>
        </div>

        <Card padding="lg">
          <Stack gap={4}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium uppercase tracking-wide text-text-tertiary">
                Repository Paths
              </h3>
              <span className="text-xs text-text-tertiary">
                {repoPaths.filter((p) => p.path.trim()).length} path(s)
              </span>
            </div>

            <div className="flex flex-col gap-2" role="list" aria-label="Repository paths">
              {repoPaths.map((rp, index) => (
                <div key={rp.id} role="listitem" className="flex items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-500 text-xs font-bold text-text-inverse">
                    {index + 1}
                  </span>
                  <label htmlFor={`repo-path-${rp.id}`} className="sr-only">
                    Repository path {index + 1}
                  </label>
                  <input
                    id={`repo-path-${rp.id}`}
                    type="text"
                    value={rp.path}
                    onChange={(e) => handlePathChange(rp.id, e.target.value)}
                    placeholder={`e.g. /path/to/repo-${index + 1}`}
                    disabled={scanStatus === 'running'}
                    className="flex-1 rounded-lg border border-border bg-surface-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                  />
                  {repoPaths.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePath(rp.id)}
                      disabled={scanStatus === 'running'}
                      aria-label={`Remove path ${index + 1}`}
                      className="rounded-lg p-2 text-text-tertiary hover:text-error-500 hover:bg-error-500/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:opacity-50"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleAddPath}
                disabled={scanStatus === 'running' || repoPaths.length >= 100}
                aria-label="Add another repository path"
              >
                + Add Path
              </Button>
              <Button
                variant="primary"
                onClick={handleScan}
                loading={scanStatus === 'running' && scanning}
                disabled={
                  scanStatus === 'running' ||
                  repoPaths.filter((p) => p.path.trim()).length === 0
                }
              >
                {scanStatus === 'running' ? 'Scanning…' : 'Scan Repositories'}
              </Button>
              {scanStatus !== 'idle' && (
                <button
                  type="button"
                  onClick={() => {
                    setScanStatus('idle');
                    setSessionId(null);
                    setScanEntries([]);
                    setTotalFiles(null);
                    setTotalArtifacts(null);
                    setScanDuration(null);
                    setScanErrors([]);
                    setSelectedRepo(null);
                    setRepoArtifacts([]);
                  }}
                  className="text-sm font-medium text-text-tertiary hover:text-text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-lg px-3 py-2"
                >
                  Reset
                </button>
              )}
            </div>
          </Stack>
        </Card>

        {scanErrors.length > 0 && (
          <Card variant="outlined" padding="md">
            <Stack gap={2}>
              <h3 className="text-sm font-semibold text-error-600">Scan Errors</h3>
              <ul className="list-inside list-disc text-sm text-text-secondary">
                {scanErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </Stack>
          </Card>
        )}

        {(scanStatus === 'running' || scanStatus === 'completed') && (
          <>
            <Card padding="lg">
              <Stack gap={3}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium uppercase tracking-wide text-text-tertiary">
                    Scan Results
                  </h3>
                  {scanStatus === 'running' && (
                    <span className="flex items-center gap-2 text-sm text-primary-600">
                      <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary-500" />
                      Scanning…
                    </span>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-lg bg-surface-secondary p-4 text-center">
                    <p className="text-2xl font-bold text-text-primary">
                      {totalFiles ?? '—'}
                    </p>
                    <p className="mt-1 text-xs text-text-tertiary">Files Found</p>
                  </div>
                  <div className="rounded-lg bg-surface-secondary p-4 text-center">
                    <p className="text-2xl font-bold text-text-primary">
                      {totalArtifacts ?? '—'}
                    </p>
                    <p className="mt-1 text-xs text-text-tertiary">Artifacts Detected</p>
                  </div>
                  <div className="rounded-lg bg-surface-secondary p-4 text-center">
                    <p className="text-2xl font-bold text-text-primary">
                      {scanDuration != null ? formatDuration(scanDuration) : '—'}
                    </p>
                    <p className="mt-1 text-xs text-text-tertiary">Duration</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm" aria-label="Per-repository scan breakdown">
                    <thead>
                      <tr className="border-b border-border text-xs uppercase tracking-wide text-text-tertiary">
                        <th className="p-3 font-semibold" scope="col">Repository</th>
                        <th className="p-3 font-semibold" scope="col">Status</th>
                        <th className="p-3 font-semibold" scope="col">Files</th>
                        <th className="p-3 font-semibold" scope="col">Artifacts</th>
                        <th className="p-3 font-semibold" scope="col">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scanEntries.length === 0 && scanStatus === 'running' && (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-sm text-text-tertiary">
                            Waiting for scan results…
                          </td>
                        </tr>
                      )}
                      {(scanEntries.length > 0
                        ? scanEntries
                        : repoPaths
                            .filter((p) => p.path.trim())
                            .map((p) => ({
                              repositoryPath: p.path,
                              scanId: '',
                              status: 'running' as const,
                              filesFound: undefined,
                              artifactsDetected: undefined,
                              error: undefined,
                            }))
                      ).map((entry) => (
                        <tr
                          key={entry.repositoryPath}
                          className={`border-b border-border transition-colors hover:bg-surface-secondary/50 ${
                            selectedRepo === entry.repositoryPath
                              ? 'bg-primary-500/5'
                              : ''
                          }`}
                        >
                          <td className="p-3 font-mono text-xs text-text-primary">
                            {entry.repositoryPath}
                          </td>
                          <td className="p-3">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                entry.status === 'completed'
                                  ? 'bg-success-500/10 text-success-700'
                                  : entry.status === 'failed'
                                    ? 'bg-error-500/10 text-error-700'
                                    : 'bg-warning-500/10 text-warning-700'
                              }`}
                            >
                              {entry.status === 'running' && (
                                <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
                              )}
                              {entry.status}
                            </span>
                          </td>
                          <td className="p-3 text-text-secondary">
                            {entry.filesFound ?? (entry.status === 'running' ? '…' : '—')}
                          </td>
                          <td className="p-3 text-text-secondary">
                            {entry.artifactsDetected ?? (entry.status === 'running' ? '…' : '—')}
                          </td>
                          <td className="p-3">
                            {entry.status === 'completed' ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSelectRepo(entry.repositoryPath)}
                                loading={loadingArtifacts && selectedRepo === entry.repositoryPath}
                              >
                                {selectedRepo === entry.repositoryPath ? 'Selected' : 'View Artifacts'}
                              </Button>
                            ) : entry.error ? (
                              <span className="text-xs text-error-600">{entry.error}</span>
                            ) : (
                              <span className="text-xs text-text-tertiary">Waiting…</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Stack>
            </Card>

            {selectedRepo && (
              <RepoArtifactList
                repositoryPath={selectedRepo}
                artifacts={repoArtifacts}
                loading={loadingArtifacts}
                error={artifactError}
              />
            )}
          </>
        )}

        {scanStatus === 'idle' && (
          <Card variant="outlined" padding="lg">
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <span className="text-3xl" aria-hidden="true">
                📂
              </span>
              <h3 className="text-lg font-semibold text-text-primary">
                Ready to Scan
              </h3>
              <p className="max-w-md text-sm text-text-tertiary">
                Add one or more repository paths above and click "Scan Repositories" to
                discover engineering artifacts across your projects.
              </p>
            </div>
          </Card>
        )}

        {scanStatus === 'failed' && !scanErrors.length && (
          <Card variant="outlined" padding="lg">
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <span className="text-3xl" aria-hidden="true">
                ❌
              </span>
              <h3 className="text-lg font-semibold text-error-600">Scan Failed</h3>
              <p className="max-w-md text-sm text-text-secondary">
                The multi-repo scan did not complete successfully. Check the repository paths
                and try again.
              </p>
            </div>
          </Card>
        )}
      </Stack>
    </Container>
  );
}
