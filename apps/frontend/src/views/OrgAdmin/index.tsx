import { useCallback, useEffect, useState } from 'react';
import { Button, Card, Container, Stack, Alert, Input } from '@nexus-engineering/shared';
import {
  fetchOrganizations,
  fetchOrgMembers,
  updateMemberRole,
  removeMember,
  inviteMember,
  type Organization,
  type OrgMember,
} from '../../api/orgs';

const ROLE_OPTIONS: Array<{ value: OrgMember['role']; label: string }> = [
  { value: 'org:admin', label: 'Admin' },
  { value: 'org:member', label: 'Member' },
  { value: 'org:viewer', label: 'Viewer' },
];

function UsersIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
    </svg>
  );
}

const ROLE_COLORS: Record<string, string> = {
  'org:admin': 'bg-error-100 text-error-700 dark:bg-error-900 dark:text-error-300',
  'org:member': 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300',
  'org:viewer': 'bg-neutral-100 text-neutral-700 dark:bg-neutral-900 dark:text-neutral-300',
};

export function OrgAdmin() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<OrgMember['role']>('org:member');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [removingMember, setRemovingMember] = useState<string | null>(null);

  const loadOrgs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchOrganizations();
      setOrgs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load organizations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadOrgs(); }, [loadOrgs]);

  const loadMembers = useCallback(async (orgId: string) => {
    setMembersLoading(true);
    try {
      const data = await fetchOrgMembers(orgId);
      setMembers(data);
    } finally {
      setMembersLoading(false);
    }
  }, []);

  const handleSelectOrg = useCallback(
    (org: Organization) => {
      setSelectedOrg(org);
      setInviteEmail('');
      setInviteError(null);
      void loadMembers(org.id);
    },
    [loadMembers],
  );

  const handleRoleChange = useCallback(
    async (member: OrgMember, newRole: OrgMember['role']) => {
      if (!selectedOrg) return;
      setUpdatingRole(member.userId);
      try {
        await updateMemberRole(selectedOrg.id, member.userId, newRole);
        setMembers((prev) => prev.map((m) => (m.id === member.id ? { ...m, role: newRole } : m)));
      } finally {
        setUpdatingRole(null);
      }
    },
    [selectedOrg],
  );

  const handleRemove = useCallback(
    async (member: OrgMember) => {
      if (!selectedOrg) return;
      setRemovingMember(member.userId);
      try {
        await removeMember(selectedOrg.id, member.userId);
        setMembers((prev) => prev.filter((m) => m.id !== member.id));
      } finally {
        setRemovingMember(null);
      }
    },
    [selectedOrg],
  );

  const handleInvite = useCallback(async () => {
    if (!selectedOrg || !inviteEmail) return;
    setInviting(true);
    setInviteError(null);
    try {
      await inviteMember(selectedOrg.id, inviteEmail, inviteRole);
      setInviteEmail('');
      void loadMembers(selectedOrg.id);
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Invitation failed');
    } finally {
      setInviting(false);
    }
  }, [selectedOrg, inviteEmail, inviteRole, loadMembers]);

  if (loading) {
    return (
      <Container size="lg" className="py-8">
        <Card padding="lg">
          <div className="flex items-center justify-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary-500" />
          </div>
        </Card>
      </Container>
    );
  }

  return (
    <Container size="lg" className="py-8">
      <Stack gap={8}>
        <Stack gap={2}>
          <h1 className="text-2xl font-bold text-text-primary">Organization Admin</h1>
          <p className="text-text-secondary">
            Manage organizations, members, and role assignments.
          </p>
        </Stack>

        {error && (
          <Alert variant="error" title="Error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {orgs.length === 0 ? (
          <Card padding="lg">
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <UsersIcon />
              <h3 className="text-lg font-semibold text-text-primary">No Organizations Yet</h3>
              <p className="max-w-md text-sm text-text-tertiary">
                Organizations will appear here once created. An admin can create organizations from the backend.
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <Card padding="md">
                <Stack gap={3}>
                  <h2 className="text-sm font-medium uppercase tracking-wide text-text-tertiary">Organizations</h2>
                  <div className="flex flex-col gap-1">
                    {orgs.map((org) => (
                      <button
                        key={org.id}
                        type="button"
                        onClick={() => handleSelectOrg(org)}
                        className={`flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                          selectedOrg?.id === org.id
                            ? 'bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300'
                            : 'text-text-primary hover:bg-surface-tertiary'
                        }`}
                        aria-current={selectedOrg?.id === org.id ? 'true' : undefined}
                      >
                        <span className="font-medium truncate">{org.name}</span>
                        <span className="text-xs text-text-tertiary">{org.memberCount}</span>
                      </button>
                    ))}
                  </div>
                </Stack>
              </Card>
            </div>

            <div className="lg:col-span-2">
              {selectedOrg ? (
                <Stack gap={6}>
                  <Card padding="lg">
                    <Stack gap={4}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-lg font-semibold text-text-primary">{selectedOrg.name}</h2>
                          <p className="text-sm text-text-tertiary">{selectedOrg.memberCount} members</p>
                        </div>
                      </div>

                      <div className="border-t border-border pt-4">
                        <h3 className="mb-3 text-sm font-medium text-text-primary">Invite Member</h3>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                          <div className="flex-1">
                            <Input
                              label="Email address"
                              type="email"
                              value={inviteEmail}
                              onChange={(e) => setInviteEmail(e.target.value)}
                              placeholder="colleague@company.com"
                              fullWidth
                            />
                          </div>
                          <div className="w-full sm:w-32">
                            <label htmlFor="invite-role" className="mb-1 block text-xs font-medium text-text-tertiary uppercase tracking-wide">
                              Role
                            </label>
                            <select
                              id="invite-role"
                              value={inviteRole}
                              onChange={(e) => setInviteRole(e.target.value as OrgMember['role'])}
                              className="w-full rounded-lg border border-border bg-surface-primary px-3 py-2 text-sm text-text-primary"
                              aria-label="Invite role"
                            >
                              {ROLE_OPTIONS.map((r) => (
                                <option key={r.value} value={r.value}>{r.label}</option>
                              ))}
                            </select>
                          </div>
                          <Button
                            variant="primary"
                            size="sm"
                            loading={inviting}
                            disabled={!inviteEmail}
                            onClick={handleInvite}
                          >
                            Send Invite
                          </Button>
                        </div>
                        {inviteError && (
                          <p className="mt-2 text-sm text-error-600">{inviteError}</p>
                        )}
                      </div>
                    </Stack>
                  </Card>

                  <Card padding="lg">
                    <Stack gap={4}>
                      <h2 className="text-sm font-medium uppercase tracking-wide text-text-tertiary">
                        Members ({members.length})
                      </h2>

                      {membersLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-border border-t-primary-500" />
                        </div>
                      ) : members.length === 0 ? (
                        <p className="py-4 text-center text-sm text-text-tertiary">No members found.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm" aria-label="Organization members">
                            <thead>
                              <tr className="border-b border-border text-xs uppercase tracking-wide text-text-tertiary">
                                <th className="p-3 font-semibold" scope="col">Name</th>
                                <th className="p-3 font-semibold" scope="col">Email</th>
                                <th className="p-3 font-semibold" scope="col">Role</th>
                                <th className="p-3 font-semibold" scope="col">Joined</th>
                                <th className="w-20 p-3 font-semibold" scope="col"><span className="sr-only">Actions</span></th>
                              </tr>
                            </thead>
                            <tbody>
                              {members.map((member) => (
                                <tr key={member.id} className="border-b border-border transition-colors hover:bg-surface-secondary/50">
                                  <td className="p-3 font-medium text-text-primary">{member.name}</td>
                                  <td className="p-3 text-text-secondary">{member.email}</td>
                                  <td className="p-3">
                                    <select
                                      value={member.role}
                                      onChange={(e) => handleRoleChange(member, e.target.value as OrgMember['role'])}
                                      disabled={updatingRole === member.userId}
                                      className={`rounded px-2 py-1 text-xs font-medium ${ROLE_COLORS[member.role]} border-0 cursor-pointer`}
                                      aria-label={`Role for ${member.name}`}
                                    >
                                      {ROLE_OPTIONS.map((r) => (
                                        <option key={r.value} value={r.value}>{r.label}</option>
                                      ))}
                                    </select>
                                  </td>
                                  <td className="p-3 text-xs text-text-tertiary">
                                    {new Date(member.joinedAt).toLocaleDateString()}
                                  </td>
                                  <td className="p-3">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      loading={removingMember === member.userId}
                                      disabled={removingMember === member.userId}
                                      onClick={() => handleRemove(member)}
                                      aria-label={`Remove ${member.name}`}
                                    >
                                      Remove
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </Stack>
                  </Card>
                </Stack>
              ) : (
                <Card padding="lg">
                  <div className="flex flex-col items-center gap-3 py-8 text-center">
                    <UsersIcon />
                    <h3 className="text-lg font-semibold text-text-primary">Select an Organization</h3>
                    <p className="max-w-md text-sm text-text-tertiary">
                      Choose an organization from the list to view and manage its members.
                    </p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}
      </Stack>
    </Container>
  );
}

export default OrgAdmin;
