import { useCallback, useEffect, useState } from 'react';
import { Card, Container, Stack } from '@nexus-engineering/shared';
import type { ScimConfig } from '@nexus-engineering/shared';
import { fetchScimConfig } from '../../api/scim';
import { ScimConfigPanel } from './ScimConfigPanel';
import { ProvisionedUsersTable } from './ProvisionedUsersTable';
import { ProvisionedGroupsTable } from './ProvisionedGroupsTable';

export function ScimSettings() {
  const [config, setConfig] = useState<ScimConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    try {
      const c = await fetchScimConfig();
      setConfig(c);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadConfig(); }, [loadConfig]);

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
          <h1 className="text-2xl font-bold text-text-primary">SCIM Configuration</h1>
          <p className="text-text-secondary">
            Configure SCIM 2.0 provisioning for automated user and group management.
          </p>
        </Stack>

        {config && (
          <ScimConfigPanel config={config} onConfigChange={setConfig} />
        )}

        <ProvisionedUsersTable />

        <ProvisionedGroupsTable />
      </Stack>
    </Container>
  );
}

export default ScimSettings;
