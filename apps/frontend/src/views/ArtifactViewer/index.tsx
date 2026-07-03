import { useState, useMemo, useCallback } from 'react';
import { Card, cn } from '@nexus-engineering/shared';
import {
  sampleRequirements,
  sampleArchitectures,
  sampleComponents,
  sampleTestCases,
  sampleTraces,
  type ArtefactTab,
} from './sample-data';

// Tab config
const TABS: { key: ArtefactTab; label: string }[] = [
  { key: 'requirements', label: 'Requirements' },
  { key: 'architecture', label: 'Architecture' },
  { key: 'components', label: 'Components' },
  { key: 'testcases', label: 'Test Cases' },
  { key: 'traceability', label: 'Traceability' },
];

// Design-system-approved badge variants
type BadgeVariant =
  | 'high' | 'critical' | 'medium' | 'low'
  | 'approved' | 'implemented' | 'verified' | 'proposed' | 'rejected'
  | 'completed' | 'draft' | 'ready' | 'automated' | 'manual' | 'partially-automated'
  | 'satisfies' | 'verifies' | 'tracesTo' | 'dependsOn' | 'refines' | 'conflictsWith'
  | 'block' | 'part' | 'port' | 'unit' | 'info';

const BADGE_VARIANTS: ReadonlySet<BadgeVariant> = new Set([
  'high','critical','medium','low',
  'approved','implemented','verified','proposed','rejected',
  'completed','draft','ready','automated','manual','partially-automated',
  'satisfies','verifies','tracesTo','dependsOn','refines','conflictsWith',
  'block','part','port','unit','info',
] as const);

/** Get badge classes from design tokens */
function getBadgeClasses(variant: string): string {
  const base = 'inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium';
  const palette: Record<BadgeVariant, string> = {
    high: 'bg-warning-500/10 text-warning-700 dark:bg-warning-950 dark:text-warning-300',
    critical: 'bg-error-500/10 text-error-700 dark:bg-error-950 dark:text-error-300',
    medium: 'bg-neutral-500/10 text-neutral-700 dark:bg-neutral-950 dark:text-neutral-300',
    low: 'bg-neutral-500/10 text-neutral-600 dark:bg-neutral-950 dark:text-neutral-400',
    approved: 'bg-success-500/10 text-success-700 dark:bg-success-950 dark:text-success-300',
    implemented: 'bg-primary-500/10 text-primary-700 dark:bg-primary-950 dark:text-primary-300',
    verified: 'bg-primary-500/10 text-primary-700 dark:bg-primary-950 dark:text-primary-300',
    proposed: 'bg-secondary-500/10 text-secondary-700 dark:bg-secondary-950 dark:text-secondary-300',
    rejected: 'bg-error-500/10 text-error-700 dark:bg-error-950 dark:text-error-300',
    completed: 'bg-success-500/10 text-success-700 dark:bg-success-950 dark:text-success-300',
    draft: 'bg-neutral-500/10 text-neutral-600 dark:bg-neutral-950 dark:text-neutral-400',
    ready: 'bg-information-500/10 text-information-700',
    automated: 'bg-primary-500/10 text-primary-700 dark:bg-primary-950 dark:text-primary-300',
    manual: 'bg-neutral-500/10 text-neutral-600 dark:bg-neutral-950 dark:text-neutral-400',
    'partially-automated': 'bg-information-500/10 text-information-700',
    satisfies: 'bg-success-500/10 text-success-700 dark:bg-success-950 dark:text-success-300',
    verifies: 'bg-information-500/10 text-information-700',
    tracesTo: 'bg-info-500/10 text-info-700',
    dependsOn: 'bg-warning-500/10 text-warning-700 dark:bg-warning-950 dark:text-warning-300',
    refines: 'bg-secondary-500/10 text-secondary-700 dark:bg-secondary-950 dark:text-secondary-300',
    conflictsWith: 'bg-error-500/10 text-error-700 dark:bg-error-950 dark:text-error-300',
    block: 'bg-info-500/10 text-info-700',
    part: 'bg-information-500/10 text-information-700',
    port: 'bg-information-500/10 text-information-700',
    unit: 'bg-success-500/10 text-success-700 dark:bg-success-950 dark:text-success-300',
    info: 'bg-info-500/10 text-info-700',
  };
  const isKnown = variant in palette;
  return `${base} ${isKnown ? palette[variant as BadgeVariant] : 'bg-neutral-400/10 text-neutral-600'}`;
}

