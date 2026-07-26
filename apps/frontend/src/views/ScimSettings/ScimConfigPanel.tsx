import { useCallback, useState } from 'react';
import { Button, Card, Stack, Alert } from '@nexus-engineering/shared';
import { RefreshCw, Copy, Check, ExternalLink, Shield } from 'lucide-react';
import type { ScimConfig } from '@nexus-engineering/shared';
import { toggleScimProvisioning, regenerateBearerToken } from '../../api/scim';

interface ScimConfigPanelProps {
  config: ScimConfig;
  onConfigChange: (config: ScimConfig) => void;
}

export function ScimConfigPanel({ config, onConfigChange }: ScimConfigPanelProps) {
  const [toggling, setToggling] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [copied, setCopied] = useState<'url' | 'token' | null>(null);
  const [showToken, setShowToken] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleToggle = useCallback(async () => {
    setToggling(true);
    setError(null);
    try {
      await toggleScimProvisioning(!config.enabled);
      onConfigChange({ ...config, enabled: !config.enabled });
      setSuccess(config.enabled ? 'SCIM provisioning disabled' : 'SCIM provisioning enabled');
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError('Failed to toggle SCIM provisioning');
    } finally {
      setToggling(false);
    }
  }, [config, onConfigChange]);

  const handleRegenerateToken = useCallback(async () => {
    setRegenerating(true);
    setError(null);
    try {
      const result = await regenerateBearerToken();
      onConfigChange({
        ...config,
        bearerToken: result.bearerToken,
        lastTokenRegeneratedAt: result.lastTokenRegeneratedAt,
      });
      setSuccess('Bearer token regenerated. Update your IdP with the new token.');
      setTimeout(() => setSuccess(null), 5000);
    } catch {
      setError('Failed to regenerate bearer token');
    } finally {
      setRegenerating(false);
    }
  }, [config, onConfigChange]);

  const handleCopy = useCallback(async (text: string, type: 'url' | 'token') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Clipboard access denied
    }
  }, []);

  const maskedToken = config.bearerToken
    ? `${config.bearerToken.slice(0, 8)}${'•'.repeat(24)}${config.bearerToken.slice(-8)}`
    : '••••••••••••••••';

  return (
    <Card padding="lg">
      <Stack gap={6}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-300">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">SCIM Provisioning</h2>
              <p className="text-sm text-text-tertiary">
                Automate user lifecycle management via your identity provider
              </p>
            </div>
          </div>
          <Button
            variant={config.enabled ? 'secondary' : 'primary'}
            size="sm"
            loading={toggling}
            onClick={handleToggle}
            aria-label={config.enabled ? 'Disable SCIM provisioning' : 'Enable SCIM provisioning'}
          >
            {config.enabled ? 'Enabled' : 'Enable'}
          </Button>
        </div>

        {error && (
          <Alert variant="error" title="Error" onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert variant="success" title="Success" onDismiss={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <Stack gap={2}>
            <label className="text-sm font-medium text-text-secondary" htmlFor="scim-endpoint">
              SCIM Endpoint URL
            </label>
            <div className="flex items-center gap-2">
              <code
                id="scim-endpoint"
                className="flex-1 rounded-lg border border-border bg-surface-secondary px-3 py-2 text-sm font-mono text-text-primary break-all"
              >
                {config.endpointUrl}
              </code>
              <Button
                variant="ghost"
                size="sm"
                icon={copied === 'url' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                onClick={() => handleCopy(config.endpointUrl, 'url')}
                aria-label="Copy endpoint URL"
              />
            </div>
            <p className="text-xs text-text-tertiary">
              Configure this URL in your IdP's SCIM client settings
            </p>
          </Stack>

          <Stack gap={2}>
            <label className="text-sm font-medium text-text-secondary" htmlFor="scim-token">
              Bearer Token
            </label>
            <div className="flex items-center gap-2">
              <code
                id="scim-token"
                className="flex-1 rounded-lg border border-border bg-surface-secondary px-3 py-2 text-sm font-mono text-text-primary break-all"
              >
                {showToken ? config.bearerToken : maskedToken}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowToken(!showToken)}
                aria-label={showToken ? 'Hide token' : 'Show token'}
              >
                {showToken ? 'Hide' : 'Show'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={copied === 'token' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                onClick={() => handleCopy(config.bearerToken, 'token')}
                aria-label="Copy bearer token"
              />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-text-tertiary">
                {config.lastTokenRegeneratedAt
                  ? `Last regenerated: ${new Date(config.lastTokenRegeneratedAt).toLocaleDateString()}`
                  : 'Token generated on SCIM activation'}
              </p>
              <Button
                variant="ghost"
                size="sm"
                icon={<RefreshCw className="h-3.5 w-3.5" />}
                loading={regenerating}
                onClick={handleRegenerateToken}
                aria-label="Regenerate bearer token"
              >
                Regenerate
              </Button>
            </div>
          </Stack>
        </div>

        <div className="rounded-lg border border-border bg-surface-secondary p-4">
          <div className="flex items-start gap-3">
            <ExternalLink className="mt-0.5 h-4 w-4 flex-shrink-0 text-text-tertiary" />
            <div className="text-sm text-text-secondary">
              <p className="font-medium text-text-primary">Setup Instructions</p>
              <ol className="mt-1 list-decimal list-inside space-y-1 text-text-tertiary">
                <li>Enable SCIM provisioning using the toggle above</li>
                <li>Copy the endpoint URL and bearer token to your IdP</li>
                <li>Configure user/group attribute mappings in your IdP</li>
                <li>Test provisioning with a single user before bulk sync</li>
              </ol>
            </div>
          </div>
        </div>
      </Stack>
    </Card>
  );
}
