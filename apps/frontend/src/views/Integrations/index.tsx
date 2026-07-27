import { useState, useCallback, useEffect } from 'react';
import { Stack, Card, Button, Badge, Input, Select } from '@nexus-engineering/shared';
import { Check, X, RefreshCw, Link2, Key, Globe, AlertCircle, Loader2 } from 'lucide-react';
import type { ConnectorType, ConnectorAuthConfig, SyncStatus } from '@nexus-engineering/shared';

const CONNECTOR_LABELS: Record<ConnectorType, string> = {
  jira: 'Jira',
  linear: 'Linear',
  github: 'GitHub',
};

const HEALTH_LABELS: Record<string, string> = {
  connected: 'Connected',
  disconnected: 'Disconnected',
  error: 'Error',
  syncing: 'Syncing',
} as const;

function healthBadgeVariant(health: string): 'success' | 'danger' | 'warning' | 'secondary' {
  const map: Record<string, 'success' | 'danger' | 'warning' | 'secondary'> = {
    connected: 'success',
    disconnected: 'secondary',
    error: 'danger',
    syncing: 'warning',
  };
  return map[health] || 'secondary';
}

function AuthConfigPanel({
  config,
  onSave,
  onTest,
  testing,
  saving,
}: {
  config: ConnectorAuthConfig;
  onSave: (c: ConnectorAuthConfig) => void;
  onTest: (c: ConnectorType) => void;
  testing: boolean;
  saving: boolean;
}) {
  const [draft, setDraft] = useState<ConnectorAuthConfig>({ ...config });

  useEffect(() => {
    setDraft({ ...config });
  }, [config]);

  const handleSave = () => {
    onSave(draft);
  };

  return (
    <Card padding="lg">
      <Stack gap={4}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {draft.method === 'oauth' ? (
              <Link2 className="h-4 w-4 text-text-secondary" />
            ) : (
              <Key className="h-4 w-4 text-text-secondary" />
            )}
            <h3 className="text-lg font-semibold text-text-primary">
              {CONNECTOR_LABELS[draft.connector]} Configuration
            </h3>
          </div>
          {draft.lastTestResult && (
            <div className="flex items-center gap-1.5">
              {draft.lastTestResult === 'success' ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <X className="h-4 w-4 text-red-500" />
              )}
              <span className={`text-xs font-medium ${
                draft.lastTestResult === 'success' ? 'text-green-500' : 'text-red-500'
              }`}>
                {draft.lastTestResult === 'success' ? 'Connection OK' : 'Connection Failed'}
              </span>
            </div>
          )}
        </div>

        <Select
          label="Auth Method"
          value={draft.method}
          onChange={(e) => setDraft({ ...draft, method: e.target.value as 'oauth' | 'api_key' })}
          options={[
            { value: 'oauth', label: 'OAuth 2.0' },
            { value: 'api_key', label: 'API Key' },
          ]}
        />

        {draft.method === 'oauth' ? (
          <>
            <Input
              label="Client ID"
              value={draft.clientId || ''}
              onChange={(e) => setDraft({ ...draft, clientId: e.target.value })}
              placeholder="Enter OAuth client ID..."
            />
            <Input
              label="Client Secret"
              value={draft.clientSecret || ''}
              onChange={(e) => setDraft({ ...draft, clientSecret: e.target.value })}
              placeholder="Enter OAuth client secret..."
            />
            <Input
              label="Redirect URI"
              value={draft.oauthRedirectUri || ''}
              onChange={(e) => setDraft({ ...draft, oauthRedirectUri: e.target.value })}
              placeholder="https://..."
            />
          </>
        ) : (
          <Input
            label="API Key"
            value={draft.apiKey || ''}
            onChange={(e) => setDraft({ ...draft, apiKey: e.target.value })}
            placeholder="Enter API key..."
          />
        )}

        <Input
          label="Base URL (optional)"
          value={draft.baseUrl || ''}
          onChange={(e) => setDraft({ ...draft, baseUrl: e.target.value })}
          placeholder={`https://${draft.connector === 'github' ? 'api.github.com' : draft.connector === 'jira' ? 'your-domain.atlassian.net' : 'api.linear.app'}`}
        />

        {draft.lastTestError && (
          <div className="flex items-start gap-2 rounded-lg bg-red-500/10 p-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <p className="text-sm text-red-500">{draft.lastTestError}</p>
          </div>
        )}

        <Stack direction="row" gap={2}>
          <Button variant="secondary" onClick={() => onTest(draft.connector)} loading={testing}>
            Test Connection
          </Button>
          <Button variant="primary" onClick={handleSave} loading={saving}>
            Save
          </Button>
        </Stack>
      </Stack>
    </Card>
  );
}

