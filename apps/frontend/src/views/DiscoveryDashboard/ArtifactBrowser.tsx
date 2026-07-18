import { useMemo, useState } from 'react';
import { Card, Input, Stack } from '@nexus-engineering/shared';
import type { ArtifactType, DiscoveryArtifact, LifecycleState } from '../../api/client';
import {
  LIFECYCLE_LABEL,
  LIFECYCLE_ORDER,
  TYPE_LABEL,
  TYPE_ORDER,
  artifactName,
  artifactPath,
} from './constants';

interface ArtifactBrowserProps {
  artifacts: DiscoveryArtifact[];
  selectedId: string | null;
  onSelect: (artifact: DiscoveryArtifact) => void;
  loading: boolean;
}

export function ArtifactBrowser({
  artifacts,
  selectedId,
  onSelect,
  loading,
}: ArtifactBrowserProps) {
  const [typeFilter, setTypeFilter] = useState<ArtifactType | 'all'>('all');
  const [lifecycleFilter, setLifecycleFilter] = useState<LifecycleState | 'all'>('all');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return artifacts.filter((a) => {
      if (typeFilter !== 'all' && a.type !== typeFilter) return false;
      if (lifecycleFilter !== 'all' && a.lifecycle !== lifecycleFilter) return false;
      if (q) {
        const hay = `${artifactName(a)} ${artifactPath(a)} ${a.type}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [artifacts, typeFilter, lifecycleFilter, query]);

  return (
    <section aria-labelledby="artifact-browser-heading" className="mt-10">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2
          id="artifact-browser-heading"
          className="text-sm font-medium uppercase tracking-wide text-text-tertiary"
        >
          Artifact Browser
        </h2>
        <span className="text-sm text-text-tertiary" aria-live="polite">
          {loading ? 'Loading…' : `${filtered.length} of ${artifacts.length} shown`}
        </span>
      </div>

      <Card padding="lg">
        <Stack gap={4}>
          <Input
            label="Search artifacts"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by name or path"
            fullWidth
            aria-label="Search artifacts by name or path"
          />

          <div className="flex flex-col gap-3">
            <FilterRow
              legend="Filter by type"
              options={TYPE_ORDER.map((t) => ({ value: t, label: TYPE_LABEL[t] }))}
              active={typeFilter}
              onSelect={(v) => setTypeFilter(v as ArtifactType | 'all')}
            />
            <FilterRow
              legend="Filter by lifecycle"
              options={LIFECYCLE_ORDER.map((l) => ({ value: l, label: LIFECYCLE_LABEL[l] }))}
              active={lifecycleFilter}
              onSelect={(v) => setLifecycleFilter(v as LifecycleState | 'all')}
            />
          </div>

          {loading ? (
            <p className="py-8 text-center text-sm text-text-tertiary">Loading artifacts…</p>
          ) : filtered.length === 0 ? (
            <EmptyState hasArtifacts={artifacts.length > 0} />
          ) : (
            <ul className="flex flex-col" role="listbox" aria-label="Discovered artifacts">
              {filtered.map((artifact) => {
                const isSelected = artifact.id === selectedId;
                return (
                  <li key={artifact.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => onSelect(artifact)}
                      className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                        isSelected ? 'dash-row-selected' : 'hover:bg-surface-secondary'
                      }`}
                    >
                      <span
                        className={`dash-badge dash-badge--type-${artifact.type}`}
                        aria-hidden="true"
                      >
                        {TYPE_LABEL[artifact.type]}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-text-primary">
                          {artifactName(artifact)}
                        </span>
                        <span className="block truncate text-xs text-text-tertiary">
                          {artifactPath(artifact)}
                        </span>
                      </span>
                      {artifact.errors.length > 0 && (
                        <span
                          className="dash-badge dash-badge--error"
                          title={`${artifact.errors.length} error(s)`}
                        >
                          {artifact.errors.length} err
                        </span>
                      )}
                      <span className={`dash-badge dash-badge--${artifact.lifecycle}`}>
                        {LIFECYCLE_LABEL[artifact.lifecycle]}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Stack>
      </Card>
    </section>
  );
}

function FilterRow({
  legend,
  options,
  active,
  onSelect,
}: {
  legend: string;
  options: Array<{ value: string; label: string }>;
  active: string;
  onSelect: (value: string) => void;
}) {
  const allOption = { value: 'all', label: 'All' };
  const items = [allOption, ...options];
  return (
    <div role="group" aria-label={legend} className="flex flex-wrap items-center gap-2">
      <span className="sr-only">{legend}</span>
      {items.map((opt) => {
        const isActive = active === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onSelect(opt.value)}
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
  );
}

function EmptyState({ hasArtifacts }: { hasArtifacts: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <span className="text-2xl" aria-hidden="true">
        🔍
      </span>
      <p className="text-lg font-semibold text-text-primary">No artifacts found</p>
      <p className="max-w-sm text-sm text-text-tertiary">
        {hasArtifacts
          ? 'No artifacts match the current filters. Try clearing the search or switching filters.'
          : 'Run a scan from the Scan Overview to discover engineering artifacts in your repositories.'}
      </p>
    </div>
  );
}
