import { useCallback } from 'react';
import { Button, Card, Stack } from '@nexus-engineering/shared';
import { ACTIONS, RESOURCE_TYPES } from './constants';

interface AuditLogFiltersProps {
  actionFilter: string;
  resourceTypeFilter: string;
  searchText: string;
  startDate: string;
  endDate: string;
  orgFilter: string;
  isDefaultFilter: boolean;
  onActionFilterChange: (value: string) => void;
  onResourceTypeFilterChange: (value: string) => void;
  onSearchTextChange: (value: string) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onOrgFilterChange: (value: string) => void;
  onApply: () => void;
  onReset: () => void;
}

const inputClass =
  'w-full rounded-lg border border-border bg-surface-primary px-3 py-2 text-sm text-text-primary transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500';

const labelClass = 'mb-1 block text-xs font-medium text-text-tertiary uppercase tracking-wide';

export function AuditLogFilters({
  actionFilter,
  resourceTypeFilter,
  searchText,
  startDate,
  endDate,
  orgFilter,
  isDefaultFilter,
  onActionFilterChange,
  onResourceTypeFilterChange,
  onSearchTextChange,
  onStartDateChange,
  onEndDateChange,
  onOrgFilterChange,
  onApply,
  onReset,
}: AuditLogFiltersProps) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') onApply();
    },
    [onApply],
  );

  return (
    <Card padding="lg">
      <Stack gap={4}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
          <div className="flex-1">
            <label htmlFor="audit-action-filter" className={labelClass}>
              Action
            </label>
            <select
              id="audit-action-filter"
              value={actionFilter}
              onChange={(e) => onActionFilterChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className={inputClass}
            >
              {ACTIONS.map((a) => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label htmlFor="audit-resource-filter" className={labelClass}>
              Resource
            </label>
            <select
              id="audit-resource-filter"
              value={resourceTypeFilter}
              onChange={(e) => onResourceTypeFilterChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className={inputClass}
            >
              {RESOURCE_TYPES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label htmlFor="audit-start-date" className={labelClass}>
              From Date
            </label>
            <input
              id="audit-start-date"
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex-1">
            <label htmlFor="audit-end-date" className={labelClass}>
              To Date
            </label>
            <input
              id="audit-end-date"
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              min={startDate || undefined}
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
          <div className="flex-1">
            <label htmlFor="audit-org-filter" className={labelClass}>
              Org ID
            </label>
            <input
              id="audit-org-filter"
              type="text"
              value={orgFilter}
              onChange={(e) => onOrgFilterChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Filter by org…"
              className={inputClass}
            />
          </div>
          <div className="flex-[2]">
            <label htmlFor="audit-search" className={labelClass}>
              Search
            </label>
            <input
              id="audit-search"
              type="text"
              value={searchText}
              onChange={(e) => onSearchTextChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search by user email, resource ID, or details…"
              className={inputClass}
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button variant="primary" size="sm" onClick={onApply}>
              Apply
            </Button>
            {!isDefaultFilter && (
              <Button variant="ghost" size="sm" onClick={onReset}>
                Reset
              </Button>
            )}
          </div>
        </div>
      </Stack>
    </Card>
  );
}
