import { useCallback, useEffect, useState } from 'react';
import { Button, Card, Container, Stack } from '@nexus-engineering/shared';
import { fetchAuditLogs, exportAuditLogs, type AuditLogEntry, type AuditLogFilter } from '../../api/client';
import { AuditLogFilters } from './AuditLogFilters';
import { AuditLogTable } from './AuditLogTable';
import { AuditLogEntryDetails } from './AuditLogEntryDetails';

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
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [orgFilter, setOrgFilter] = useState('');
  const [exporting, setExporting] = useState<'csv' | 'json' | null>(null);

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
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      orgId: orgFilter || undefined,
    });
    setExpandedRow(null);
  }, [actionFilter, resourceTypeFilter, searchText, startDate, endDate, orgFilter]);

  const handleResetFilters = useCallback(() => {
    setActionFilter('');
    setResourceTypeFilter('');
    setSearchText('');
    setStartDate('');
    setEndDate('');
    setOrgFilter('');
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

  const handleExport = useCallback(
    async (format: 'csv' | 'json') => {
      setExporting(format);
      try {
        const blob = await exportAuditLogs(format, {
          action: actionFilter || undefined,
          resourceType: resourceTypeFilter || undefined,
          orgId: orgFilter || undefined,
          search: searchText || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        });
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `audit-logs.${format}`;
          a.click();
          URL.revokeObjectURL(url);
        }
      } finally {
        setExporting(null);
      }
    },
    [actionFilter, resourceTypeFilter, searchText, startDate, endDate, orgFilter],
  );

  const handleToggleRow = useCallback(
    (id: string) => setExpandedRow((prev) => (prev === id ? null : id)),
    [],
  );

  const isDefaultFilter = !actionFilter && !resourceTypeFilter && !searchText && !startDate && !endDate && !orgFilter;

  const expandedEntry = expandedRow ? logs.find((l) => l.id === expandedRow) ?? null : null;

  return (
    <Container size="lg">
      <Stack gap={6}>
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Audit Log</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Track all actions performed across the system. Filter by action type, resource, or search for specific events.
          </p>
        </div>

        <AuditLogFilters
          actionFilter={actionFilter}
          resourceTypeFilter={resourceTypeFilter}
          searchText={searchText}
          startDate={startDate}
          endDate={endDate}
          orgFilter={orgFilter}
          isDefaultFilter={isDefaultFilter}
          onActionFilterChange={setActionFilter}
          onResourceTypeFilterChange={setResourceTypeFilter}
          onSearchTextChange={setSearchText}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onOrgFilterChange={setOrgFilter}
          onApply={handleApplyFilters}
          onReset={handleResetFilters}
        />

        <div aria-live="polite" aria-atomic="true">
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
        </div>

        {!loading && !loadError && logs.length > 0 && (
          <>
            <AuditLogTable
              logs={logs}
              total={total}
              currentPage={currentPage}
              totalPages={totalPages}
              offset={offset}
              limit={limit}
              expandedRow={expandedRow}
              exporting={exporting}
              onToggleRow={handleToggleRow}
              onPageChange={handlePageChange}
              onExport={handleExport}
            />

            {expandedEntry && <AuditLogEntryDetails entry={expandedEntry} />}
          </>
        )}
      </Stack>
    </Container>
  );
}

export default AuditLogViewer;
