import { useCallback, useEffect, useState } from 'react';
import { Button, Card, Container, Stack } from '@nexus-engineering/shared';
import { fetchAuditLogs, type AuditLogEntry, type AuditLogFilter } from '../../api/client';

const ACTIONS = [
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

const RESOURCE_TYPES = [
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

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-success-500/10 text-success-700 dark:text-success-300',
  UPDATE: 'bg-primary-500/10 text-primary-700 dark:text-primary-300',
  DELETE: 'bg-error-500/10 text-error-700 dark:text-error-300',
  LOGIN: 'bg-info-500/10 text-info-700 dark:text-info-300',
  LOGOUT: 'bg-neutral-500/10 text-neutral-700 dark:text-neutral-300',
  EXPORT: 'bg-warning-500/10 text-warning-700 dark:text-warning-300',
  READ: 'bg-secondary-500/10 text-secondary-700 dark:text-secondary-300',
  ARCHIVE: 'bg-warning-500/10 text-warning-700 dark:text-warning-300',
  RESTORE: 'bg-success-500/10 text-success-700 dark:text-success-300',
};

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatTimestampFull(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString();
}

function emptyFilter(): AuditLogFilter {
  return { limit: 50, offset: 0 };
}

export function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [filter, setFilter] = useState<AuditLogFilter>(emptyFilter);
  const [actionFilter, setActionFilter] = useState('');
  const [resourceTypeFilter, setResourceTypeFilter] = useState('');
  const [searchText, setSearchText] = useState('');

  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const limit = filter.limit ?? 50;
  const offset = filter.offset ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.floor(offset / limit) + 1;

  const loadLogs = useCallback(async (f: AuditLogFilter) => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetchAuditLogs(f);
      setLogs(res.data);
      setTotal(res.total);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load audit logs');
      setLogs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLogs(filter);
  }, [filter, loadLogs]);

  const handleApplyFilters = useCallback(() => {
    setFilter({
      limit: 50,
      offset: 0,
      action: actionFilter || undefined,
      resourceType: resourceTypeFilter || undefined,
      search: searchText || undefined,
    });
    setExpandedRow(null);
  }, [actionFilter, resourceTypeFilter, searchText]);

  const handleResetFilters = useCallback(() => {
    setActionFilter('');
    setResourceTypeFilter('');
    setSearchText('');
    setFilter(emptyFilter());
    setExpandedRow(null);
  }, []);

  const handlePageChange = useCallback(
    (page: number) => {
      const newOffset = (page - 1) * limit;
      setFilter((prev) => ({ ...prev, offset: newOffset }));
      setExpandedRow(null);
    },
    [limit],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleApplyFilters();
    },
    [handleApplyFilters],
  );

  const isDefaultFilter = !actionFilter && !resourceTypeFilter && !searchText;

  return (
    <Container size="lg">
      <Stack gap={6}>
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Audit Log</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Track all actions performed across the system. Filter by action type, resource, or search for specific events.
          </p>
        </div>

        <Card padding="lg">
          <Stack gap={4}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
              <div className="flex-1">
                <label htmlFor="audit-action-filter" className="mb-1 block text-xs font-medium text-text-tertiary uppercase tracking-wide">
                  Action
                </label>
                <select
                  id="audit-action-filter"
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full rounded-lg border border-border bg-surface-primary px-3 py-2 text-sm text-text-primary transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {ACTIONS.map((a) => (
                    <option key={a.value} value={a.value}>{a.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex-1">
                <label htmlFor="audit-resource-filter" className="mb-1 block text-xs font-medium text-text-tertiary uppercase tracking-wide">
                  Resource
                </label>
                <select
                  id="audit-resource-filter"
                  value={resourceTypeFilter}
                  onChange={(e) => setResourceTypeFilter(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full rounded-lg border border-border bg-surface-primary px-3 py-2 text-sm text-text-primary transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {RESOURCE_TYPES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex-[2]">
                <label htmlFor="audit-search" className="mb-1 block text-xs font-medium text-text-tertiary uppercase tracking-wide">
                  Search
                </label>
                <input
                  id="audit-search"
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search by user email, resource ID, or details…"
                  className="w-full rounded-lg border border-border bg-surface-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <Button variant="primary" size="sm" onClick={handleApplyFilters}>
                  Apply
                </Button>
                {!isDefaultFilter && (
                  <Button variant="ghost" size="sm" onClick={handleResetFilters}>
                    Reset
                  </Button>
                )}
              </div>
            </div>
          </Stack>
        </Card>

        {loadError && (
          <Card variant="outlined" padding="md">
            <Stack gap={3}>
              <p className="text-sm text-error-600">Error loading audit logs: {loadError}</p>
              <Button variant="secondary" size="sm" onClick={() => void loadLogs(filter)}>
                Retry
              </Button>
            </Stack>
          </Card>
        )}

        {loading && !loadError && (
          <Card padding="lg">
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary-500" />
                <p className="text-sm text-text-tertiary">Loading audit logs…</p>
              </div>
            </div>
          </Card>
        )}

        {!loading && !loadError && logs.length === 0 && isDefaultFilter && (
          <Card variant="outlined" padding="lg">
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <span className="text-3xl" aria-hidden="true">📋</span>
              <h3 className="text-lg font-semibold text-text-primary">No Audit Logs Yet</h3>
              <p className="max-w-md text-sm text-text-tertiary">
                Audit entries will appear here as users perform actions across the system. No filters are currently active.
              </p>
            </div>
          </Card>
        )}

        {!loading && !loadError && logs.length === 0 && !isDefaultFilter && (
          <Card variant="outlined" padding="lg">
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <span className="text-3xl" aria-hidden="true">🔍</span>
              <h3 className="text-lg font-semibold text-text-primary">No Matching Entries</h3>
              <p className="max-w-md text-sm text-text-tertiary">
                No audit log entries match your current filters. Try adjusting your search criteria or resetting filters.
              </p>
              <Button variant="secondary" size="sm" onClick={handleResetFilters}>
                Reset Filters
              </Button>
            </div>
          </Card>
        )}

        {!loading && !loadError && logs.length > 0 && (
          <>
            <Card padding="lg">
              <Stack gap={3}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium uppercase tracking-wide text-text-tertiary">
                    {total} {total === 1 ? 'Entry' : 'Entries'}
                  </h3>
                  <span className="text-xs text-text-tertiary">
                    Page {currentPage} of {totalPages}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm" aria-label="Audit log entries">
                    <thead>
                      <tr className="border-b border-border text-xs uppercase tracking-wide text-text-tertiary">
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
                          className={`border-b border-border transition-colors hover:bg-surface-secondary/50 cursor-pointer ${
                            expandedRow === entry.id ? 'bg-primary-500/5' : ''
                          }`}
                          onClick={() => setExpandedRow(expandedRow === entry.id ? null : entry.id)}
                          tabIndex={0}
                          role="button"
                          aria-expanded={expandedRow === entry.id}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setExpandedRow(expandedRow === entry.id ? null : entry.id);
                            }
                          }}
                        >
                          <td className="p-3 text-text-primary whitespace-nowrap" title={formatTimestampFull(entry.timestamp)}>
                            {formatTimestamp(entry.timestamp)}
                          </td>
                          <td className="p-3 text-text-secondary max-w-[160px] truncate" title={entry.userEmail}>
                            {entry.userEmail}
                          </td>
                          <td className="p-3">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ACTION_COLORS[entry.action] ?? 'bg-neutral-400/10 text-neutral-600'}`}>
                              {entry.action}
                            </span>
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
                  <div className="flex items-center justify-between border-t border-border pt-4">
                    <span className="text-xs text-text-tertiary">
                      Showing {offset + 1}–{Math.min(offset + limit, total)} of {total}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={currentPage <= 1}
                        onClick={() => handlePageChange(currentPage - 1)}
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
                        onClick={() => handlePageChange(currentPage + 1)}
                        aria-label="Next page"
                      >
                        Next →
                      </Button>
                    </div>
                  </div>
                )}
              </Stack>
            </Card>

            {expandedRow && (
              <Card variant="outlined" padding="md" role="region" aria-label="Entry details">
                {(() => {
                  const entry = logs.find((l) => l.id === expandedRow);
                  if (!entry) return null;
                  return (
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
                  );
                })()}
              </Card>
            )}
          </>
        )}
      </Stack>
    </Container>
  );
}

export default AuditLogViewer;
