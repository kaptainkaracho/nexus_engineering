import { useState, useEffect } from 'react';
import type { Role, CreateRoleRequest, UpdateRoleRequest } from '@nexus-engineering/shared';
import { Button, Alert, Input } from '@nexus-engineering/shared';

interface RoleFormProps {
  role?: Role | null;
  permissions: { resource: string; items: { id: string; name: string; description: string | null }[] }[];
  onSubmit: (data: CreateRoleRequest | UpdateRoleRequest & { permissionIds?: string[] }) => Promise<boolean>;
  onCancel: () => void;
  mode: 'create' | 'edit';
}

export function RoleForm({ role, permissions, onSubmit, onCancel, mode }: RoleFormProps) {
  const [name, setName] = useState(role?.name ?? '');
  const [description, setDescription] = useState(role?.description ?? '');
  const [permissionIds, setPermissionIds] = useState<Set<string>>(() => {
    if (role && (role as Role & { permissions?: { id: string }[] }).permissions) {
      return new Set((role as Role & { permissions?: { id: string }[] }).permissions?.map((p: { id: string }) => p.id) ?? []);
    }
    return new Set<string>();
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(role?.name ?? '');
    setDescription(role?.description ?? '');
  }, [role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Role name is required');
      return;
    }
    setLoading(true);
    setError(null);
    const success = await onSubmit({
      name: name.trim(),
      description: description.trim() || null,
      permissionIds: Array.from(permissionIds),
    });
    if (!success) {
      setError(mode === 'create' ? 'Failed to create role. Please try again.' : 'Failed to update role. Please try again.');
    }
    setLoading(false);
  };

  const togglePermission = (id: string) => {
    setPermissionIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAllInGroup = (resource: string, toggle: boolean) => {
    setPermissionIds(prev => {
      const next = new Set(prev);
      const group = permissions.find(p => p.resource === resource);
      if (group) {
        group.items.forEach(item => {
          if (toggle) {
            next.add(item.id);
          } else {
            next.delete(item.id);
          }
        });
      }
      return next;
    });
  };

  const selectAllPermissions = () => {
    const allIds = new Set<string>();
    permissions.forEach(group => {
      group.items.forEach(item => allIds.add(item.id));
    });
    setPermissionIds(allIds);
  };

  const deselectAllPermissions = () => {
    setPermissionIds(new Set<string>());
  };

  const checkedCount = permissionIds.size;
  const totalCount = permissions.reduce((sum, g) => sum + g.items.length, 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="error" role="alert">
          {error}
        </Alert>
      )}

      <div className="space-y-3">
        <Input
          id="role-name"
          label={
            <span>
              Role Name <span className="text-text-destructive">*</span>
            </span>
          }
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Content Manager"
          required
          error={error ? undefined : undefined}
        />
      </div>

      <div className="space-y-3">
        <label htmlFor="role-description" className="block text-sm font-medium text-text-primary">
          Description
        </label>
        <textarea
          id="role-description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Optional: Describe what this role can do"
          rows={3}
          className="w-full rounded-lg border border-border bg-surface-primary px-3 py-2 text-sm text-text-primary placeholder-text-tertiary focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">Permissions</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-tertiary">
              {checkedCount} of {totalCount} selected
            </span>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={selectAllPermissions}
            >
              Select All
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={deselectAllPermissions}
            >
              Clear All
            </Button>
          </div>
        </div>
        <div className="max-h-64 overflow-y-auto rounded-lg border border-border p-4 space-y-4">
          {permissions.length === 0 && (
            <p className="text-sm text-text-tertiary text-center py-4">No permissions available</p>
          )}
          {permissions.map(group => (
            <div key={group.resource} className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`toggle-${group.resource}`}
                  onChange={e => toggleAllInGroup(group.resource, e.target.checked)}
                  checked={group.items.every(item => permissionIds.has(item.id)) && group.items.length > 0}
                  className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-text-primary">{group.resource}</span>
              </div>
              <div className="ml-6 space-y-1">
                {group.items.map(item => (
                  <label key={item.id} className="flex items-center gap-2 py-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissionIds.has(item.id)}
                      onChange={() => togglePermission(item.id)}
                      className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-text-secondary">{item.name}</span>
                    {item.description && (
                      <span className="text-xs text-text-tertiary">
                        ({item.description})
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={loading} disabled={loading}>
          {mode === 'create' ? 'Create Role' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
