import { useCallback, useEffect, useState } from 'react';
import { Button, Card, Container, Stack, Input, Alert, Badge } from '@nexus-engineering/shared';
import type { ArtifactRegistry, RegistryCredentials, RegistryProviderType, RegistryArtifact } from '@nexus-engineering/shared';
import {
  fetchRegistries,
  createRegistry,
  updateRegistry,
  deleteRegistry,
  toggleRegistry,
  fetchRegistryCredentials,
  fetchRegistryArtifacts,
  type RegistryCreateRequest,
} from '../../api/client';

const PROVIDER_TYPES: { value: RegistryProviderType; label: string }[] = [
  { value: 'npm', label: 'npm' },
  { value: 'pypi', label: 'PyPI' },
  { value: 'maven', label: 'Maven' },
  { value: 'generic', label: 'Generic' },
];

const VISIBILITY_OPTIONS = [
  { value: 'private', label: 'Private' },
  { value: 'team', label: 'Team' },
  { value: 'organization', label: 'Organization' },
] as const;

type ModalMode = 'create' | 'edit' | null;

interface FormState {
  name: string
  description: string
  registryType: RegistryProviderType
  url: string
  visibility: 'private' | 'team' | 'organization'
}

const emptyForm = (): FormState => ({
  name: '',
  description: '',
  registryType: 'npm',
  url: '',
  visibility: 'private',
});

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function PrivateRegistries() {
  const [registries, setRegistries] = useState<ArtifactRegistry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedCredentials, setExpandedCredentials] = useState<RegistryCredentials | null>(null);
  const [expandedArtifacts, setExpandedArtifacts] = useState<RegistryArtifact[]>([]);
  const [expanding, setExpanding] = useState(false);

  const loadRegistries = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetchRegistries();
      setRegistries(res.data);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load registries');
      setRegistries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRegistries();
  }, [loadRegistries]);

  const handleOpenCreate = useCallback(() => {
    setForm(emptyForm());
    setEditingId(null);
    setModalMode('create');
    setSaveError(null);
  }, []);

  const handleOpenEdit = useCallback((registry: ArtifactRegistry) => {
    setForm({
      name: registry.name,
      description: registry.description ?? '',
      registryType: registry.registryType,
      url: registry.url ?? '',
      visibility: registry.visibility,
    });
    setEditingId(registry.id);
    setModalMode('edit');
    setSaveError(null);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalMode(null);
    setEditingId(null);
    setSaveError(null);
  }, []);

  const handleFormChange = useCallback(
    (field: keyof FormState) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
      },
    [],
  );

  const handleSave = useCallback(async () => {
    if (!form.name.trim()) {
      setSaveError('Name is required');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      if (modalMode === 'create') {
        const payload: RegistryCreateRequest = {
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          registryType: form.registryType,
          url: form.url.trim() || undefined,
          visibility: form.visibility,
        };
        await createRegistry(payload);
      } else if (modalMode === 'edit' && editingId) {
        await updateRegistry(editingId, {
          name: form.name.trim() || undefined,
          description: form.description.trim() || undefined,
          url: form.url.trim() || undefined,
          visibility: form.visibility,
        });
      }
      handleCloseModal();
      void loadRegistries();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save registry');
    } finally {
      setSaving(false);
    }
  }, [form, modalMode, editingId, handleCloseModal, loadRegistries]);

  const handleDelete = useCallback(
    async (id: string) => {
      setDeleting(true);
      try {
        const ok = await deleteRegistry(id);
        if (ok) {
          setDeleteConfirm(null);
          void loadRegistries();
        }
      } finally {
        setDeleting(false);
      }
    },
    [loadRegistries],
  );

  const handleToggle = useCallback(
    async (registry: ArtifactRegistry) => {
      await toggleRegistry(registry.id, !registry.enabled);
      void loadRegistries();
    },
    [loadRegistries],
  );

  const handleExpand = useCallback(
    async (id: string) => {
      if (expandedId === id) {
        setExpandedId(null);
        setExpandedCredentials(null);
        setExpandedArtifacts([]);
        return;
      }
      setExpandedId(id);
      setExpanding(true);
      try {
        const [creds, artifacts] = await Promise.all([
          fetchRegistryCredentials(id),
          fetchRegistryArtifacts(id),
        ]);
        setExpandedCredentials(creds);
        setExpandedArtifacts(artifacts);
      } finally {
        setExpanding(false);
      }
    },
    [expandedId],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape' && modalMode) handleCloseModal();
    },
    [modalMode, handleCloseModal],
  );

  useEffect(() => {
    if (modalMode) {
      document.addEventListener('keydown', handleKeyDown as unknown as EventListener);
      return () => document.removeEventListener('keydown', handleKeyDown as unknown as EventListener);
    }
  }, [modalMode, handleKeyDown]);

  return (
    <Container size="lg">
      <Stack gap={6}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-text-primary">Private Registries</h2>
            <p className="mt-1 text-sm text-text-secondary">
              Manage private artifact registries for npm, PyPI, Maven, and generic packages.
              Configure credentials, control visibility, and monitor registry artifacts.
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={handleOpenCreate}>
            Add Registry
          </Button>
        </div>

        {loadError && (
          <Alert variant="error" title="Error" dismissible onDismiss={() => setLoadError(null)}>
            {loadError}
          </Alert>
        )}

        {loading && (
          <Card padding="lg">
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary-500" />
                <p className="text-sm text-text-tertiary">Loading registries…</p>
              </div>
            </div>
          </Card>
        )}

        {!loading && !loadError && registries.length === 0 && (
          <Card variant="outlined" padding="lg">
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <span className="text-3xl" aria-hidden="true">📦</span>
              <h3 className="text-lg font-semibold text-text-primary">No Registries Yet</h3>
              <p className="max-w-md text-sm text-text-tertiary">
                Private registries allow you to host and manage packages for your organization.
                Click &quot;Add Registry&quot; to get started.
              </p>
              <Button variant="primary" size="sm" onClick={handleOpenCreate}>
                Add Registry
              </Button>
            </div>
          </Card>
        )}

        {!loading && !loadError && registries.length > 0 && (
          <Stack gap={4}>
            <Card padding="lg">
              <Stack gap={3}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium uppercase tracking-wide text-text-tertiary">
                    {registries.length} {registries.length === 1 ? 'Registry' : 'Registries'}
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm" aria-label="Private registries">
                    <thead>
                      <tr className="border-b border-border text-xs uppercase tracking-wide text-text-tertiary">
                        <th className="p-3 font-semibold" scope="col">Name</th>
                        <th className="p-3 font-semibold" scope="col">Type</th>
                        <th className="hidden p-3 font-semibold sm:table-cell" scope="col">Visibility</th>
                        <th className="hidden p-3 font-semibold md:table-cell" scope="col">URL</th>
                        <th className="p-3 font-semibold" scope="col">Status</th>
                        <th className="p-3 font-semibold text-right" scope="col">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registries.map((registry) => (
                        <tr
                          key={registry.id}
                          className={`border-b border-border transition-colors hover:bg-surface-secondary/50 cursor-pointer ${
                            expandedId === registry.id ? 'bg-primary-500/5' : ''
                          }`}
                          onClick={() => handleExpand(registry.id)}
                          tabIndex={0}
                          role="button"
                          aria-expanded={expandedId === registry.id}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleExpand(registry.id);
                            }
                          }}
                        >
                          <td className="p-3">
                            <span className="font-medium text-text-primary">{registry.name}</span>
                            {registry.description && (
                              <p className="mt-0.5 text-xs text-text-tertiary truncate max-w-[200px]">
                                {registry.description}
                              </p>
                            )}
                          </td>
                          <td className="p-3">
                            <span className="inline-flex items-center rounded-full bg-primary-500/10 px-2 py-0.5 text-xs font-medium text-primary-700 dark:text-primary-300">
                              {registry.registryType.toUpperCase()}
                            </span>
                          </td>
                          <td className="hidden p-3 text-text-secondary sm:table-cell">
                            {registry.visibility}
                          </td>
                          <td className="hidden max-w-[180px] truncate p-3 font-mono text-xs text-text-tertiary md:table-cell">
                            {registry.url ?? '—'}
                          </td>
                          <td className="p-3">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                              registry.enabled
                                ? 'bg-success-500/10 text-success-700 dark:text-success-300'
                                : 'bg-neutral-500/10 text-neutral-600 dark:text-neutral-400'
                            }`}>
                              <span className={`inline-block h-1.5 w-1.5 rounded-full ${
                                registry.enabled ? 'bg-success-500' : 'bg-neutral-400'
                              }`} aria-hidden="true" />
                              {registry.enabled ? 'Enabled' : 'Disabled'}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); handleToggle(registry); }}
                                aria-label={registry.enabled ? 'Disable registry' : 'Enable registry'}
                              >
                                {registry.enabled ? 'Disable' : 'Enable'}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); handleOpenEdit(registry); }}
                                aria-label={`Edit ${registry.name}`}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); setDeleteConfirm(registry.id); }}
                                aria-label={`Delete ${registry.name}`}
                              >
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Stack>
            </Card>

            {expandedId && (
              <Card variant="outlined" padding="md" role="region" aria-label="Registry details">
                <Stack gap={4}>
                  <h4 className="text-sm font-semibold text-text-primary">Registry Details</h4>

                  {expanding && (
                    <div className="flex items-center justify-center py-4">
                      <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary-500" />
                    </div>
                  )}

                  {!expanding && (
                    <>
                      <div>
                        <h5 className="mb-2 text-xs font-medium uppercase tracking-wide text-text-tertiary">Credentials</h5>
                        {expandedCredentials ? (
                          <div className="rounded-lg border border-border bg-surface-secondary/50 p-3">
                            <div className="grid gap-2 sm:grid-cols-2">
                              <div>
                                <span className="text-xs text-text-tertiary">Auth Type</span>
                                <p className="text-sm font-medium text-text-primary">{expandedCredentials.authType}</p>
                              </div>
                              {expandedCredentials.username && (
                                <div>
                                  <span className="text-xs text-text-tertiary">Username</span>
                                  <p className="text-sm font-mono text-text-primary">{expandedCredentials.username}</p>
                                </div>
                              )}
                              {expandedCredentials.envVar && (
                                <div>
                                  <span className="text-xs text-text-tertiary">Environment Variable</span>
                                  <p className="text-sm font-mono text-text-primary">{expandedCredentials.envVar}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-text-tertiary">No credentials configured.</p>
                        )}
                      </div>

                      <div>
                        <h5 className="mb-2 text-xs font-medium uppercase tracking-wide text-text-tertiary">
                          Artifacts ({expandedArtifacts.length})
                        </h5>
                        {expandedArtifacts.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm" aria-label="Registry artifacts">
                              <thead>
                                <tr className="border-b border-border text-xs uppercase text-text-tertiary">
                                  <th className="py-2 pr-3 font-semibold" scope="col">Artifact ID</th>
                                  <th className="py-2 pr-3 font-semibold" scope="col">Added</th>
                                </tr>
                              </thead>
                              <tbody>
                                {expandedArtifacts.map((artifact) => (
                                  <tr key={artifact.id} className="border-b border-border last:border-0">
                                    <td className="py-2 pr-3 font-mono text-xs text-text-primary">
                                      {artifact.artifactId}
                                    </td>
                                    <td className="py-2 pr-3 text-xs text-text-secondary whitespace-nowrap">
                                      {formatDate(artifact.addedAt)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-sm text-text-tertiary">No artifacts in this registry.</p>
                        )}
                      </div>
                    </>
                  )}
                </Stack>
              </Card>
            )}
          </Stack>
        )}
      </Stack>

      {modalMode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={modalMode === 'create' ? 'Add registry' : 'Edit registry'}
        >
          <Card padding="lg" className="w-full max-w-lg">
            <Stack gap={4}>
              <h3 className="text-lg font-semibold text-text-primary">
                {modalMode === 'create' ? 'Add Registry' : 'Edit Registry'}
              </h3>

              {saveError && (
                <Alert variant="error" title="Error" dismissible onDismiss={() => setSaveError(null)}>
                  {saveError}
                </Alert>
              )}

              <Input
                label="Name *"
                value={form.name}
                onChange={handleFormChange('name')}
                placeholder="my-private-registry"
                fullWidth
              />

              <Input
                label="Description"
                value={form.description}
                onChange={handleFormChange('description')}
                placeholder="Optional description"
                fullWidth
              />

              <div>
                <label htmlFor="registry-type" className="mb-1 block text-xs font-medium text-text-tertiary uppercase tracking-wide">
                  Registry Type
                </label>
                <select
                  id="registry-type"
                  value={form.registryType}
                  onChange={handleFormChange('registryType')}
                  className="w-full rounded-lg border border-border bg-surface-primary px-3 py-2 text-sm text-text-primary transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {PROVIDER_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <Input
                label="URL"
                value={form.url}
                onChange={handleFormChange('url')}
                placeholder="https://registry.example.com"
                fullWidth
              />

              <div>
                <label htmlFor="registry-visibility" className="mb-1 block text-xs font-medium text-text-tertiary uppercase tracking-wide">
                  Visibility
                </label>
                <select
                  id="registry-visibility"
                  value={form.visibility}
                  onChange={handleFormChange('visibility')}
                  className="w-full rounded-lg border border-border bg-surface-primary px-3 py-2 text-sm text-text-primary transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {VISIBILITY_OPTIONS.map((v) => (
                    <option key={v.value} value={v.value}>{v.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={handleCloseModal} disabled={saving}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={handleSave} loading={saving}>
                  {modalMode === 'create' ? 'Create' : 'Save Changes'}
                </Button>
              </div>
            </Stack>
          </Card>
        </div>
      )}

      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Confirm delete"
        >
          <Card padding="lg" className="w-full max-w-sm">
            <Stack gap={4}>
              <h3 className="text-lg font-semibold text-text-primary">Delete Registry?</h3>
              <p className="text-sm text-text-secondary">
                This action cannot be undone. All associated artifacts and credentials will be permanently removed.
              </p>
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteConfirm(null)}
                  disabled={deleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  loading={deleting}
                  onClick={() => handleDelete(deleteConfirm)}
                >
                  Delete
                </Button>
              </div>
            </Stack>
          </Card>
        </div>
      )}
    </Container>
  );
}

export default PrivateRegistries;