import type {
  ConnectorType,
  ConnectorAuthConfig,
  SyncStatus,
  SyncResult,
} from '@nexus-engineering/shared';

const BASE = import.meta.env.VITE_API_URL || '';

export interface SyncStatusResponse {
  data: {
    jira: { configured: boolean; status: string };
    linear: { configured: boolean; status: string };
    github: { configured: boolean; status: string };
    lastSyncTime: string;
    syncHealth: string;
  };
}

export interface SyncTriggerResponse {
  success: boolean;
  data: unknown;
  message: string;
}

function connectorToSyncHealth(
  connector: ConnectorType,
  data: SyncStatusResponse['data'],
): SyncStatus['health'] {
  const c = data[connector];
  if (!c) return 'disconnected';
  if (!c.configured) return 'disconnected';
  if (data.syncHealth === 'error') return 'error';
  return 'connected';
}

export async function fetchSyncStatus(): Promise<{
  statuses: SyncStatus[];
  error: string | null;
}> {
  try {
    const res = await fetch(`${BASE}/api/integrations/sync-status`);
    if (!res.ok) {
      const text = await res.text().catch(() => 'Unknown error');
      return { statuses: [], error: `HTTP ${res.status}: ${text}` };
    }
    const json = (await res.json()) as SyncStatusResponse;
    const data = json.data ?? json;
    const connectors: ConnectorType[] = ['jira', 'linear', 'github'];
    const statuses: SyncStatus[] = connectors.map((connector) => ({
      connector,
      health: connectorToSyncHealth(connector, data),
      lastSyncAt: data.lastSyncTime ? data.lastSyncTime : undefined,
      lastSyncResult: data.syncHealth === 'error' ? 'failure' : undefined,
      lastSyncError: data.syncHealth === 'error' ? 'Sync health reported error' : undefined,
      itemsSynced: undefined,
      itemsFailed: undefined,
      inProgress: false,
    }));
    return { statuses, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch sync status';
    return { statuses: [], error: message };
  }
}

export async function triggerSync(
  connector: ConnectorType,
  nexusId: string,
): Promise<SyncResult> {
  const res = await fetch(`${BASE}/api/integrations/${connector}/sync/${encodeURIComponent(nexusId)}`, {
    method: 'POST',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => 'Unknown error');
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  const json = (await res.json()) as SyncTriggerResponse;
  return {
    connector,
    status: json.success ? 'success' : 'failure',
    itemsTotal: 1,
    itemsSynced: json.success ? 1 : 0,
    itemsFailed: json.success ? 0 : 1,
    errors: json.success ? [] : [json.message ?? 'Sync failed'],
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  };
}

export async function testConnection(
  config: ConnectorAuthConfig,
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${BASE}/api/integrations/${config.connector}/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: config.method,
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        apiKey: config.apiKey,
        baseUrl: config.baseUrl,
      }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => null);
      return { success: false, error: json?.message ?? `HTTP ${res.status}: ${res.statusText}` };
    }
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Connection test failed',
    };
  }
}

export async function saveAuthConfig(
  config: ConnectorAuthConfig,
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${BASE}/api/integrations/${config.connector}/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: config.method,
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        apiKey: config.apiKey,
        baseUrl: config.baseUrl,
        oauthRedirectUri: config.oauthRedirectUri,
      }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => null);
      return { success: false, error: json?.message ?? `HTTP ${res.status}: ${res.statusText}` };
    }
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to save configuration',
    };
  }
}
