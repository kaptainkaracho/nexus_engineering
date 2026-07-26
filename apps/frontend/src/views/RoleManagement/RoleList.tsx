import { useState, useCallback, useEffect, useRef } from 'react';
import type { Role } from '@nexus-engineering/shared';
import { Button, Badge, Alert, Input } from '@nexus-engineering/shared';
import { fetchRoles, deleteRole } from '../../api/rbac';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface RoleListProps {
  onEdit: (role: Role) => void;
  onCreate: () => void;
  selectedRole: Role | null;
  onSelectRole: (role: Role | null) => void;
}

interface ConfirmDeleteProps {
  role: Role;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDeleteModal({ role, onConfirm, onCancel }: ConfirmDeleteProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  useFocusTrap(containerRef, true);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" role="dialog" aria-modal="true" aria-label="Confirm delete">
      <div ref={containerRef} className="w-full max-w-md rounded-xl bg-surface-primary p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-text-primary">Delete Role</h3>
        <p className="mt-2 text-sm text-text-secondary">
          Are you sure you want to delete the role &ldquo;{role.name}&rdquo;? This action cannot be undone.
        </p>
        {role.isSystem && (
          <p className="mt-2 text-sm text-text-destructive">
            This is a system role and cannot be deleted.
          </p>
        )}
        <div className="mt-6 flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            disabled={role.isSystem}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

export function RoleList({ onEdit, onCreate, selectedRole, onSelectRole }: RoleListProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);

  const loadRoles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchRoles();
      setRoles(result.roles);
    } catch {
      setError('Failed to load roles. Please try again.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setError(null);
    const success = await deleteRole(deleteTarget.id);
    if (success) {
      setSuccess(`Role "${deleteTarget.name}" deleted successfully`);
      setTimeout(() => setSuccess(null), 3000);
      setDeleteTarget(null);
      loadRoles();
      if (selectedRole?.id === deleteTarget.id) {
        onSelectRole(null);
      }
    } else {
      setError(`Failed to delete role "${deleteTarget.name}". It may be a system role.`);
    }
  };

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(search.toLowerCase()) ||
    (role.description && role.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-text-primary">Roles</h3>
        <Button variant="primary" size="sm" onClick={onCreate}>
          Create Role
        </Button>
      </div>

      <Input
        label="Search roles"
        placeholder="Search by name or description..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        fullWidth
      />

      {success && (
        <Alert variant="success" role="status" aria-live="polite">
          {success}
        </Alert>
      )}

      {error && (
        <Alert variant="error" role="alert" aria-live="assertive">
          {error}
        </Alert>
      )}

      {loading && roles.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-text-tertiary">Loading roles...</p>
        </div>
      ) : filteredRoles.length === 0 ? (
        <div className="rounded-lg border border-border p-8 text-center">
          <p className="text-sm text-text-tertiary">
            {search ? 'No roles match your search' : 'No roles created yet. Click "Create Role" to get started.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm" role="table" aria-label="Role list">
            <thead>
              <tr className="border-b border-border bg-surface-tertiary">
                <th className="px-4 py-3 text-left font-medium text-text-secondary" scope="col">Name</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary" scope="col">Description</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary" scope="col">Type</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary" scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRoles.map(role => (
                <tr
                  key={role.id}
                  className={`cursor-pointer border-b border-border last:border-b-0 transition-colors ${
                    selectedRole?.id === role.id
                      ? 'bg-primary-50 dark:bg-primary-950'
                      : 'hover:bg-surface-tertiary'
                  }`}
                  onClick={() => onSelectRole(role)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectRole(role);
                    }
                  }}
                  tabIndex={0}
                  role="row"
                  aria-selected={selectedRole?.id === role.id}
                  aria-label={`Role: ${role.name}`}
                  aria-describedby={`role-desc-${role.id}`}
                >
                  <td className="px-4 py-3">
                    <span className="font-medium text-text-primary">{role.name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-text-secondary">
                      {role.description || '\u2014'}
                    </span>
                    <span id={`role-desc-${role.id}`} className="sr-only">
                      Click to view and manage permissions for {role.name}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {role.isSystem ? (
                      <Badge variant="secondary">System</Badge>
                    ) : (
                      <Badge variant="primary">Custom</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={e => {
                          e.stopPropagation();
                          onEdit(role);
                        }}
                        disabled={role.isSystem}
                        aria-label={`Edit ${role.name}`}
                        aria-describedby={role.isSystem ? `edit-disabled-${role.id}` : undefined}
                      >
                        Edit
                      </Button>
                      {role.isSystem && (
                        <span id={`edit-disabled-${role.id}`} className="sr-only">
                          System roles cannot be edited
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={e => {
                          e.stopPropagation();
                          setDeleteTarget(role);
                        }}
                        disabled={role.isSystem}
                        className="text-text-destructive hover:text-text-destructive"
                        aria-label={`Delete ${role.name}`}
                        aria-describedby={role.isSystem ? `delete-disabled-${role.id}` : undefined}
                      >
                        Delete
                      </Button>
                      {role.isSystem && (
                        <span id={`delete-disabled-${role.id}`} className="sr-only">
                          System roles cannot be deleted
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          role={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
