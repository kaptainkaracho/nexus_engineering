import type { ScimConfig, ScimUser, ScimGroup, ScimListResponse } from '@nexus-engineering/shared';

const BASE = import.meta.env.VITE_API_URL || '';

export async function fetchScimConfig(): Promise<ScimConfig> {
  try {
    const res = await fetch(`${BASE}/api/scim/config`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch {
    return {
      enabled: false,
      endpointUrl: `${BASE}/api/scim`,
      bearerToken: '',
      organizationId: '',
    };
  }
}

export async function toggleScimProvisioning(enabled: boolean): Promise<void> {
  const res = await fetch(`${BASE}/api/scim/config`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export async function regenerateBearerToken(): Promise<{ bearerToken: string; lastTokenRegeneratedAt: string }> {
  const res = await fetch(`${BASE}/api/scim/config/regenerate-token`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchProvisionedUsers(params?: {
  startIndex?: number;
  count?: number;
  filter?: string;
}): Promise<ScimListResponse<ScimUser>> {
  try {
    const query = new URLSearchParams();
    if (params?.startIndex) query.set('startIndex', String(params.startIndex));
    if (params?.count) query.set('count', String(params.count));
    if (params?.filter) query.set('filter', params.filter);
    const qs = query.toString();
    const res = await fetch(`${BASE}/api/scim/Users${qs ? `?${qs}` : ''}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch {
    return {
      schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
      totalResults: 0,
      itemsPerPage: 0,
      startIndex: 1,
      Resources: [],
    };
  }
}

export async function fetchProvisionedGroups(params?: {
  startIndex?: number;
  count?: number;
}): Promise<ScimListResponse<ScimGroup>> {
  try {
    const query = new URLSearchParams();
    if (params?.startIndex) query.set('startIndex', String(params.startIndex));
    if (params?.count) query.set('count', String(params.count));
    const qs = query.toString();
    const res = await fetch(`${BASE}/api/scim/Groups${qs ? `?${qs}` : ''}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch {
    return {
      schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
      totalResults: 0,
      itemsPerPage: 0,
      startIndex: 1,
      Resources: [],
    };
  }
}
