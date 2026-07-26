import { useState } from 'react';
import type { Role, Permission } from '@nexus-engineering/shared';
import { Button, Alert } from '@nexus-engineering/shared';
import { setRolePermissions } from '../../api/rbac';

interface RolePermissionsPanelProps {
  role: Role;
  allPermissions: { resource: string; items: { id: string; name: string; description: string | null }[] }[];
  onPermissionsUpdated: (role: Role) => void;
}

export function RolePermissionsPanel({ role, allPermissions, onPermissionsUpdated }: RolePermissionsPanelProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    return new Set<string>();
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const togglePermission = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAllInGroup = (resource: string, checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      const group = allPermissions.find(p => p.resource === resource);
      if (group) {
        group.items.forEach(item => {
          if (checked) {
            next.add(item.id);
          } else {
            next.delete(item.id);
          }
        });
      }
      return next;
    });
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await setRolePermissions(role.id, Array.from(selectedIds));
      if (result) {
        setSuccess('Permissions updated successfully');
        setTimeout(() => setSuccess(null), 3000);
        onPermissionsUpdated(result);
      } else {
        setError('Failed to update permissions. Please try again.');
      }
    } catch {
      setError('Failed to update permissions. Please try again.');
    }
    setLoading(false);
  };

  const checkedCount = selectedIds.size;
  const totalCount = allPermissions.reduce((sum, g) => sum + g.items.length, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-text-primary">
          Permissions for &ldquo;{role.name}&rdquo;
        </h3>
        <span className="text-sm text-text-tertiary">
          {checkedCount} of {totalCount} selected
        </span>
      </div>

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

      <div className="max-h-80 overflow-y-auto rounded-lg border border-border p-4 space-y-4">
        {allPermissions.length === 0 && (
          <p className="text-sm text-text-tertiary text-center py-4">No permissions available</p>
        )}
        {allPermissions.map(group => (
          <div key={group.resource} className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`perm-toggle-${group.resource}`}
                checked={group.items.every(item => selectedIds.has(item.id)) && group.items.length > 0}
                ref={el => {
                  if (el) {
                    const allChecked = group.items.every(item => selectedIds.has(item.id));
                    const someChecked = group.items.some(item => selectedIds.has(item.id));
                    el.indeterminate = someChecked && !allChecked;
                  }
                }}
                onChange={e => toggleAllInGroup(group.resource, e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
                aria-label={`Toggle all ${group.resource} permissions`}
              />
              <span className="text-sm font-medium text-text-primary">{group.resource}</span>
            </div>
            <div className="ml-6 space-y-1">
              {group.items.map(item => (
                <label key={item.id} className="flex items-center gap-2 py-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(item.id)}
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

      <div className="flex items-center justify-end">
        <Button
          variant="primary"
          onClick={handleSave}
          loading={loading}
          disabled={loading || checkedCount === 0}
        >
          Save Permissions
        </Button>
      </div>
    </div>
  );
}
