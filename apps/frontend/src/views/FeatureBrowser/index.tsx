import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Button, Card, Container, Grid, Input, Stack } from '@nexus-engineering/shared';
import {
  fetchFacFeatures,
  fetchFacFeature,
  type FacFeature,
  type FacStatus,
} from '../../api/client';
import {
  STATUS_CONFIG,
  STATUS_ORDER,
  getStatusConfig,
} from './types';
import { FeatureCard } from './FeatureCard';
import { FeatureDetail } from './FeatureDetail';
import './FeatureBrowser.css';

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Card padding="md">
      <Stack gap={1}>
        <span className="text-xs font-medium uppercase tracking-wide text-text-tertiary">
          {label}
        </span>
        <span className="text-3xl font-bold tabular-nums text-text-primary">{value}</span>
        {hint && <span className="text-xs text-text-tertiary">{hint}</span>}
      </Stack>
    </Card>
  );
}

export function FeatureBrowser() {
  const [features, setFeatures] = useState<FacFeature[]>([]);
  const [documents, setDocuments] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [deferredQuery, setDeferredQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<FacStatus | 'all'>('all');

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<FacFeature | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFacFeatures();
      setFeatures(res.features);
      setDocuments(res.documents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load features');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Debounce the search query by 300ms.
  useEffect(() => {
    const t = setTimeout(() => setDeferredQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  // Fetch detail when a feature is selected.
  useEffect(() => {
    if (!selectedId) {
      setSelectedFeature(null);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    setDetailError(null);
    fetchFacFeature(selectedId)
      .then((res) => {
        if (cancelled) return;
        if (res?.feature) setSelectedFeature(res.feature);
        else setDetailError('Feature not found');
      })
      .catch((err) => {
        if (!cancelled) setDetailError(err instanceof Error ? err.message : 'Failed to load feature');
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const domains = useMemo(() => {
    const set = new Set<string>();
    features.forEach((f) => set.add(f.documentId));
    return Array.from(set).sort();
  }, [features]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: features.length };
    STATUS_ORDER.forEach((s) => (counts[s] = 0));
    features.forEach((f) => {
      const key = f.status ?? 'draft';
      counts[key] = (counts[key] ?? 0) + 1;
    });
    return counts;
  }, [features]);

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return features.filter((f) => {
      const matchesQuery =
        !q ||
        f.name.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.id.toLowerCase().includes(q);
      const matchesDomain = domainFilter === 'all' || f.documentId === domainFilter;
      const matchesStatus = statusFilter === 'all' || (f.status ?? 'draft') === statusFilter;
      return matchesQuery && matchesDomain && matchesStatus;
    });
  }, [features, deferredQuery, domainFilter, statusFilter]);

  const tracedCount = useMemo(
    () => features.filter((f) => (f.traceLinks?.length ?? 0) > 0).length,
    [features],
  );
  const coverage = features.length ? Math.round((tracedCount / features.length) * 100) : 0;
  const approvedCount = statusCounts['approved'] ?? 0;

  const selectFeature = useCallback((id: string) => {
    setSelectedId(id);
    const idx = features.findIndex((f) => f.id === id);
    if (idx >= 0) setActiveIndex(idx);
  }, [features]);

  const focusOption = (index: number) => {
    const clamped = Math.max(0, Math.min(index, filtered.length - 1));
    setActiveIndex(clamped);
    const target = filtered[clamped];
    if (target) document.getElementById(`fb-option-${target.id}`)?.focus();
  };

  const handleListKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      focusOption(activeIndex + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      focusOption(activeIndex - 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      focusOption(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      focusOption(filtered.length - 1);
    }
  };

  const isEmpty = !loading && !error && features.length === 0;
  const noResults = !loading && !error && features.length > 0 && filtered.length === 0;

  return (
    <Container size="lg" className="py-8">
      <Stack gap={2} className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Feature Browser</h1>
        <p className="text-text-secondary">
          Browse and manage product features defined as <code>.feature.yaml</code> documents.
          Track status, user stories, and requirement traces.
        </p>
      </Stack>

      {error && (
        <Card padding="lg" className="mb-6 border border-error-500/40">
          <Stack gap={3}>
            <p className="text-sm text-error-600 dark:text-error-400" role="alert">
              Error loading features: {error}
            </p>
            <div>
              <Button variant="secondary" size="sm" onClick={() => void load()}>
                Retry
              </Button>
            </div>
          </Stack>
        </Card>
      )}

      {loading && (
        <div aria-busy="true">
          <div className="fb-skeletons" aria-hidden="true">
            <div className="fb-skeleton" />
            <div className="fb-skeleton" />
            <div className="fb-skeleton" />
            <div className="fb-skeleton" />
          </div>
          <div className="fb-skeleton-list" aria-hidden="true">
            <div className="fb-skeleton-card" />
            <div className="fb-skeleton-card" />
            <div className="fb-skeleton-card" />
            <div className="fb-skeleton-card" />
          </div>
        </div>
      )}

      {isEmpty && (
        <Card padding="lg" className="mb-6">
          <Stack gap={2} className="items-center py-8 text-center">
            <p className="text-text-secondary">No features defined yet.</p>
            <p className="max-w-sm text-sm text-text-tertiary">
              Create <code>.feature.yaml</code> documents in your features directory to see them
              here.
            </p>
            <Button variant="secondary" size="sm" onClick={() => void load()}>
              Refresh
            </Button>
          </Stack>
        </Card>
      )}

      {!loading && !error && !isEmpty && (
        <>
          <Grid cols={4} gap={4} className="mb-6">
            <StatCard label="Total Features" value={features.length} hint={`${documents} documents`} />
            <StatCard label="Approved" value={approvedCount} hint="features approved" />
            <StatCard label="Coverage" value={`${coverage}%`} hint="features traced" />
            <StatCard label="Documents" value={documents} hint="loaded" />
          </Grid>

          <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
            <aside
              className={`fb-sidebar ${selectedId ? 'hidden lg:block' : 'block'}`}
              aria-label="Feature filters and list"
            >
              <Stack gap={4}>
                <Input
                  label="Search features"
                  placeholder="Search features…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  leftIcon={<span aria-hidden="true">🔍</span>}
                  fullWidth
                />

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="fb-domain" className="text-sm font-medium text-text-primary">
                    Domain
                  </label>
                  <select
                    id="fb-domain"
                    value={domainFilter}
                    onChange={(e) => setDomainFilter(e.target.value)}
                    className="h-10 w-full rounded-lg border border-border bg-surface-primary px-3 text-sm text-text-primary transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  >
                    <option value="all">All domains</option>
                    {domains.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div
                  role="group"
                  aria-label="Filter by status"
                  className="flex flex-wrap gap-2"
                >
                  {(['all', ...STATUS_ORDER] as const).map((opt) => {
                    const isActive = statusFilter === opt;
                    const count = statusCounts[opt] ?? 0;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setStatusFilter(opt)}
                        aria-pressed={isActive}
                        className={`fb-filter-chip ${isActive ? 'is-active' : ''}`}
                      >
                        {opt === 'all' ? 'All' : STATUS_CONFIG[opt as FacStatus].label}
                        <span className="fb-filter-count">{count}</span>
                      </button>
                    );
                  })}
                </div>

                <div
                  ref={listRef}
                  role="listbox"
                  aria-label="Features"
                  tabIndex={-1}
                  onKeyDown={handleListKeyDown}
                  className="fb-list"
                >
                  {noResults ? (
                    <p className="py-6 text-center text-sm text-text-tertiary" role="status">
                      No features found for “{deferredQuery}”.
                      <br />
                      Try a different search.
                    </p>
                  ) : (
                    filtered.map((f, i) => (
                      <FeatureCard
                        key={f.id}
                        feature={f}
                        isSelected={selectedId === f.id}
                        onSelect={selectFeature}
                        tabIndex={i === activeIndex ? 0 : -1}
                      />
                    ))
                  )}
                </div>

                <p className="text-xs text-text-tertiary">
                  {filtered.length} {filtered.length === 1 ? 'feature' : 'features'} · {documents}{' '}
                  {documents === 1 ? 'document' : 'documents'}
                </p>
              </Stack>
            </aside>

            <section
              className={`fb-detail ${selectedId ? 'block' : 'hidden lg:block'}`}
              aria-label="Feature detail"
            >
              {!selectedId && (
                <Card padding="lg" className="h-full">
                  <Stack gap={2} className="items-center py-12 text-center">
                    <span aria-hidden="true" className="text-4xl">📋</span>
                    <p className="text-text-secondary">Select a feature to view its details.</p>
                    <p className="max-w-sm text-sm text-text-tertiary">
                      Choose a feature from the list to inspect its description, user stories,
                      and trace links.
                    </p>
                  </Stack>
                </Card>
              )}

              {selectedId && detailLoading && (
                <Card padding="lg">
                  <p className="text-sm text-text-tertiary" role="status">
                    Loading feature…
                  </p>
                </Card>
              )}

              {selectedId && detailError && (
                <Card padding="lg" className="border border-error-500/40">
                  <Stack gap={3}>
                    <p className="text-sm text-error-600 dark:text-error-400" role="alert">
                      {detailError}
                    </p>
                    <div>
                      <Button variant="secondary" size="sm" onClick={() => setSelectedId(selectedId)}>
                        Retry
                      </Button>
                    </div>
                  </Stack>
                </Card>
              )}

              {selectedId && selectedFeature && !detailLoading && (
                <FeatureDetail feature={selectedFeature} onBack={() => setSelectedId(null)} />
              )}
            </section>
          </div>
        </>
      )}
    </Container>
  );
}