/** Status/priority badge */
function Badge({ variant, children }: { variant: string; children: React.ReactNode }) {
  return <span className={getBadgeClasses(variant)}>{children}</span>;
}

/** A single artefact card */
function ArtefactCard({ title, type, description, badges, onClick }: { title: string; type: string; description: string; badges?: React.ReactNode; onClick?: () => void }) {
  const content = (
    <div className="flex cursor-pointer flex-col gap-3 p-4 transition-colors duration-150 hover:border-primary-400 hover:shadow-md focus-within:border-primary-500">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-text-tertiary">{type}</span>
        {badges && <div className="flex shrink-0 gap-1">{badges}</div>}
      </div>
      <h3 className="text-base font-semibold text-text-primary">{title}</h3>
      <p className="text-sm text-text-secondary line-clamp-2">{description}</p>
    </div>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="h-full w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500">
        {content}
      </button>
    );
  }
  return content;
}

/** Empty state */
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-16 text-center">
      <p className="text-sm text-text-tertiary">{message}</p>
    </div>
  );
}

/** Artefact detail panel (sidebar) */
function DetailPanel({ item, onBack }: { item: any; onBack: () => void }) {
  if (!item) return null;

  const renderBody = () => {
    // Architecture elements
    if (item.elements?.length || false) {
      return (
        <section aria-label="Architecture elements">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-tertiary">Elements ({item.elements.length})</h4>
          <div className="space-y-1.5" role="list">
            {item.elements.map((el: any) => (
              <Card key={el.id} variant="outlined" padding="sm" className="flex items-center gap-2 !p-3">
                <span className="shrink-0 text-xs font-mono text-text-tertiary">{el.id}</span>
                <span className="font-medium text-sm text-text-primary">{el.name}</span>
                <Badge variant={el.type}>{el.type}</Badge>
              </Card>
            ))}
          </div>
        </section>
      );
    }

    // Test steps
    if (item.testSteps?.length || false) {
      return (
        <section aria-label="Test steps">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-tertiary">Test Steps</h4>
          <ol className="space-y-3" role="list" start={0}>
            {item.testSteps.map((step: any, index: number) => (
              <li key={`step-${index}`} className="flex gap-3">
                <span className="shrink-0 mt-0.5 h-6 w-6 rounded-full bg-primary-500 text-center text-xs font-bold text-white">{step.stepNumber}</span>
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-text-primary">{step.action}</span>
                  {step.expected && <span className="text-xs text-text-secondary">Expected: {step.expected}</span>}
                </div>
              </li>
            ))}
          </ol>
        </section>
      );
    }

    // Component technologies
    if (item.technologies?.length || false) {
      return (
        <section aria-label="Technologies">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-tertiary">Technologies</h4>
          <div className="flex flex-wrap gap-1.5">
            {item.technologies.map((tech: string) => (
              <Badge key={tech} variant="tracesTo">{tech}</Badge>
            ))}
          </div>
        </section>
      );
    }

    return null;
  };

  return (
    <Card variant="elevated" padding="lg">
      <div className="flex flex-col gap-4">
        <button type="button" onClick={onBack} className="text-xs font-medium text-primary-600 hover:text-primary-700 focus:underline focus:outline-none">
          &larr; Back to list
        </button>

        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-text-tertiary">{item.title ? 'Requirement' : item.name ? 'Architecture' : item.name ? 'Component' : 'TestCase'}</span>
          <h2 className="mt-1 text-xl font-bold leading-tight text-text-primary">{item.title || item.name}</h2>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {item.priority && <Badge variant={item.priority}>{item.priority}</Badge>}
          {item.status && <Badge variant={item.status}>{item.status}</Badge>}
          {item.relationshipType && <Badge variant={item.relationshipType}>{item.relationshipType}</Badge>}
          {item.confidence && <Badge variant="info">{item.confidence} confidence</Badge>}
        </div>

        <p className="text-sm text-text-secondary">{item.description}</p>
        {renderBody()}

        <div aria-label="Artefact metadata" className="mt-2 flex flex-wrap gap-4 pt-3 border-t border-border text-xs text-text-tertiary">
          {item.source && <span>Source: {item.source}</span>}
          {item.createdAt && <span>Created: {new Date(item.createdAt).toLocaleDateString()}</span>}
          {item.updatedAt && <span>Updated: {new Date(item.updatedAt).toLocaleDateString()}</span>}
        </div>
      </div>
    </Card>
  );
}

