import { Card, Stack } from '@nexus-engineering/shared';
import { formatTimestampFull } from './constants';
import type { AuditLogEntry } from '../../api/client';

interface AuditLogEntryDetailsProps {
  entry: AuditLogEntry;
}

export function AuditLogEntryDetails({ entry }: AuditLogEntryDetailsProps) {
  return (
    <Card variant="outlined" padding="md" role="region" aria-label="Entry details" id="audit-entry-details">
      <Stack gap={3}>
        <h4 className="text-sm font-semibold text-text-primary">Entry Details</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <span className="text-xs font-medium text-text-tertiary">ID</span>
            <p className="font-mono text-sm text-text-primary break-all">{entry.id}</p>
          </div>
          <div>
            <span className="text-xs font-medium text-text-tertiary">Timestamp</span>
            <p className="text-sm text-text-primary">{formatTimestampFull(entry.timestamp)}</p>
          </div>
          <div>
            <span className="text-xs font-medium text-text-tertiary">User</span>
            <p className="text-sm text-text-primary">{entry.userEmail} ({entry.userId.slice(0, 8)})</p>
          </div>
          <div>
            <span className="text-xs font-medium text-text-tertiary">Action</span>
            <p className="text-sm text-text-primary">{entry.action}</p>
          </div>
          <div>
            <span className="text-xs font-medium text-text-tertiary">Resource</span>
            <p className="text-sm text-text-primary">{entry.resourceType} / {entry.resourceId}</p>
          </div>
          <div>
            <span className="text-xs font-medium text-text-tertiary">IP Address</span>
            <p className="text-sm font-mono text-text-primary">{entry.ipAddress ?? '—'}</p>
          </div>
          <div className="sm:col-span-2">
            <span className="text-xs font-medium text-text-tertiary">Details</span>
            <p className="text-sm text-text-primary whitespace-pre-wrap">{entry.details ?? 'No additional details.'}</p>
          </div>
        </div>
      </Stack>
    </Card>
  );
}
