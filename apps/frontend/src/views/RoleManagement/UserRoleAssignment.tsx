import { useState, useCallback, useEffect, useRef } from 'react';
import type { Role } from '@nexus-engineering/shared';
import { Button, Badge, Alert, Input, Select } from '@nexus-engineering/shared';
import { fetchUsersWithRoles, updateUserRole } from '../../api/rbac';
import type { UserWithRole } from '../../api/rbac';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface UserRoleAssignmentProps {
  availableRoles: Role[];
}

export function UserRoleAssignment({ availableRoles }: UserRoleAssignmentProps) {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleChangeTarget, setRoleChangeTarget] = useState<{ userId: string; userEmail: string; newRoleId: string; newRoleName: string; oldRoleId: string | null } | null>(null);

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

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleRoleChangeSelect = (userId: string, userEmail: string, roleId: string, roleName: string, oldRoleId: string | null) => {
    setRoleChangeTarget({ userId, userEmail, newRoleId: roleId, newRoleName: roleName, oldRoleId });
  };

  const handleRoleChangeConfirm = async () => {
    if (!roleChangeTarget) return;
    setError(null);
    setSuccess(null);
    const success = await updateUserRole(roleChangeTarget.userId, roleChangeTarget.newRoleId);
    if (success) {
      setSuccess(`User role updated successfully`);
      setTimeout(() => setSuccess(null), 3000);
      loadUsers();
      setRoleChangeTarget(null);
    } else {
      setError('Failed to update user role. Please try again.');
    }
  };

  const handleRoleChangeUndo = async () => {
    if (!roleChangeTarget) return;
    setError(null);
    const success = await updateUserRole(roleChangeTarget.userId, roleChangeTarget.oldRoleId ?? '');
    if (success) {
      setSuccess(`Role change reverted for ${roleChangeTarget.userEmail}`);
      setTimeout(() => setSuccess(null), 3000);
      loadUsers();
    }
    setRoleChangeTarget(null);
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(search.toLowerCase()) ||
    (user.displayName && user.displayName.toLowerCase().includes(search.toLowerCase()))
  );

  const getRoleBadgeVariant = (roleName?: string) => {
    switch (roleName) {
      case 'Admin':
        return 'critical';
      case 'Editor':
        return 'high';
      default:
        return 'implemented';
    }
  };

  const roleSelectOptions = [{ value: '', label: 'Select role' }, ...availableRoles.map(r => ({ value: r.id, label: r.name }))];

  return (
    <>
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
        <Alert variant="success">
          {success}
        </Alert>
      )}

      {error && (
        <Alert variant="error">
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
                      <Badge variant={getRoleBadgeVariant(user.role.name)}>
                        {user.role.name}
                      </Badge>
                    ) : (
                      <span className="text-text-tertiary">No role</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                      <Select
                        value={user.roleId || ''}
                        onChange={e => {
                          const role = availableRoles.find(r => r.id === e.target.value);
                          if (role) handleRoleChangeSelect(user.id, user.email, e.target.value, role.name, user.roleId);
                        }}
                        options={roleSelectOptions}
                        aria-label={`Assign role to ${user.email}`}
                      />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
    {roleChangeTarget && (
      <RoleChangeConfirmModal
        target={roleChangeTarget}
        onConfirm={() => {
          setRoleChangeTarget(null);
          handleRoleChangeConfirm();
        }}
        onCancel={() => setRoleChangeTarget(null)}
        onUndo={() => {
          setRoleChangeTarget(null);
          handleRoleChangeUndo();
        }}
      />
    )}
    </>
  );
}

function RoleChangeConfirmModal({ target, onConfirm, onCancel, onUndo }: {
  target: { userId: string; userEmail: string; newRoleId: string; newRoleName: string; oldRoleId: string | null };
  onConfirm: () => void;
  onCancel: () => void;
  onUndo: () => void;
}) {
  const modalRef = useRef<HTMLDivElement>(null);
  useFocusTrap(modalRef, true);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" role="dialog" aria-modal="true" aria-label="Confirm role change">
      <div ref={modalRef} className="w-full max-w-md rounded-xl bg-surface-primary p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-text-primary">Confirm Role Change</h3>
        <p className="mt-2 text-sm text-text-secondary">
          Change role for <span className="font-medium text-text-primary">{target.userEmail}</span> to{' '}
          <span className="font-medium text-text-primary">{target.newRoleName}</span>?
        </p>
        <div className="mt-4 text-xs text-text-tertiary">
          Current role: <span className="font-medium">{target.oldRoleId ? 'Existing role' : 'No role'}</span>
        </div>
        <div className="mt-6 flex items-center justify-between">
          {target.oldRoleId && (
            <Button variant="ghost" size="sm" onClick={onUndo}>
              Undo
            </Button>
          )}
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
            <Button variant="primary" onClick={onConfirm}>
              Confirm
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
