import { useState, useEffect, useCallback } from 'react';
import type { Role, Permission } from '@nexus-engineering/shared';
import { Button, Alert } from '@nexus-engineering/shared';
import { PermissionCheckboxGroup } from './PermissionCheckboxGroup';
import { setRolePermissions } from '../../api/rbac';

interface RolePermissionsPanelProps {
  role: Role;
  allPermissions: { resource: string; items: { id: string; name: string; description: string | null }[] }[];
  onPermissionsUpdated: (role: Role) => void;
}

export function RolePermissionsPanel({ role, allPermissions, onPermissionsUpdated }: RolePermissionsPanelProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    const roleWithPerms = role as Role & { permissions?: { id: string }[] };
    return new Set(roleWithPerms.permissions?.map((p: { id: string }) => p.id) ?? []);
  });

  const seedPermissions = useCallback(() => {
    const roleWithPerms = role as Role & { permissions?: { id: string }[] };
    const ids = roleWithPerms.permissions?.map((p: { id: string }) => p.id);
    if (ids && ids.length > 0) {
      setSelectedIds(new Set(ids));
    }
  }, [role]);

  useEffect(() => {
    seedPermissions();
  }, [seedPermissions]);
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
        <Alert variant="success">
          {success}
        </Alert>
      )}

      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      <div className="max-h-80 overflow-y-auto rounded-lg border border-border p-4 space-y-4">
        {allPermissions.length === 0 && (
          <p className="text-sm text-text-tertiary text-center py-4">No permissions available</p>
        )}
        {allPermissions.map(group => (
          <PermissionCheckboxGroup
            key={group.resource}
            resource={group.resource}
            permissions={group.items}
            selectedIds={selectedIds}
            onToggle={togglePermission}
            onToggleGroup={e => toggleAllInGroup(group.resource, e)}
          />
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