function StatusPanel({ statuses }: { statuses: SyncStatus[] }) {
  return (
    <Card padding="lg">
      <Stack gap={4}>
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-text-secondary" />
          <h3 className="text-lg font-semibold text-text-primary">Sync Status</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" role="table" aria-label="Integration sync status">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-text-tertiary">
                <th className="pb-2 pr-4 font-medium" scope="col">Connector</th>
                <th className="pb-2 pr-4 font-medium" scope="col">Health</th>
                <th className="pb-2 pr-4 font-medium" scope="col">Last Sync</th>
                <th className="pb-2 pr-4 font-medium" scope="col">Items Synced</th>
                <th className="pb-2 font-medium" scope="col">Errors</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {statuses.map((s) => (
                <tr key={s.connector} className="hover:bg-surface-secondary/50">
                  <td className="py-3 pr-4 font-medium text-text-primary">
                    {CONNECTOR_LABELS[s.connector]}
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-1.5">
                      <Badge variant={healthBadgeVariant(s.health)}>
                        {HEALTH_LABELS[s.health] || s.health}
                      </Badge>
                      {s.health === 'syncing' && (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-text-secondary" />
                      )}
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-text-secondary">
                    {s.lastSyncAt
                      ? new Date(s.lastSyncAt).toLocaleString()
                      : '\u2014'}
                  </td>
                  <td className="py-3 pr-4 text-text-secondary">
                    {s.itemsSynced != null ? s.itemsSynced.toLocaleString() : '\u2014'}
                  </td>
                  <td className="py-3 text-text-secondary">
                    {s.itemsFailed != null && s.itemsFailed > 0 ? (
                      <span className="text-red-500 font-medium">{s.itemsFailed}</span>
                    ) : '\u2014'}
                  </td>
                </tr>
              ))}
              {statuses.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-text-tertiary">
                    No integrations configured
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Stack>
    </Card>
  );
}

function SyncTriggerPanel({
  statuses,
  onSync,
  syncing,
}: {
  statuses: SyncStatus[];
  onSync: (c: ConnectorType) => void;
  syncing: Record<string, boolean>;
}) {
  return (
    <Card padding="lg">
      <Stack gap={4}>
        <div className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-text-secondary" />
          <h3 className="text-lg font-semibold text-text-primary">Manual Sync</h3>
        </div>

        <Stack gap={3}>
          {statuses.map((s) => (
            <div
              key={s.connector}
              className="flex items-center justify-between rounded-lg border border-border bg-surface-secondary/30 p-4"
            >
              <Stack gap={1}>
                <span className="text-sm font-medium text-text-primary">
                  {CONNECTOR_LABELS[s.connector]}
                </span>
                <span className="text-xs text-text-tertiary">
                  {s.lastSyncAt
                    ? `Last sync: ${new Date(s.lastSyncAt).toLocaleString()}`
                    : 'Never synced'}
                </span>
              </Stack>
              <Button
                variant="secondary"
                size="sm"
                loading={syncing[s.connector]}
                onClick={() => onSync(s.connector)}
                icon={<RefreshCw className="h-3.5 w-3.5" />}
                disabled={s.health === 'disconnected'}
              >
                Sync Now
              </Button>
            </div>
          ))}
          {statuses.length === 0 && (
            <p className="py-4 text-center text-sm text-text-tertiary">
              Configure an integration to enable manual sync
            </p>
          )}
        </Stack>
      </Stack>
    </Card>
  );
}

export function IntegrationsView() {
  const [configs, setConfigs] = useState<ConnectorAuthConfig[]>([
    { connector: 'jira', method: 'api_key', apiKey: '', baseUrl: '' },
    { connector: 'linear', method: 'api_key', apiKey: '', baseUrl: '' },
    { connector: 'github', method: 'oauth', clientId: '', clientSecret: '', oauthRedirectUri: '' },
  ]);

  const [statuses, setStatuses] = useState<SyncStatus[]>([
    { connector: 'jira', health: 'disconnected', inProgress: false },
    { connector: 'linear', health: 'disconnected', inProgress: false },
    { connector: 'github', health: 'disconnected', inProgress: false },
  ]);

  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [syncing, setSyncing] = useState<Record<string, boolean>>({});

  const handleTest = useCallback((connector: ConnectorType) => {
    setTesting((prev) => ({ ...prev, [connector]: true }));
    setTimeout(() => {
      setTesting((prev) => ({ ...prev, [connector]: false }));
      setConfigs((prev) =>
        prev.map((c) =>
          c.connector === connector
            ? {
                ...c,
                lastTestedAt: new Date().toISOString(),
                lastTestResult: 'success',
                lastTestError: undefined,
              }
            : c,
        ),
      );
      setStatuses((prev) =>
        prev.map((s) =>
          s.connector === connector ? { ...s, health: 'connected' as const } : s,
        ),
      );
    }, 1500);
  }, []);

  const handleSave = useCallback((c: ConnectorAuthConfig) => {
    setSaving((prev) => ({ ...prev, [c.connector]: true }));
    setTimeout(() => {
      setSaving((prev) => ({ ...prev, [c.connector]: false }));
      setConfigs((prev) => prev.map((x) => (x.connector === c.connector ? { ...c } : x)));
    }, 500);
  }, []);

  const handleSync = useCallback((connector: ConnectorType) => {
    setSyncing((prev) => ({ ...prev, [connector]: true }));
    setStatuses((prev) =>
      prev.map((s) => (s.connector === connector ? { ...s, health: 'syncing', inProgress: true } : s)),
    );
    setTimeout(() => {
      setSyncing((prev) => ({ ...prev, [connector]: false }));
      setStatuses((prev) =>
        prev.map((s) =>
          s.connector === connector
            ? {
                ...s,
                health: 'connected',
                inProgress: false,
                lastSyncAt: new Date().toISOString(),
                lastSyncResult: 'success',
                itemsSynced: Math.floor(Math.random() * 200) + 10,
                itemsFailed: 0,
              }
            : s,
        ),
      );
    }, 2000);
  }, []);

  return (
    <Stack gap={12}>
      <Stack gap={4}>
        <h2 className="text-2xl font-bold text-text-primary">Integrations</h2>
        <p className="text-text-secondary">
          Configure and manage connections to Jira, Linear, and GitHub.
          View sync status and trigger manual synchronization.
        </p>
      </Stack>

      <Stack gap={6}>
        <Stack gap={2}>
          <p className="text-sm font-medium text-text-tertiary uppercase tracking-wide">
            Authentication Configuration
          </p>
          {configs.map((config) => (
            <AuthConfigPanel
              key={config.connector}
              config={config}
              onSave={handleSave}
              onTest={handleTest}
              testing={testing[config.connector] || false}
              saving={saving[config.connector] || false}
            />
          ))}
        </Stack>

        <StatusPanel statuses={statuses} />

        <SyncTriggerPanel statuses={statuses} onSync={handleSync} syncing={syncing} />
      </Stack>
    </Stack>
  );
}
