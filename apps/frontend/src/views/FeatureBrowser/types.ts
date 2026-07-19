import type { FacFeature, FacStatus } from '../../api/client';

export type { FacFeature, FacStatus, FacUserStory, FacTraceLink, FacAcceptanceCriterion } from '../../api/client';

export interface StatusConfig {
  label: string;
  /** Non-color signal for color-independent status (per a11y spec). */
  icon: string;
  badge: string;
}

export const STATUS_CONFIG: Record<FacStatus, StatusConfig> = {
  draft: { label: 'Draft', icon: '○', badge: 'draft' },
  approved: { label: 'Approved', icon: '●', badge: 'approved' },
  implemented: { label: 'Implemented', icon: '◐', badge: 'implemented' },
  deprecated: { label: 'Deprecated', icon: '×', badge: 'deprecated' },
};

export const STATUS_ORDER: FacStatus[] = ['draft', 'approved', 'implemented', 'deprecated'];

export const TRACE_LABELS: Record<string, string> = {
  satisfies: 'satisfies',
  dependsOn: 'depends on',
  tracesTo: 'traces to',
  refines: 'refines',
  conflictsWith: 'conflicts with',
  derivedFrom: 'derived from',
};

/** Resolve a status config, defaulting to draft when status is absent. */
export function getStatusConfig(status: FacStatus | undefined): StatusConfig {
  return STATUS_CONFIG[status ?? 'draft'];
}
