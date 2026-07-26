import { useState, useCallback } from 'react';
import type { UserWithRole, Role } from '@nexus-engineering/shared';
import { Button, Badge, Alert, Input } from '@nexus-engineering/shared';
import { fetchUsersWithRoles, updateUserRole } from '../../api/rbac';

interface UserRoleAssignmentProps {
  availableRoles: Role[];
}

export function UserRoleAssignment({ availableRoles }: UserRoleAssignmentProps) {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchUsersWithRoles();
      setUsers(result.users);
    } catch {
      setError('Failed to load users. Please try again.');
    }
    setLoading(false);
  }, []);

  useState(() => {
    loadUsers();
  });

  const handleRoleChange = async (userId: string, roleId: string) => {
    setError(null);
    const success = await updateUserRole(userId, roleId);
    if (success) {
      setSuccess(`User role updated successfully`);
      setTimeout(() => setSuccess(null), 3000);
      loadUsers();
    } else {
      setError('Failed to update user role. Please try again.');
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(search.toLowerCase()) ||
    (user.displayName && user.displayName.toLowerCase().includes(search.toLowerCase()))
  );

  const getRoleColor = (roleName?: string) => {
    switch (roleName) {
      case 'Admin':
        return 'bg-error-100 text-error-700 dark:bg-error-900 dark:text-error-300';
      case 'Editor':
        return 'bg-warning-100 text-warning-700 dark:bg-warning-900 dark:text-warning-300';
      default:
        return 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-text-primary">User Role Assignment</h3>
        <Button variant="ghost" size="sm" onClick={loadUsers} disabled={loading}>
          Refresh
        </Button>
      </div>

      <Input
        label="Search users"
        placeholder="Search by email or name..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        fullWidth
      />

      {success && (
        <Alert variant="success" role="status">
          {success}
        </Alert>
      )}

      {error && (
        <Alert variant="error" role="alert">
          {error}
        </Alert>
      )}

      {loading && users.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-text-tertiary">Loading users...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="rounded-lg border border-border p-8 text-center">
          <p className="text-sm text-text-tertiary">
            {search ? 'No users match your search' : 'No users found'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm" role="table" aria-label="User role assignments">
            <thead>
              <tr className="border-b border-border bg-surface-tertiary">
                <th className="px-4 py-3 text-left font-medium text-text-secondary" scope="col">User</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary" scope="col">Status</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary" scope="col">Current Role</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary" scope="col">Assign Role</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-text-primary">{user.displayName || user.email}</p>
                      <p className="text-xs text-text-tertiary">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={user.isActive ? 'success' : 'secondary'}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {user.role ? (
                      <Badge variant="primary" className={getRoleColor(user.role.name)}>
                        {user.role.name}
                      </Badge>
                    ) : (
                      <span className="text-text-tertiary">No role</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={user.roleId || ''}
                      onChange={e => handleRoleChange(user.id, e.target.value)}
                      className="rounded-lg border border-border bg-surface-primary px-3 py-1.5 text-sm text-text-primary focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      aria-label={`Assign role to ${user.email}`}
                    >
                      <option value="">Select role</option>
                      {availableRoles.map(role => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
