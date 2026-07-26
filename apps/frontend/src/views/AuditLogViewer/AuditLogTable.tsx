import { Badge, Button, Card, Stack } from '@nexus-engineering/shared';
import { actionBadgeVariant, formatTimestamp, formatTimestampFull } from './constants';
import type { AuditLogEntry } from '../../api/client';

interface AuditLogTableProps {
  logs: AuditLogEntry[];
  total: number;
  currentPage: number;
  totalPages: number;
  offset: number;
  limit: number;
  expandedRow: string | null;
  exporting: 'csv' | 'json' | null;
  onToggleRow: (id: string) => void;
  onPageChange: (page: number) => void;
  onExport: (format: 'csv' | 'json') => void;
}

export function AuditLogTable({
  logs,
  total,
  currentPage,
  totalPages,
  offset,
  limit,
  expandedRow,
  exporting,
  onToggleRow,
  onPageChange,
  onExport,
}: AuditLogTableProps) {
  return (
    <Card padding="lg">
      <Stack gap={3}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-medium uppercase tracking-wide text-text-tertiary">
              {total} {total === 1 ? 'Entry' : 'Entries'}
            </h3>
            <div className="flex items-center gap-1">
              <span className="text-xs text-text-tertiary">Export</span>
              <Button
                variant="ghost"
                size="sm"
                disabled={exporting === 'csv'}
                onClick={() => onExport('csv')}
                aria-label="Export as CSV"
              >
                {exporting === 'csv' ? 'Exporting…' : 'CSV'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={exporting === 'json'}
                onClick={() => onExport('json')}
                aria-label="Export as JSON"
              >
                {exporting === 'json' ? 'Exporting…' : 'JSON'}
              </Button>
            </div>
          </div>
          <span className="text-xs text-text-tertiary shrink-0">
            Page {currentPage} of {totalPages}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" aria-label="Audit log entries">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-text-tertiary">
                <th className="w-10 p-3" scope="col">
                  <span className="sr-only">Toggle details</span>
                </th>
                <th className="p-3 font-semibold" scope="col">Timestamp</th>
                <th className="p-3 font-semibold" scope="col">User</th>
                <th className="p-3 font-semibold" scope="col">Action</th>
                <th className="hidden p-3 font-semibold sm:table-cell" scope="col">Resource</th>
                <th className="hidden p-3 font-semibold lg:table-cell" scope="col">Details</th>
                <th className="hidden p-3 font-semibold xl:table-cell" scope="col">IP Address</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((entry) => (
                <tr
                  key={entry.id}
                  className={`border-b border-border transition-colors hover:bg-surface-secondary/50 ${
                    expandedRow === entry.id ? 'bg-primary-500/5' : ''
                  }`}
                >
                  <td className="p-3">
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded p-1 text-text-tertiary hover:text-text-primary hover:bg-surface-tertiary transition-colors"
                      onClick={() => onToggleRow(entry.id)}
                      aria-expanded={expandedRow === entry.id}
                      aria-label={`${expandedRow === entry.id ? 'Collapse' : 'Expand'} details for ${entry.userEmail}`}
                    >
                      {expandedRow === entry.id ? '▼' : '▶'}
                    </button>
                  </td>
                  <td className="p-3 text-text-primary whitespace-nowrap" title={formatTimestampFull(entry.timestamp)}>
                    {formatTimestamp(entry.timestamp)}
                  </td>
                  <td className="p-3 text-text-secondary max-w-[160px] truncate" title={entry.userEmail}>
                    {entry.userEmail}
                  </td>
                  <td className="p-3">
                    <Badge variant={actionBadgeVariant(entry.action)}>
                      {entry.action}
                    </Badge>
                  </td>
                  <td className="hidden p-3 sm:table-cell">
                    <span className="text-text-secondary">{entry.resourceType}</span>
                    <span className="ml-1 font-mono text-xs text-text-tertiary">/{entry.resourceId.slice(0, 8)}</span>
                  </td>
                  <td className="hidden max-w-[200px] truncate p-3 text-text-secondary lg:table-cell" title={entry.details ?? ''}>
                    {entry.details ?? '—'}
                  </td>
                  <td className="hidden p-3 font-mono text-xs text-text-tertiary xl:table-cell">
                    {entry.ipAddress ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            offset={offset}
            limit={limit}
            total={total}
            onPageChange={onPageChange}
          />
        )}
      </Stack>
    </Card>
  );
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  offset: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
}

function Pagination({ currentPage, totalPages, offset, limit, total, onPageChange }: PaginationProps) {
  return (
    <div className="flex items-center justify-between border-t border-border pt-4">
      <span className="text-xs text-text-tertiary">
        Showing {offset + 1}–{Math.min(offset + limit, total)} of {total}
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Previous page"
        >
          ← Prev
        </Button>
        <span className="text-xs text-text-tertiary">
          {currentPage} / {totalPages}
        </span>
        <Button
          variant="ghost"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Next page"
        >
          Next →
        </Button>
      </div>
    </div>
  );
}
