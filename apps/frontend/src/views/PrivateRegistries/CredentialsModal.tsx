import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Card, Stack, Input, Alert, RadioGroup } from '@nexus-engineering/shared';
import { fetchRegistryCredentials, upsertRegistryCredentials, deleteRegistryCredentials } from '../../api/client';

type AuthType = 'none' | 'basic' | 'token' | 'env';

const AUTH_OPTIONS: { value: AuthType; label: string; description: string }[] = [
  { value: 'none', label: 'No Auth', description: 'Connect to a public registry' },
  { value: 'basic', label: 'Basic Auth', description: 'Username + password authentication' },
  { value: 'token', label: 'Token Auth', description: 'Bearer token authentication' },
  { value: 'env', label: 'Environment Variable', description: 'Secret read from env at scan time' },
];

interface Props {
  registryId: string;
  registryName: string;
  onClose: () => void;
  onSaved: () => void;
  onRemoved: () => void;
}

export function CredentialsModal({ registryId, registryName, onClose, onSaved, onRemoved }: Props) {
  const [authType, setAuthType] = useState<AuthType>('none');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [envVar, setEnvVar] = useState('');
  const [hasExisting, setHasExisting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [removeConfirm, setRemoveConfirm] = useState(false);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const creds = await fetchRegistryCredentials(registryId);
      if (creds) {
        setHasExisting(true);
        setAuthType(creds.authType as AuthType);
        if (creds.username) setUsername(creds.username);
        if (creds.envVar) setEnvVar(creds.envVar);
      }
      setLoading(false);
    };
    void load();
  }, [registryId]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveError(null);
    try {
      if (authType === 'basic') {
        if (!username || !password) { setSaveError('Username and password are required'); setSaving(false); return; }
        const result = await upsertRegistryCredentials(registryId, { authType, username, password });
        if (result) onSaved(); else setSaveError('Failed to save credentials');
        setSaving(false); return;
      } else if (authType === 'token') {
        if (!token) { setSaveError('Token is required'); setSaving(false); return; }
        const result = await upsertRegistryCredentials(registryId, { authType, token });
        if (result) onSaved(); else setSaveError('Failed to save credentials');
        setSaving(false); return;
      } else if (authType === 'env') {
        if (!envVar) { setSaveError('Environment variable name is required'); setSaving(false); return; }
        const result = await upsertRegistryCredentials(registryId, { authType, envVar });
        if (result) onSaved(); else setSaveError('Failed to save credentials');
        setSaving(false); return;
      }
      const result = await upsertRegistryCredentials(registryId, { authType });
      if (result) onSaved();
      else setSaveError('Failed to save credentials');
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save credentials');
    } finally {
      setSaving(false);
    }
  }, [registryId, authType, username, password, token, envVar, onSaved]);

  const handleRemove = useCallback(async () => {
    setRemoving(true);
    try {
      const ok = await deleteRegistryCredentials(registryId);
      if (ok) onRemoved();
    } finally {
      setRemoving(false);
    }
  }, [registryId, onRemoved]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="credentials-modal-title"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        {removeConfirm ? (
          <motion.div
            className="relative z-10"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <Card padding="lg" className="glass-heavy w-full max-w-sm">
              <Stack gap={4}>
                <h3 className="text-lg font-semibold text-text-primary">Remove credentials</h3>
                <Alert variant="warning" title="Are you sure?">
                  <p className="text-sm">
                    This will remove the stored credentials for &ldquo;{registryName}&rdquo;.
                    The registry will still be accessible but scans requiring authentication will fail.
                  </p>
                </Alert>
                <div className="flex items-center justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setRemoveConfirm(false)} disabled={removing}>
                    Cancel
                  </Button>
                  <Button variant="danger" size="sm" loading={removing} onClick={handleRemove}>
                    Remove credentials
                  </Button>
                </div>
              </Stack>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            className="relative z-10"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <Card padding="lg" className="glass-heavy w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <Stack gap={4}>
                <div className="flex items-center justify-between">
                  <h3 id="credentials-modal-title" className="text-lg font-semibold text-text-primary">
                    Registry Credentials
                  </h3>
                  <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
                    ✕
                  </Button>
                </div>

                {loading && <p className="py-4 text-center text-sm text-text-tertiary">Loading...</p>}

                {!loading && (
                  <>
                    {saveError && (
                      <Alert variant="error" title="Error" dismissible onDismiss={() => setSaveError(null)}>
                        {saveError}
                      </Alert>
                    )}

                    <RadioGroup
                      name="authType"
                      label="Auth Type"
                      options={AUTH_OPTIONS}
                      value={authType}
                      onChange={(v: string) => setAuthType(v as AuthType)}
                    />

                    {authType === 'basic' && (
                      <div className="space-y-3">
                        <Input
                          label="Username *"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          fullWidth
                        />
                        <Input
                          label="Password *"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={hasExisting ? '(unchanged)' : ''}
                          helperText={hasExisting ? 'Leave blank to keep existing credential' : undefined}
                          fullWidth
                        />
                      </div>
                    )}

                    {authType === 'token' && (
                      <Input
                        label="Token *"
                        type="password"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        placeholder={hasExisting ? '(unchanged)' : ''}
                        helperText={hasExisting ? 'Leave blank to keep existing credential. Token will be encrypted and never displayed again.' : 'Token will be encrypted and never displayed again.'}
                        fullWidth
                      />
                    )}

                    {authType === 'env' && (
                      <Input
                        label="Environment Variable Name *"
                        value={envVar}
                        onChange={(e) => setEnvVar(e.target.value)}
                        placeholder="e.g., NPM_REGISTRY_TOKEN"
                        fullWidth
                      />
                    )}

                    {hasExisting && (
                      <button
                        onClick={() => setRemoveConfirm(true)}
                        className="text-left text-sm text-error-500 hover:text-error-600 transition-colors"
                      >
                        Remove credentials
                      </button>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>
                        Cancel
                      </Button>
                      <Button variant="primary" size="sm" onClick={handleSave} loading={saving}>
                        Save credentials
                      </Button>
                    </div>
                  </>
                )}
              </Stack>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
