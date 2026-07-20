const BASE = import.meta.env.VITE_API_URL || '';

export interface OrgMember {
  id: string;
  userId: string;
  email: string;
  name: string;
  role: 'org:admin' | 'org:member' | 'org:viewer';
  joinedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  createdAt: string;
}

export async function fetchOrganizations(): Promise<Organization[]> {
  try {
    const res = await fetch(`${BASE}/api/orgs`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.data ?? json ?? [];
  } catch {
    return [];
  }
}

export async function fetchOrgMembers(orgId: string): Promise<OrgMember[]> {
  try {
    const res = await fetch(`${BASE}/api/orgs/${orgId}/members`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.data ?? json ?? [];
  } catch {
    return [];
  }
}

export async function updateMemberRole(orgId: string, userId: string, role: OrgMember['role']): Promise<void> {
  await fetch(`${BASE}/api/orgs/${orgId}/members/${userId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
  });
}

export async function removeMember(orgId: string, userId: string): Promise<void> {
  await fetch(`${BASE}/api/orgs/${orgId}/members/${userId}`, {
    method: 'DELETE',
  });
}

export async function inviteMember(orgId: string, email: string, role: OrgMember['role']): Promise<void> {
  await fetch(`${BASE}/api/orgs/${orgId}/invites`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, role }),
  });
}
