import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Card, Container, Stack, Input, Alert, Badge, RadioGroup } from '@nexus-engineering/shared';
import type { ArtifactRegistry, RegistryProviderType, RegistryCredentials, RegistryArtifact } from '@nexus-engineering/shared';
import {
  fetchRegistries,
  createRegistry,
  updateRegistry,
  deleteRegistry,
  toggleRegistry,
  scanRegistry,
  upsertRegistryCredentials,
  deleteRegistryCredentials,
  fetchRegistryCredentials,
  fetchRegistryArtifacts,
  type RegistryCreateRequest,
} from '../../api/client';
import { CredentialsModal } from './CredentialsModal';

const PROVIDER_TYPES: { value: RegistryProviderType; label: string; icon: string }[] = [
  { value: 'npm', label: 'npm', icon: '📦' },
  { value: 'pypi', label: 'PyPI', icon: '🐍' },
  { value: 'maven', label: 'Maven', icon: 'M' },
  { value: 'generic', label: 'Generic', icon: '🔲' },
];

const VISIBILITY_OPTIONS = [
  { value: 'private' as const, label: 'Private', description: 'Only you and admins' },
  { value: 'team' as const, label: 'Team', description: 'Specific teams in your org' },
  { value: 'organization' as const, label: 'Organization', description: 'All org members' },
];

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
  registryType: 'generic',
  url: '',
  visibility: 'private',
});