/** Main Artifact Viewer component with tabbed navigation */
export function ArtifactViewer() {
  const [activeTab, setActiveTab] = useState<ArtefactTab>('requirements');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filterItems = useCallback(<T extends { title?: string; name?: string; description: string }>(items: T[], q: string): T[] => {
    if (!q.trim()) return items;
    const lower = q.toLowerCase();
    return items.filter((i) => i.title?.toLowerCase().includes(lower) || i.name?.toLowerCase().includes(lower) || i.description.toLowerCase().includes(lower));
  }, []);

  const filteredReqs = useMemo(() => filterItems(sampleRequirements), [sampleRequirements, query]);
  const filteredArchs = useMemo(() => filterItems(sampleArchitectures), [sampleArchitectures, query]);
  const filteredComps = useMemo(() => filterItems(sampleComponents), [sampleComponents, query]);
  const filteredTests = useMemo(() => filterItems(sampleTestCases), [sampleTestCases, query]);

  /** Find item by ID from active tab data */
  const findItem = (id: string) => {
    switch (activeTab) {
      case 'requirements': return sampleRequirements.find((r) => r.id === id);
      case 'architecture': return sampleArchitectures.find((a) => a.id === id);
      case 'components': return sampleComponents.find((c) => c.id === id);
      case 'testcases': return sampleTestCases.find((t) => t.id === id);
      default: return undefined;
    }
  };

  const selectedItem = selectedId ? findItem(selectedId) : null;

  /** Tab key navigation with Home/End support */
  const handleTabKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveTab(TABS[(index + 1) % TABS.length].key);
      setSelectedId(null);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveTab(TABS[(index - 1 + TABS.length) % TABS.length].key);
      setSelectedId(null);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActiveTab(TABS[0].key);
      setSelectedId(null);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActiveTab(TABS[TABS.length - 1].key);
      setSelectedId(null);
    }
  };

  const tabBaseClasses = 'shrink-0 border-b-[3px] px-4 py-3 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2';

  /** Artefact list for the active tab */
  const renderList = () => {
    if (activeTab === 'requirements') {
      if (!filteredReqs.length) return <EmptyState key="e" message="No requirements match your search." />;
      return filteredReqs.map((r: any) => (
        <ArtefactCard
          key={r.id}
          title={r.title}
          type={`${r.type.charAt(0).toUpperCase() + r.type.slice(1)} Requirement`}
          description={r.description}
          badges={<><Badge variant={r.priority}>{r.priority}</Badge><Badge variant={r.status}>{r.status}</Badge></>}
          onClick={() => { setSelectedId(r.id); }}
        />
      ));
    }
    if (activeTab === 'architecture') {
      if (!filteredArchs.length) return <EmptyState key="e" message="No architecture models match your search." />;
      return filteredArchs.map((a: any) => (
        <ArtefactCard
          key={a.id}
          title={a.name}
          type="Architecture Model"
          description={a.description}
          badges={<Badge variant="block">{a.type}</Badge>}
          onClick={() => { setSelectedId(a.id); }}
        />
      ));
    }
    if (activeTab === 'components') {
      if (!filteredComps.length) return <EmptyState key="e" message="No software components match your search." />;
      return filteredComps.map((c: any) => (
        <ArtefactCard
          key={c.id}
          title={c.name}
          type="Software Component"
          description={c.description}
          badges={<Badge variant={c.language || 'unit'}>{c.language}</Badge>}
          onClick={() => { setSelectedId(c.id); }}
        />
      ));
    }
    if (activeTab === 'testcases') {
      if (!filteredTests.length) return <EmptyState key="e" message="No test cases match your search." />;
      return filteredTests.map((tc: any) => (
        <ArtefactCard
          key={tc.id}
          title={tc.name}
          type={`Test (${tc.type})`}
          description={tc.description}
          badges={<><Badge variant={tc.status}>{tc.status}</Badge><Badge variant={tc.automationStatus}>{tc.automationStatus}</Badge></>}
          onClick={() => { setSelectedId(tc.id); }}
        />
      ));
    }
    if (activeTab === 'traceability') {
      return renderTraceability();
    }
    return <EmptyState message="Tab not implemented." />;
  };

  /** Traceability view: shows cross-artefact links */
  const renderTraceability = () => (
    <table className="w-full caption-bottom text-left text-sm" aria-label="Traceability links">
      <caption className="mb-3 text-sm font-semibold text-text-primary">All Trace Links</caption>
      {!sampleTraces.length ? (
        <EmptyState message="No trace links." />
      ) : (
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wide text-text-tertiary">
            <th className="p-3 font-semibold" scope="col">Source</th>
            <th className="p-3 font-semibold" scope="col">Relationship</th>
            <th className="p-3 font-semibold" scope="col">Target</th>
            <th className="p-3 font-semibold" scope="col">Confidence</th>
          </tr>
        </thead>
      )}
      <tbody>
        {sampleTraces.map((t: any) => {
          const src = sampleRequirements.find((r) => r.id === t.sourceId) || sampleArchitectures[0] || sampleComponents[0];
          const tgt = sampleTestCases.find((tc) => tc.id === t.targetId) || sampleArchitectures[1] || sampleComponents[1];
          return (
            <tr key={t.id} className="border-b border-border transition-colors hover:bg-surface-secondary/50">
              <td className="p-3" data-label="Source">
                <span className="shrink-0 rounded bg-primary-50 dark:bg-primary-950 px-2 py-0.5 text-xs font-medium text-primary-700 dark:text-primary-300">
                  {t.sourceType === 'requirement' ? 'REQ' : t.sourceType === 'architectureModel' ? 'ARCH' : t.sourceType === 'softwareComponent' ? 'COMP' : 'TC'}
                </span>
                <span className="ml-1 text-text-primary">{src?.title || src?.name || 'Unknown'}</span>
              </td>
              <td className="p-3" data-label="Relationship">
                <Badge variant={t.relationshipType}>{t.relationshipType}</Badge>
              </td>
              <td className="p-3" data-label="Target">
                <span className="shrink-0 rounded bg-info-50 dark:bg-info-950 px-2 py-0.5 text-xs font-medium text-info-700">
                  {t.targetType === 'requirement' ? 'REQ' : t.targetType === 'architectureModel' ? 'ARCH' : t.targetType === 'softwareComponent' ? 'COMP' : 'TC'}
                </span>
                <span className="ml-1 text-text-secondary">{tgt?.name || tgt?.title || 'Unknown'}</span>
              </td>
              <td className="p-3" data-label="Confidence">
                <Badge variant={t.confidence}>{t.confidence}</Badge>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  return (
    <section className="flex h-full flex-col gap-6" aria-label="Artifact Viewer">
      {/* Tab list */}
      <nav role="tablist" aria-label="Artefact types" className="w-full overflow-x-auto border-b border-border -mb-px">
        {TABS.map((tab, i) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeTab === tab.key}
            aria-controls={`panel-${tab.key}`}
            id={`tab-${tab.key}`}
            tabIndex={activeTab === tab.key ? 0 : -1}
            onKeyDown={(e) => handleTabKeyDown(i, e)}
            onClick={() => { setActiveTab(tab.key); setSelectedId(null); }}
            className={cn(tabBaseClasses, activeTab === tab.key ? 'border-primary-600 text-primary-600' : 'border-transparent text-text-secondary hover:text-text-primary')}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Search bar */}
      <div role="search" aria-label="Filter artefacts">
        <label htmlFor="artifact-search" className="mb-2 block text-xs font-medium text-text-tertiary">Search artefacts</label>
        <input
          id="artifact-search"
          type="search"
          placeholder="Filter by title or description..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setSelectedId(null); }}
          aria-label="Search artefacts"
          className="w-full rounded-lg border border-border bg-surface-primary px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Content area with detail panel — 8/4 split on larger screens */}
      {selectedItem ? (
        <section aria-labelledby={`tab-${activeTab}`}>
          <div className="grid gap-6" style={{ gridTemplateColumns: '1fr auto' }}>
            <div role="tabpanel" className="min-w-0">
              {renderList()}
            </div>
            <aside role="region" aria-label="Details panel" className="sticky top-6 w-[32rem] shrink-0">
              <DetailPanel item={selectedItem} onBack={() => setSelectedId(null)} />
            </aside>
          </div>
        </section>
      ) : (
        <section id={`panel-${activeTab}`} role="tabpanel" aria-labelledby={`tab-${activeTab}`}>
          {renderList()}
        </section>
      )}

    </section>
  );
}
