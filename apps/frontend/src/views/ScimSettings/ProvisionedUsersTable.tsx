import { useCallback, useEffect, useState } from 'react';
import { Button, Card, Stack } from '@nexus-engineering/shared';
import { Search, Users, RefreshCw } from 'lucide-react';
import type { ScimUser } from '@nexus-engineering/shared';
import { fetchProvisionedUsers } from '../../api/scim';

export function ProvisionedUsersTable() {
  const [users, setUsers] = useState<ScimUser[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const loadUsers = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const filter = search ? `userName co "${search}" or displayName co "${search}"` : undefined;
      const result = await fetchProvisionedUsers({
        startIndex: (page - 1) * pageSize + 1,
        count: pageSize,
        filter,
      });
      setUsers(result.Resources);
      setTotalResults(result.totalResults);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, search]);

  useEffect(() => { void loadUsers(); }, [loadUsers]);

  const totalPages = Math.ceil(totalResults / pageSize);

  return (
    <Card padding="lg">
      <Stack gap={4}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary-50 text-secondary-600 dark:bg-secondary-950 dark:text-secondary-300">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Provisioned Users</h2>
              <p className="text-sm text-text-tertiary">
                {totalResults} user{totalResults !== 1 ? 's' : ''} synced from identity providers
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            icon={<RefreshCw className="h-4 w-4" />}
            loading={refreshing}
            onClick={() => void loadUsers(true)}
            aria-label="Refresh user list"
          >
            Refresh
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
          <input
            type="search"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-border bg-surface-primary py-2 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-tertiary focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            aria-label="Search provisioned users"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary-500" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <Users className="h-12 w-12 text-text-tertiary" />
            <h3 className="text-lg font-semibold text-text-primary">No Users Found</h3>
            <p className="max-w-md text-sm text-text-tertiary">
              {search
                ? 'No users match your search. Try a different query.'
                : 'No users have been provisioned yet. Enable SCIM and configure your IdP to start syncing.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm" aria-label="Provisioned users">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-text-tertiary">
                    <th className="p-3 font-semibold" scope="col">User</th>
                    <th className="p-3 font-semibold" scope="col">Email</th>
                    <th className="p-3 font-semibold" scope="col">Status</th>
                    <th className="p-3 font-semibold" scope="col">Source IdP</th>
                    <th className="p-3 font-semibold" scope="col">Roles</th>
                    <th className="p-3 font-semibold" scope="col">Last Sync</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-border transition-colors hover:bg-surface-secondary/50">
                      <td className="p-3">
                        <div>
                          <p className="font-medium text-text-primary">{user.displayName}</p>
                          <p className="text-xs text-text-tertiary">{user.userName}</p>
                        </div>
                      </td>
                      <td className="p-3 text-text-secondary font-mono text-xs">{user.userName}</td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            user.active
                              ? 'bg-success-50 text-success-700 dark:bg-success-950 dark:text-success-300'
                              : 'bg-neutral-50 text-neutral-700 dark:bg-neutral-950 dark:text-neutral-300'
                          }`}
                        >
                          {user.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-3 text-text-secondary text-xs">
                        {user.ssoProvider || '—'}
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {user.roles.map((role) => (
                            <span
                              key={role}
                              className="inline-flex items-center rounded bg-primary-50 px-1.5 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-950 dark:text-primary-300"
                            >
                              {role}
                            </span>
                          ))}
                          {user.roles.length === 0 && (
                            <span className="text-xs text-text-tertiary">—</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-xs text-text-tertiary">
                        {user.lastSyncAt
                          ? new Date(user.lastSyncAt).toLocaleDateString()
                          : '—'}
                      </td>
                    </tr>
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
