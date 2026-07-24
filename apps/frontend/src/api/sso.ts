const BASE = import.meta.env.VITE_API_URL || '';

export interface SSOProvider {
  id: string;
  name: string;
  type: 'google' | 'github' | 'saml';
  enabled: boolean;
  clientId?: string;
  metadataUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SSOConfig {
  providers: SSOProvider[];
  samlMetadataUrl?: string;
}

export async function fetchSSOConfig(): Promise<SSOConfig> {
  try {
    const res = await fetch(`${BASE}/api/auth/sso/config`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch {
    return {
      providers: [
        { id: '1', name: 'Google', type: 'google', enabled: false, clientId: '', createdAt: '', updatedAt: '' },
        { id: '2', name: 'GitHub', type: 'github', enabled: false, clientId: '', createdAt: '', updatedAt: '' },
        { id: '3', name: 'SAML', type: 'saml', enabled: false, metadataUrl: '', createdAt: '', updatedAt: '' },
      ],
      samlMetadataUrl: `${BASE}/api/auth/saml/metadata`,
    };
  }
}

export async function toggleProvider(id: string, enabled: boolean): Promise<void> {
  await fetch(`${BASE}/api/auth/sso/providers/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled }),
  });
}

export function getOAuthUrl(provider: string): string {
  return `${BASE}/api/auth/oauth/${provider}`;
}
