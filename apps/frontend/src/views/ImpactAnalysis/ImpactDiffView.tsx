import type { ImpactAnalysisData } from '../../api/client';
import { BLAST_RADIUS_COLORS, BlastRadiusLevel } from './BlastRadiusOverlay';

interface ImpactDiffViewProps {
  before: ImpactAnalysisData | null;
  after: ImpactAnalysisData;
  onCaptureBaseline: () => void;
}

interface DiffArtifact {
  id: string;
  type: string;
  title: string;
  impactLevel: 'direct' | 'indirect' | 'transitive';
  relationshipType: string;
  confidenceScore: number;
}

function toDiff(a: ImpactAnalysisData['artifacts'][number]): DiffArtifact {
  return {
    id: a.id,
    type: a.type,
    title: a.title,
    impactLevel: a.impactLevel,
    relationshipType: a.relationshipType,
    confidenceScore: a.confidenceScore,
  };
}

function ArtifactRow({ artifact, marker }: { artifact: DiffArtifact; marker?: 'added' | 'removed' | 'unchanged' }) {
  const level = (artifact.impactLevel ?? 'indirect') as BlastRadiusLevel;
  return (
    <li className="flex items-center gap-2 rounded-lg border border-border bg-surface-primary px-3 py-2">
      <span
        className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: BLAST_RADIUS_COLORS[level] }}
        aria-hidden="true"
      />
      <span className="flex-1 truncate text-sm font-medium text-text-primary">{artifact.title}</span>
      <span className="text-xs text-text-tertiary capitalize">{artifact.type}</span>
      {marker === 'added' && (
        <span className="rounded bg-success-50 px-1.5 py-0.5 text-xs font-semibold text-success-700 dark:bg-success-950 dark:text-success-300">
          + added
        </span>
      )}
      {marker === 'removed' && (
        <span className="rounded bg-error-50 px-1.5 py-0.5 text-xs font-semibold text-error-700 dark:bg-error-950 dark:text-error-300">
          − removed
        </span>
      )}
      {marker === 'unchanged' && (
        <span className="rounded bg-surface-tertiary px-1.5 py-0.5 text-xs font-semibold text-text-tertiary">
          unchanged
        </span>
      )}
    </li>
  );
}

export function ImpactDiffView({ before, after, onCaptureBaseline }: ImpactDiffViewProps) {
  if (!before) {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-surface-primary p-8 text-center">
        <span className="text-4xl" aria-hidden="true">⚖️</span>
        <p className="max-w-md text-sm text-text-secondary">
          No baseline captured yet. Run an impact analysis, then capture the current state as a
          baseline. Re-run the analysis after a change to see the before/after diff.
        </p>
        <button
          type="button"
          onClick={onCaptureBaseline}
          className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
        >
          Capture current as baseline
        </button>
      </div>
    );
  }

  const beforeMap = new Map(before.artifacts.map((a) => [a.id, toDiff(a)]));
  const afterList = after.artifacts.map(toDiff);
  const added = afterList.filter((a) => !beforeMap.has(a.id)).map((a) => ({ ...a }));
  const removed = before.artifacts
    .filter((a) => !after.artifacts.some((b) => b.id === a.id))
    .map((a) => ({ ...toDiff(a) }));
  const unchanged = afterList.filter((a) => beforeMap.has(a.id));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Added" value={added.length} tone="success" />
        <StatCard label="Removed" value={removed.length} tone="error" />
        <StatCard label="Unchanged" value={unchanged.length} tone="neutral" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section aria-label="Baseline (before) impact">
          <h3 className="mb-3 text-base font-semibold text-text-primary">
            Before <span className="text-xs font-normal text-text-tertiary">({before.artifactId})</span>
          </h3>
          <ul className="space-y-2">
            {before.artifacts.length === 0 && <EmptyHint label="No affected artifacts in baseline" />}
            {before.artifacts.map((a) => (
              <ArtifactRow
                key={a.id}
                artifact={toDiff(a)}
                marker={removed.some((r) => r.id === a.id) ? 'removed' : 'unchanged'}
              />
            ))}
          </ul>
        </section>

        <section aria-label="Current (after) impact">
          <h3 className="mb-3 text-base font-semibold text-text-primary">
            After <span className="text-xs font-normal text-text-tertiary">({after.artifactId})</span>
          </h3>
          <ul className="space-y-2">
            {after.artifacts.length === 0 && <EmptyHint label="No affected artifacts in current analysis" />}
            {after.artifacts.map((a) => (
              <ArtifactRow
                key={a.id}
                artifact={toDiff(a)}
                marker={added.some((x) => x.id === a.id) ? 'added' : 'unchanged'}
              />
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: 'success' | 'error' | 'neutral' }) {
  const toneClass =
    tone === 'success'
      ? 'text-success-600 dark:text-success-400'
      : tone === 'error'
      ? 'text-error-600 dark:text-error-400'
      : 'text-text-secondary';
  return (
    <div className="rounded-xl border border-border bg-surface-primary p-4 text-center">
      <p className={`text-3xl font-bold ${toneClass}`}>{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wide text-text-tertiary">{label}</p>
    </div>
  );
}

function EmptyHint({ label }: { label: string }) {
  return (
    <li className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-text-tertiary">
      {label}
    </li>
  );
}
