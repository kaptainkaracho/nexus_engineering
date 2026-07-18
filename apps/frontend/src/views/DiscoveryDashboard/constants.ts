import type { ArtifactType, LifecycleState } from '../../api/client';

export const LIFECYCLE_ORDER: LifecycleState[] = [
  'discovered',
  'parsed',
  'indexed',
  'related',
  'error',
];

export const TYPE_ORDER: ArtifactType[] = [
  'requirement',
  'architecture',
  'adr',
  'spec',
  'unknown',
];

export const LIFECYCLE_LABEL: Record<LifecycleState, string> = {
  discovered: 'Discovered',
  parsed: 'Parsed',
  indexed: 'Indexed',
  related: 'Related',
  error: 'Error',
};

export const TYPE_LABEL: Record<ArtifactType, string> = {
  requirement: 'Requirements',
  architecture: 'Architecture',
  adr: 'ADRs',
  spec: 'Specs',
  unknown: 'Unknown',
};

/** Human-friendly file name fallback when backend omits fileName */
export function artifactName(artifact: {
  fileName?: string;
  relativePath?: string;
  filePath: string;
}): string {
  return (
    artifact.fileName ||
    artifact.relativePath?.split('/').pop() ||
    artifact.filePath.split('/').pop() ||
    artifact.filePath
  );
}

/** Human-friendly relative path fallback */
export function artifactPath(artifact: {
  relativePath?: string;
  filePath: string;
}): string {
  return artifact.relativePath || artifact.filePath;
}

/** Relative time formatter (e.g. "2h ago") */
export function relativeTime(iso: string | undefined): string {
  if (!iso) return '—';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '—';
  const diffMs = Date.now() - then;
  const sec = Math.round(diffMs / 1000);
  if (sec < 60) return 'just now';
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day}d ago`;
  return new Date(iso).toLocaleDateString();
}
