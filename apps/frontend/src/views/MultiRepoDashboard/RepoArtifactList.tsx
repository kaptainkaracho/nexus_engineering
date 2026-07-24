import { useMemo, useState } from 'react';
import { Badge, Card, Input, Stack } from '@nexus-engineering/shared';
import type { ArtifactType, DiscoveryArtifact } from '../../api/client';

const TYPE_LABELS: Record<string, string> = {
  requirement: 'Requirement',
  architecture: 'Architecture',
  adr: 'ADR',
  spec: 'Specification',
  unknown: 'Unknown',
};

const TYPE_BADGE_VARIANTS: Record<string, string> = {
  requirement: 'implemented',
  architecture: 'proposed',
  adr: 'high',
  spec: 'info',
  unknown: 'low',
};

const LIFECYCLE_LABELS: Record<string, string> = {
  discovered: 'Discovered',
  parsed: 'Parsed',
  indexed: 'Indexed',
  related: 'Related',
  error: 'Error',
};

const LIFECYCLE_BADGE_VARIANTS: Record<string, string> = {
  discovered: 'draft',
  parsed: 'ready',
  indexed: 'approved',
  related: 'automated',
  error: 'critical',
};

interface RepoArtifactListProps {
  repositoryPath: string;
  artifacts: DiscoveryArtifact[];
  loading: boolean;
  error: string | null;
}

export function RepoArtifactList({
  repositoryPath,
  artifacts,
  loading,
  error,
}: RepoArtifactListProps) {
  const [typeFilter, setTypeFilter] = useState<ArtifactType | 'all'>('all');
  const [query, setQuery] = useState('');

  const typeOptions = useMemo(() => {
    const types = new Set(artifacts.map((a) => a.type));
    return Array.from(types);
  }, [artifacts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return artifacts.filter((a) => {
      if (typeFilter !== 'all' && a.type !== typeFilter) return false;
      if (q) {
        const searchText = `${a.fileName ?? a.filePath} ${a.type}`.toLowerCase();
        if (!searchText.includes(q)) return false;
      }
      return true;
    });
  }, [artifacts, typeFilter, query]);

  if (error) {
    return (
      <Card variant="outlined" padding="lg">
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <span className="text-3xl" aria-hidden="true">
            ⚠️
          </span>
          <h3 className="text-lg font-semibold text-error-600">
            Failed to Load Artifacts
          </h3>
          <p className="max-w-md text-sm text-text-secondary">{error}</p>
          <p className="text-xs text-text-tertiary">
            Repository: <code className="font-mono">{repositoryPath}</code>
          </p>
        </div>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card padding="lg">
        <div className="flex items-center justify-center py-12" role="status" aria-live="polite">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary-500" />
            <p className="text-sm text-text-tertiary">Loading artifacts for {repositoryPath}…</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card padding="lg">
      <Stack gap={4}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium uppercase tracking-wide text-text-tertiary">
            Artifacts: <span className="font-mono text-xs text-text-primary">{repositoryPath}</span>
          </h3>
          <span className="text-xs text-text-tertiary">
            {filtered.length} of {artifacts.length} shown
          </span>
        </div>

        <Input
          label="Search artifacts"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by name or type…"
          fullWidth
          aria-label="Search artifacts in this repository"
        />

        {typeOptions.length > 1 && (
          <div role="group" aria-label="Filter by type" className="flex flex-wrap items-center gap-2">
            <span className="sr-only">Filter by type</span>
            {[
              { value: 'all' as const, label: 'All' },
              ...typeOptions.map((t) => ({ value: t, label: TYPE_LABELS[t] ?? t })),
            ].map((opt) => {
              const isActive = typeFilter === opt.value;
              const optionValue = opt.value as string;
              return (
                <button
                  key={optionValue}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setTypeFilter(optionValue as ArtifactType | 'all')}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                    isActive
                      ? 'bg-primary-500 text-text-inverse'
                      : 'bg-surface-tertiary text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex flex-col" role="list" aria-label="Discovered artifacts">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <span className="text-2xl" aria-hidden="true">
                🔍
              </span>
              <p className="text-base font-semibold text-text-primary">No artifacts found</p>
              <p className="max-w-sm text-sm text-text-tertiary">
                {query || typeFilter !== 'all'
                  ? 'No artifacts match the current filters. Try clearing the search or changing the filter.'
                  : 'No artifacts were discovered in this repository during the scan.'}
              </p>
            </div>
          ) : (
            filtered.map((artifact) => (
              <div
                key={artifact.id}
                role="listitem"
                className="flex items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-surface-secondary"
              >
                <Badge variant={TYPE_BADGE_VARIANTS[artifact.type] ?? TYPE_BADGE_VARIANTS.unknown}>
                  {TYPE_LABELS[artifact.type] ?? artifact.type}
                </Badge>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-text-primary">
                    {artifact.fileName ?? artifact.filePath.split('/').pop() ?? artifact.id}
                  </span>
                  <span className="block truncate text-xs text-text-tertiary">
                    {artifact.relativePath ?? artifact.filePath}
                  </span>
                </span>
                {artifact.errors.length > 0 && (
                  <Badge variant="critical" title={`${artifact.errors.length} error(s)`}>
                    {artifact.errors.length} err
                  </Badge>
                )}
                <Badge variant={LIFECYCLE_BADGE_VARIANTS[artifact.lifecycle] ?? 'draft'}>
                  {LIFECYCLE_LABELS[artifact.lifecycle] ?? artifact.lifecycle}
                </Badge>
              </div>
            ))
          )}
        </div>
      </Stack>
    </Card>
  );
}
