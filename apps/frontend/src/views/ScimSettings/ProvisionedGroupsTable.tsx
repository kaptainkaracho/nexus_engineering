import { useCallback, useEffect, useState } from 'react';
import { Button, Card, Stack } from '@nexus-engineering/shared';
import { RefreshCw, UsersRound, ChevronDown, ChevronUp } from 'lucide-react';
import type { ScimGroup } from '@nexus-engineering/shared';
import { fetchProvisionedGroups } from '../../api/scim';

export function ProvisionedGroupsTable() {
  const [groups, setGroups] = useState<ScimGroup[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const pageSize = 20;

  const loadGroups = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const result = await fetchProvisionedGroups({
        startIndex: (page - 1) * pageSize + 1,
        count: pageSize,
      });
      setGroups(result.Resources);
      setTotalResults(result.totalResults);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page]);

  useEffect(() => { void loadGroups(); }, [loadGroups]);

  const totalPages = Math.ceil(totalResults / pageSize);

  return (
    <Card padding="lg">
      <Stack gap={4}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info-50 text-info-600 dark:bg-info-950 dark:text-info-300">
              <UsersRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Provisioned Groups</h2>
              <p className="text-sm text-text-tertiary">
                {totalResults} group{totalResults !== 1 ? 's' : ''} synced from identity providers
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            icon={<RefreshCw className="h-4 w-4" />}
            loading={refreshing}
            onClick={() => void loadGroups(true)}
            aria-label="Refresh group list"
          >
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary-500" />
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <UsersRound className="h-12 w-12 text-text-tertiary" />
            <h3 className="text-lg font-semibold text-text-primary">No Groups Found</h3>
            <p className="max-w-md text-sm text-text-tertiary">
              No groups have been provisioned yet. Configure group attribute mappings in your IdP to sync groups.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm" aria-label="Provisioned groups">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-text-tertiary">
                    <th className="p-3 font-semibold" scope="col">Group Name</th>
                    <th className="p-3 font-semibold" scope="col">Description</th>
                    <th className="p-3 font-semibold" scope="col">Members</th>
                    <th className="p-3 font-semibold" scope="col">Last Modified</th>
                    <th className="w-10 p-3 font-semibold" scope="col">
                      <span className="sr-only">Expand</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((group) => (
                    <>
                      <tr
                        key={group.id}
                        className="border-b border-border transition-colors hover:bg-surface-secondary/50"
                      >
                        <td className="p-3 font-medium text-text-primary">{group.displayName}</td>
                        <td className="p-3 text-text-secondary text-xs max-w-xs truncate">
                          {group.description || '—'}
                        </td>
                        <td className="p-3">
                          <span className="inline-flex items-center rounded-full bg-neutral-50 px-2 py-0.5 text-xs font-medium text-neutral-700 dark:bg-neutral-950 dark:text-neutral-300">
                            {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                          </span>
                        </td>
                        <td className="p-3 text-xs text-text-tertiary">
                          {group.meta?.lastModified
                            ? new Date(group.meta.lastModified).toLocaleDateString()
                            : '—'}
                        </td>
                        <td className="p-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedGroup(expandedGroup === group.id ? null : group.id)}
                            aria-label={expandedGroup === group.id ? `Collapse ${group.displayName}` : `Expand ${group.displayName}`}
                            aria-expanded={expandedGroup === group.id}
                          >
                            {expandedGroup === group.id
                              ? <ChevronUp className="h-4 w-4" />
                              : <ChevronDown className="h-4 w-4" />}
                          </Button>
                        </td>
                      </tr>
                      {expandedGroup === group.id && group.members.length > 0 && (
                        <tr key={`${group.id}-members`} className="border-b border-border">
                          <td colSpan={5} className="bg-surface-secondary/50 p-4">
                            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-text-tertiary">
                              Members
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {group.members.map((member) => (
                                <span
                                  key={member.value}
                                  className="inline-flex items-center rounded-full bg-surface-primary border border-border px-3 py-1 text-xs text-text-secondary"
                                >
                                  {member.display || member.value}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border pt-4">
                <p className="text-xs text-text-tertiary">
                  Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalResults)} of {totalResults}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Stack>
    </Card>
  );
}