function formatRelative(iso: string | null): string {
  if (!iso) return 'Never scanned';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function TypeIcon({ type, size = 'md' }: { type: RegistryProviderType; size?: 'sm' | 'md' }) {
  const p = PROVIDER_TYPES.find((t) => t.value === type);
  const dim = size === 'sm' ? 'h-8 w-8 text-sm' : 'h-10 w-10 text-base';
  const colors: Record<RegistryProviderType, string> = {
    npm: 'bg-error-50 text-error-600 dark:bg-error-950 dark:text-error-400',
    pypi: 'bg-info-50 text-info-600 dark:bg-info-950 dark:text-info-400',
    maven: 'bg-warning-50 text-warning-600 dark:bg-warning-950 dark:text-warning-400',
    generic: 'bg-neutral-50 text-neutral-600 dark:bg-neutral-950 dark:text-neutral-400',
  };
  return (
    <span
      className={`inline-flex ${dim} items-center justify-center rounded-lg ${colors[type]} font-bold`}
      aria-hidden="true"
    >
      {p?.icon ?? '🔲'}
    </span>
  );
}

function Spinner({ className }: { className?: string }) {
  return (
    <svg className={`inline-block h-4 w-4 animate-spin ${className ?? ''}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2" aria-live="polite">
      {toasts.map((t) => (
        <Alert key={t.id} variant={t.variant} title={t.title} dismissible onDismiss={() => {}}>
          {t.message}
        </Alert>
      ))}
    </div>
  );
}

interface Toast {
  id: string
  variant: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
}

export function PrivateRegistries() {
  const [registries, setRegistries] = useState<ArtifactRegistry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [credentialsModal, setCredentialsModal] = useState<{ registryId: string; registryName: string } | null>(null);

  const [scanningId, setScanningId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedCredentials, setExpandedCredentials] = useState<RegistryCredentials | null>(null);
  const [expandedArtifacts, setExpandedArtifacts] = useState<RegistryArtifact[]>([]);
  const [expanding, setExpanding] = useState(false);

  const [overflowOpen, setOverflowOpen] = useState<string | null>(null);

  const addToast = useCallback((variant: Toast['variant'], title: string, message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, variant, title, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

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

  useEffect(() => { void loadRegistries(); }, [loadRegistries]);

  const filtered = useMemo(() => {
    return registries.filter((r) => {
      if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (typeFilter !== 'all' && r.registryType !== typeFilter) return false;
      if (statusFilter === 'enabled' && !r.enabled) return false;
      if (statusFilter === 'disabled' && r.enabled) return false;
      return true;
    });
  }, [registries, search, typeFilter, statusFilter]);

  const handleOpenCreate = useCallback(() => {
    setForm(emptyForm());
    setFormErrors({});
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
    setFormErrors({});
    setEditingId(registry.id);
    setModalMode('edit');
    setSaveError(null);
    setOverflowOpen(null);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalMode(null);
    setEditingId(null);
    setSaveError(null);
    setFormErrors({});
  }, []);

  const handleFormChange = useCallback(
    (field: keyof FormState, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      if (formErrors[field]) setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    },
    [formErrors],
  );

  const validate = useCallback((): boolean => {
    const errors: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) errors.name = 'Name is required';
    else if (form.name.trim().length > 128) errors.name = 'Name must be 128 characters or fewer';
    if (form.description.length > 500) errors.description = 'Description must be 500 characters or fewer';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [form]);

  const handleSave = useCallback(async () => {
    if (!validate()) return;
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
        addToast('success', 'Registry created', `"${form.name.trim()}" created successfully`);
      } else if (modalMode === 'edit' && editingId) {
        await updateRegistry(editingId, {
          name: form.name.trim() || undefined,
          description: form.description.trim() || undefined,
          url: form.url.trim() || undefined,
          visibility: form.visibility,
        });
        addToast('success', 'Registry updated', `"${form.name.trim()}" updated successfully`);
      }
      handleCloseModal();
      void loadRegistries();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save registry');
    } finally {
      setSaving(false);
    }
  }, [form, modalMode, editingId, handleCloseModal, loadRegistries, validate, addToast]);

  const handleDelete = useCallback(async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      const ok = await deleteRegistry(deleteConfirm);
      if (ok) {
        const name = registries.find((r) => r.id === deleteConfirm)?.name ?? '';
        setDeleteConfirm(null);
        addToast('success', 'Registry deleted', `"${name}" has been deleted`);
        void loadRegistries();
      }
    } finally {
      setDeleting(false);
    }
  }, [deleteConfirm, registries, loadRegistries, addToast]);

  const handleToggle = useCallback(
    async (registry: ArtifactRegistry) => {
      await toggleRegistry(registry.id, !registry.enabled);
      addToast('info', registry.enabled ? 'Registry disabled' : 'Registry enabled', `"${registry.name}" ${registry.enabled ? 'disabled' : 'enabled'}`);
      void loadRegistries();
    },
    [loadRegistries, addToast],
  );

  const handleScan = useCallback(
    async (registry: ArtifactRegistry) => {
      setScanningId(registry.id);
      setOverflowOpen(null);
      try {
        const result = await scanRegistry(registry.id);
        if (result.success) {
          addToast('success', 'Scan completed', `"${registry.name}" — ${result.packagesFound ?? 0} packages found`);
        } else {
          addToast('error', 'Scan failed', result.error ?? 'Unknown error');
        }
        void loadRegistries();
      } finally {
        setScanningId(null);
      }
    },
    [loadRegistries, addToast],
  );

  const handleOpenCredentials = useCallback((registry: ArtifactRegistry) => {
    setCredentialsModal({ registryId: registry.id, registryName: registry.name });
    setOverflowOpen(null);
  }, []);

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

  useEffect(() => {
    if (overflowOpen) {
      const close = () => setOverflowOpen(null);
      document.addEventListener('click', close);
      return () => document.removeEventListener('click', close);
    }
  }, [overflowOpen]);

  return (
    <Container size="lg">
      <ToastContainer toasts={toasts} />
      <Stack gap={6}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-text-primary">Registries</h2>
            <p className="mt-1 text-sm text-text-secondary">
              Manage private artifact registries for your organization.
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={handleOpenCreate}>
            + Create
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Input
            placeholder="Search registries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-72"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-10 rounded-lg border border-border bg-surface-primary px-3 text-sm text-text-primary"
            aria-label="Filter by type"
          >
            <option value="all">All Types</option>
            {PROVIDER_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-lg border border-border bg-surface-primary px-3 text-sm text-text-primary"
            aria-label="Filter by status"
          >
            <option value="all">All</option>
            <option value="enabled">Enabled</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>

        {loadError && (
          <Alert variant="error" title="Error" dismissible onDismiss={() => setLoadError(null)}>
            <p className="text-sm">{loadError}</p>
            <Button variant="ghost" size="sm" onClick={loadRegistries} className="mt-2">
              Retry
            </Button>
          </Alert>
        )}

        {loading && (
          <Stack gap={4}>
            {[1, 2, 3].map((i) => (
              <Card key={i} padding="md" className="animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-surface-tertiary" />
                  <div className="flex-1 space-y-3">
                    <div className="h-4 w-3/4 rounded bg-surface-tertiary" />
                    <div className="h-3 w-1/2 rounded bg-surface-tertiary" />
                    <div className="h-8 w-20 rounded bg-surface-tertiary" />
                  </div>
                </div>
              </Card>
            ))}
          </Stack>
        )}

        {!loading && !loadError && filtered.length === 0 && registries.length === 0 && (
          <Card padding="lg">
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <span className="text-4xl" aria-hidden="true">📦</span>
              <h3 className="text-lg font-semibold text-text-primary">No registries configured</h3>
              <p className="max-w-md text-sm text-text-tertiary">
                Connect your organization&apos;s private package registries to discover artifacts
                from npm, PyPI, Maven, and more.
              </p>
              <Button variant="primary" size="sm" onClick={handleOpenCreate}>
                + Create your first registry
              </Button>
            </div>
          </Card>
        )}

        {!loading && !loadError && filtered.length === 0 && registries.length > 0 && (
          <Card padding="md">
            <p className="py-8 text-center text-sm text-text-tertiary">
              No registries match your filters. Try adjusting your search or filter criteria.
            </p>
          </Card>
        )}

        {!loading && !loadError && filtered.length > 0 && (
          <div className="grid gap-4 lg:grid-cols-2">
            {filtered.map((registry) => (
              <Card key={registry.id} padding="md" variant="default">
                <div className="flex items-start gap-4">
                  <TypeIcon type={registry.registryType} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <button
                          onClick={() => handleExpand(registry.id)}
                          className="text-base font-semibold text-text-primary hover:text-primary-500 transition-colors text-left"
                        >
                          {registry.name}
                        </button>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <Badge variant="info">{registry.registryType.toUpperCase()}</Badge>
                          <Badge variant={registry.enabled ? 'completed' : 'draft'}>
                            {registry.enabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                      </div>
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); setOverflowOpen(overflowOpen === registry.id ? null : registry.id); }}
                          aria-label={`Actions for ${registry.name}`}
                          aria-expanded={overflowOpen === registry.id}
                        >
                          ⋮
                        </Button>
                        {overflowOpen === registry.id && (
                          <div
                            className="absolute right-0 top-full z-40 mt-1 w-48 rounded-lg border border-border bg-surface-primary py-1 shadow-lg"
                            role="menu"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button role="menuitem" className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text-primary hover:bg-surface-tertiary transition-colors" onClick={() => handleOpenEdit(registry)}>
                              ✏️ Edit
                            </button>
                            <button role="menuitem" className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text-primary hover:bg-surface-tertiary transition-colors" onClick={() => handleOpenCredentials(registry)}>
                              🔑 Credentials
                            </button>
                            <button role="menuitem" className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text-primary hover:bg-surface-tertiary transition-colors" onClick={() => { handleToggle(registry); setOverflowOpen(null); }}>
                              {registry.enabled ? '⏸️ Disable' : '▶️ Enable'}
                            </button>
                            <hr className="my-1 border-border" />
                            <button role="menuitem" className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-error-500 hover:bg-error-50 dark:hover:bg-error-950 transition-colors" onClick={() => { setDeleteConfirm(registry.id); setOverflowOpen(null); }}>
                              🗑️ Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {registry.url && (
                      <p className="mt-1 truncate text-sm text-text-secondary">{registry.url}</p>
                    )}

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 text-xs text-text-tertiary">
                        <span>-- packages</span>
                        <span>{formatRelative(null)}</span>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        loading={scanningId === registry.id}
                        disabled={scanningId === registry.id}
                        onClick={(e) => { e.stopPropagation(); handleScan(registry); }}
                      >
                        {scanningId === registry.id ? 'Scanning...' : 'Scan'}
                      </Button>
                    </div>
                  </div>
                </div>

                {expandedId === registry.id && (
                  <div className="mt-4 border-t border-border pt-4" role="region" aria-label={`Details for ${registry.name}`}>
                    {expanding ? (
                      <div className="flex items-center justify-center py-4">
                        <Spinner className="h-5 w-5" />
                      </div>
                    ) : (
                      <div className="space-y-3 text-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-xs text-text-tertiary">Visibility</span>
                            <p className="font-medium text-text-primary capitalize">{registry.visibility}</p>
                          </div>
                          <div>
                            <span className="text-xs text-text-tertiary">Created</span>
                            <p className="font-medium text-text-primary">{new Date(registry.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        {registry.description && (
                          <p className="text-text-secondary">{registry.description}</p>
                        )}
                        <div>
                          <span className="text-xs font-medium text-text-tertiary">Credentials</span>
                          {expandedCredentials ? (
                            <div className="mt-1 rounded-md bg-surface-secondary/50 p-2">
                              <p className="text-text-primary">{expandedCredentials.authType}</p>
                              {expandedCredentials.username && <p className="text-xs text-text-tertiary font-mono">{expandedCredentials.username}</p>}
                            </div>
                          ) : (
                            <p className="mt-1 text-text-tertiary">No credentials configured</p>
                          )}
                        </div>
                        <div>
                          <span className="text-xs font-medium text-text-tertiary">Artifacts ({expandedArtifacts.length})</span>
                          {expandedArtifacts.length > 0 ? (
                            <div className="mt-1 max-h-32 overflow-y-auto">
                              {expandedArtifacts.map((a) => (
                                <p key={a.id} className="font-mono text-xs text-text-secondary">{a.artifactId}</p>
                              ))}
                            </div>
                          ) : (
                            <p className="mt-1 text-text-tertiary">No artifacts</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {!loading && !loadError && registries.length > 0 && (
          <p className="text-center text-xs text-text-tertiary">
            Showing {filtered.length} of {registries.length} {registries.length === 1 ? 'registry' : 'registries'}
          </p>
        )}
      </Stack>

      {modalMode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="registry-modal-title"
          onClick={(e) => { if (e.target === e.currentTarget) handleCloseModal(); }}
        >
          <Card padding="lg" className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <Stack gap={4}>
              <div className="flex items-center justify-between">
                <h3 id="registry-modal-title" className="text-lg font-semibold text-text-primary">
                  {modalMode === 'create' ? 'Create Registry' : 'Edit Registry'}
                </h3>
                <Button variant="ghost" size="sm" onClick={handleCloseModal} aria-label="Close">
                  ✕
                </Button>
              </div>

              {saveError && (
                <Alert variant="error" title="Error" dismissible onDismiss={() => setSaveError(null)}>
                  {saveError}
                </Alert>
              )}

              <div>
                <Input
                  label="Registry name *"
                  value={form.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  placeholder="e.g., Internal npm Mirror"
                  error={formErrors.name}
                  fullWidth
                  autoFocus
                />
              </div>

              <RadioGroup
                name="registryType"
                label="Registry type"
                options={PROVIDER_TYPES.map((t) => ({
                  value: t.value,
                  label: t.label,
                  icon: <TypeIcon type={t.value} size="sm" />,
                  disabled: modalMode === 'edit',
                }))}
                value={form.registryType}
                onChange={(v: string) => handleFormChange('registryType', v)}
              />

              <Input
                label="URL"
                value={form.url}
                onChange={(e) => handleFormChange('url', e.target.value)}
                placeholder="https://npm.mycompany.com"
                helperText="Required for scanning"
                fullWidth
              />

              <Input
                label="Description"
                value={form.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                placeholder="Describe what this registry is used for"
                error={formErrors.description}
                fullWidth
              />

              <RadioGroup
                name="visibility"
                label="Visibility"
                options={VISIBILITY_OPTIONS}
                value={form.visibility}
                onChange={(v: string) => handleFormChange('visibility', v)}
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={handleCloseModal} disabled={saving}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={handleSave} loading={saving}>
                  {modalMode === 'create' ? 'Create registry' : 'Save changes'}
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
          aria-labelledby="delete-modal-title"
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteConfirm(null); }}
        >
          <Card padding="lg" className="w-full max-w-sm">
            <Stack gap={4}>
              <h3 id="delete-modal-title" className="text-lg font-semibold text-text-primary">
                Delete registry
              </h3>
              <Alert variant="warning" title="Are you sure?">
                <p className="text-sm">
                  This will permanently remove the registry configuration, all stored credentials,
                  artifact associations, and scan history. The artifacts themselves will not be deleted.
                </p>
              </Alert>
              <div className="flex items-center justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(null)} disabled={deleting}>
                  Cancel
                </Button>
                <Button variant="danger" size="sm" loading={deleting} onClick={handleDelete}>
                  Delete registry
                </Button>
              </div>
            </Stack>
          </Card>
        </div>
      )}

      {credentialsModal && (
        <CredentialsModal
          registryId={credentialsModal.registryId}
          registryName={credentialsModal.registryName}
          onClose={() => setCredentialsModal(null)}
          onSaved={() => {
            setCredentialsModal(null);
            addToast('success', 'Credentials saved', 'Registry credentials updated successfully');
            void loadRegistries();
          }}
          onRemoved={() => {
            setCredentialsModal(null);
            addToast('info', 'Credentials removed', 'Registry credentials have been removed');
            void loadRegistries();
          }}
        />
      )}
    </Container>
  );
}

export default PrivateRegistries;
