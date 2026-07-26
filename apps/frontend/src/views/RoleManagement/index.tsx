import { useState, useCallback, useEffect, useRef } from 'react';
import type { Role, Permission, CreateRoleRequest } from '@nexus-engineering/shared';
import { Card, Container, Stack } from '@nexus-engineering/shared';
import { RoleList } from './RoleList';
import { RoleForm } from './RoleForm';
import { RolePermissionsPanel } from './RolePermissionsPanel';
import { UserRoleAssignment } from './UserRoleAssignment';
import { fetchRoles, fetchPermissions } from '../../api/rbac';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface ModalState {
  type: 'create' | 'edit' | null;
  role: Role | null;
}

export function RoleManagement() {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [modal, setModal] = useState<ModalState>({ type: null, role: null });
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [permissionsByResource, setPermissionsByResource] = useState<
    { resource: string; items: { id: string; name: string; description: string | null }[] }[]
  >([]);

  const loadData = useCallback(async () => {
    const [rolesResult, permissionsResult] = await Promise.all([
      fetchRoles(),
      fetchPermissions(),
    ]);
    setAvailableRoles(rolesResult.roles);
    const grouped: Record<string, { id: string; name: string; description: string | null }[]> = {};
    for (const perm of permissionsResult.permissions) {
      const key = perm.resource;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push({ id: perm.id, name: perm.name, description: perm.description });
    }
    setPermissionsByResource(Object.entries(grouped).map(([resource, items]) => ({ resource, items })));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = () => setModal({ type: 'create', role: null });
  const handleEdit = (role: Role) => setModal({ type: 'edit', role });
  const handleCancel = () => setModal({ type: null, role: null });

  const handleFormSubmit = async (data: { name: string; description?: string | null; permissionIds?: string[] }) => {
    if (modal.type === 'create') {
      const { createRole } = await import('../../api/rbac');
      const role = await createRole(data as CreateRoleRequest);
      if (role) {
        setAvailableRoles(prev => [...prev, role]);
        handleCancel();
        return true;
      }
    } else if (modal.type === 'edit' && modal.role) {
      const { updateRole } = await import('../../api/rbac');
      const role = await updateRole(modal.role.id, data);
      if (role) {
        setAvailableRoles(prev => prev.map(r => r.id === role.id ? role : r));
        handleCancel();
        return true;
      }
    }
    return false;
  };

  const handlePermissionsUpdated = (role: Role) => {
    setAvailableRoles(prev => prev.map(r => r.id === role.id ? role : r));
  };

  return (
    <Container size="lg" className="py-8">
      <Stack gap={8}>
        <Stack gap={2}>
          <h1 className="text-2xl font-bold text-text-primary">Role Management</h1>
          <p className="text-text-secondary">
            Manage roles, permissions, and user assignments for access control.
          </p>
        </Stack>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-5">
          {/* Left: Role List */}
          <div className="xl:col-span-2">
            <Card padding="lg">
              <RoleList
                onEdit={handleEdit}
                onCreate={handleCreate}
                selectedRole={selectedRole}
                onSelectRole={setSelectedRole}
              />
            </Card>
          </div>

          {/* Right: Role Details + Permissions */}
          <div className="xl:col-span-3">
            {selectedRole ? (
              <Stack gap={6}>
                <Card padding="lg">
                  <Stack gap={4}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-text-primary">
                          {selectedRole.name}
                        </h2>
                        <p className="text-sm text-text-secondary">
                          {selectedRole.description || 'No description'}
                        </p>
                      </div>
                    </div>
                  </Stack>
                </Card>

                <Card padding="lg">
                  <RolePermissionsPanel
                    role={selectedRole}
                    allPermissions={permissionsByResource}
                    onPermissionsUpdated={handlePermissionsUpdated}
                  />
                </Card>
              </Stack>
            ) : (
              <Card padding="lg">
                <div className="flex items-center justify-center py-16">
                  <p className="text-sm text-text-tertiary">
                    Select a role to view and manage its permissions.
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* User Role Assignment */}
        <Card padding="lg">
          <UserRoleAssignment availableRoles={availableRoles} />
        </Card>
      </Stack>

      {/* Create/Edit Modal */}
      {modal.type && (() => {
        const modalRef = useRef<HTMLDivElement>(null);
        useFocusTrap(modalRef, true);

        useEffect(() => {
          const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handleCancel();
          };
          document.addEventListener('keydown', handleEscape);
          return () => document.removeEventListener('keydown', handleEscape);
        }, [handleCancel]);

        return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" role="dialog" aria-modal="true" aria-label={modal.type === 'create' ? 'Create new role' : 'Edit role'}>
          <div ref={modalRef} className="w-full max-w-lg rounded-xl bg-surface-primary p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-text-primary">
              {modal.type === 'create' ? 'Create New Role' : `Edit: ${modal.role?.name}`}
            </h3>
            <p className="mt-1 text-sm text-text-secondary">
              {modal.type === 'create'
                ? 'Define a new role and its permissions.'
                : 'Update the role name and permissions.'}
            </p>
            <div className="mt-6">
              <RoleForm
                role={modal.role}
                permissions={permissionsByResource}
                onSubmit={handleFormSubmit}
                onCancel={handleCancel}
                mode={modal.type}
              />
            </div>
          </div>
        </div>
        );
      })()}
    </Container>
  );
}

export default RoleManagement;
