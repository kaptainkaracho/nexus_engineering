import { useEffect, useRef } from 'react';
import { Button, Stack } from '@nexus-engineering/shared';
import type { DiscoveryArtifact } from '../../api/client';
import { LIFECYCLE_LABEL, TYPE_LABEL, artifactName, artifactPath, relativeTime } from './constants';

interface ArtifactDetailPanelProps {
  artifact: DiscoveryArtifact | null;
  onClose: () => void;
  onReparse: (id: string) => void;
  reparsing: boolean;
}

export function ArtifactDetailPanel({
  artifact,
  onClose,
  onReparse,
  reparsing,
}: ArtifactDetailPanelProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const open = artifact !== null;

  useEffect(() => {
    if (open) {
      dialogRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!artifact) return null;

  const titleId = 'artifact-detail-title';
  const descId = 'artifact-detail-desc';

  return (
    <div className="fixed inset-0 z-40 flex justify-end" role="presentation">
      <div
        className="absolute inset-0 bg-neutral-900/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        tabIndex={-1}
        className="dash-panel relative z-10 flex h-full w-full max-w-md flex-col bg-surface-primary shadow-xl focus:outline-none"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border p-4">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2">
              <span className={`dash-badge dash-badge--type-${artifact.type}`}>
                {TYPE_LABEL[artifact.type]}
              </span>
              <span className={`dash-badge dash-badge--${artifact.lifecycle}`}>
                {LIFECYCLE_LABEL[artifact.lifecycle]}
              </span>
            </div>
            <h3 id={titleId} className="truncate text-base font-semibold text-text-primary">
              {artifactName(artifact)}
            </h3>
            <p id={descId} className="truncate text-xs text-text-tertiary">
              {artifactPath(artifact)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close artifact details"
          >
            ✕
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <Stack gap={5}>
            <MetaGroup title="Details">
              <Meta label="ID" value={artifact.id} mono />
              <Meta label="Type" value={TYPE_LABEL[artifact.type]} />
              <Meta label="Lifecycle" value={LIFECYCLE_LABEL[artifact.lifecycle]} />
              <Meta label="Repository" value={artifact.repositoryPath} mono />
              <Meta label="Reparse count" value={String(artifact.reparseCount)} />
              <Meta label="Discovered" value={relativeTime(artifact.createdAt)} />
              <Meta label="Updated" value={relativeTime(artifact.updatedAt)} />
              {artifact.lastParsedAt && (
                <Meta label="Last parsed" value={relativeTime(artifact.lastParsedAt)} />
              )}
            </MetaGroup>

            <a
              href="#repository"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 transition-colors hover:text-primary-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              aria-label={`Open ${artifactName(artifact)} in Repository Tree`}
            >
              View in Repository Tree &rarr;
            </a>

            {artifact.errors.length > 0 && (
              <MetaGroup title={`Error history (${artifact.errors.length})`}>
                <ul className="flex flex-col gap-2">
                  {artifact.errors.map((err, i) => (
                    <li
                      key={`${err.timestamp}-${i}`}
                      className="rounded-md border border-border bg-surface-secondary p-3"
                    >
                      <p className="text-sm text-error-600 dark:text-error-400">{err.message}</p>
                      <p className="mt-1 text-xs text-text-tertiary">{relativeTime(err.timestamp)}</p>
                    </li>
                  ))}
                </ul>
              </MetaGroup>
            )}

            <MetaGroup title="Metadata">
              {Object.keys(artifact.metadata).length === 0 ? (
                <p className="text-sm text-text-tertiary">No metadata recorded.</p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {Object.entries(artifact.metadata).map(([k, v]) => (
                    <li key={k} className="flex gap-2 text-xs">
                      <span className="text-text-tertiary">{k}:</span>
                      <span className="text-text-secondary">{String(v)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </MetaGroup>
          </Stack>
        </div>

        <div className="border-t border-border p-4">
          <Button
            variant="secondary"
            fullWidth
            loading={reparsing}
            disabled={reparsing}
            onClick={() => onReparse(artifact.id)}
          >
            Reparse artifact
          </Button>
        </div>
      </div>
    </div>
  );
}

function MetaGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-text-tertiary">
        {title}
      </h4>
      {children}
    </div>
  );
}

function Meta({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-0.5">
      <span className="text-xs text-text-tertiary">{label}</span>
      <span className={`text-right text-sm text-text-primary ${mono ? 'font-mono text-xs' : ''}`}>
        {value}
      </span>
    </div>
  );
}
