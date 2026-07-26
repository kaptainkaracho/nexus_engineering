export const ACTIONS = [
  { value: '', label: 'All Actions' },
  { value: 'CREATE', label: 'Create' },
  { value: 'UPDATE', label: 'Update' },
  { value: 'DELETE', label: 'Delete' },
  { value: 'LOGIN', label: 'Login' },
  { value: 'LOGOUT', label: 'Logout' },
  { value: 'EXPORT', label: 'Export' },
  { value: 'READ', label: 'Read' },
  { value: 'ARCHIVE', label: 'Archive' },
  { value: 'RESTORE', label: 'Restore' },
] as const;

export const RESOURCE_TYPES = [
  { value: '', label: 'All Resources' },
  { value: 'user', label: 'User' },
  { value: 'organization', label: 'Organization' },
  { value: 'team', label: 'Team' },
  { value: 'role', label: 'Role' },
  { value: 'artifact', label: 'Artifact' },
  { value: 'scan', label: 'Scan' },
  { value: 'template', label: 'Template' },
  { value: 'session', label: 'Session' },
] as const;

export function actionBadgeVariant(action: string): string {
  switch (action) {
    case 'CREATE': return 'approved';
    case 'UPDATE': return 'implemented';
    case 'DELETE': return 'critical';
    case 'LOGIN': return 'info';
    case 'LOGOUT': return 'draft';
    case 'EXPORT': return 'performance';
    case 'READ': return 'verified';
    case 'ARCHIVE': return 'partially-automated';
    case 'RESTORE': return 'approved';
    default: return 'draft';
  }
}

export function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTimestampFull(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString();
}
