import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { PrivateRegistries } from './index';
import * as api from '../../api/client';
import type { ArtifactRegistry } from '@nexus-engineering/shared';

function makeRegistry(overrides: Partial<ArtifactRegistry> = {}): ArtifactRegistry {
  return {
    id: 'reg-1',
    name: 'acme-packages',
    description: 'Private npm registry for Acme Corp',
    organizationId: 'org-1',
    visibility: 'private',
    allowedRoles: null,
    registryType: 'npm',
    url: 'https://npm.acme.corp',
    enabled: true,
    createdBy: 'user-1',
    createdAt: '2026-07-01T10:00:00Z',
    updatedAt: '2026-07-15T14:30:00Z',
    ...overrides,
  };
}

function listResponse(registries: ArtifactRegistry[], total?: number) {
  return { data: registries, total: total ?? registries.length };
}

describe('PrivateRegistries', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('shows loading state initially', () => {
    vi.spyOn(api, 'fetchRegistries').mockReturnValue(new Promise(() => {}));
    render(<PrivateRegistries />);
    expect(screen.getByText(/Loading registries/i)).toBeInTheDocument();
  });

  it('renders table with registries after load', async () => {
    vi.spyOn(api, 'fetchRegistries').mockResolvedValue(listResponse([makeRegistry()]));
    render(<PrivateRegistries />);

    await waitFor(() => expect(screen.queryByText(/Loading registries/i)).not.toBeInTheDocument());
    expect(screen.getByText('1 Registry')).toBeInTheDocument();
    expect(screen.getByText('acme-packages')).toBeInTheDocument();
    expect(screen.getByText('NPM')).toBeInTheDocument();
    expect(screen.getByText('Enabled')).toBeInTheDocument();
  });

  it('shows empty state when no registries exist', async () => {
    vi.spyOn(api, 'fetchRegistries').mockResolvedValue(listResponse([]));
    render(<PrivateRegistries />);

    await waitFor(() => expect(screen.getByText(/No Registries Yet/i)).toBeInTheDocument());
    const addButtons = screen.getAllByRole('button', { name: /Add Registry/i });
    expect(addButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('shows error state with alert when fetch fails', async () => {
    vi.spyOn(api, 'fetchRegistries').mockRejectedValue(new Error('Network error'));
    render(<PrivateRegistries />);

    await waitFor(() => expect(screen.getByText('Network error')).toBeInTheDocument());
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('opens create modal when Add Registry is clicked', async () => {
    vi.spyOn(api, 'fetchRegistries').mockResolvedValue(listResponse([]));
    render(<PrivateRegistries />);

    await waitFor(() => expect(screen.queryByText(/Loading registries/i)).not.toBeInTheDocument());

    const addBtns = screen.getAllByRole('button', { name: /Add Registry/i });
    fireEvent.click(addBtns[0]);

    expect(screen.getByRole('dialog', { name: /Add registry/i })).toBeInTheDocument();
    expect(screen.getByText(/Create/i)).toBeInTheDocument();
  });

  it('calls createRegistry when create form is submitted', async () => {
    const createSpy = vi.spyOn(api, 'createRegistry').mockResolvedValue(makeRegistry());
    vi.spyOn(api, 'fetchRegistries').mockResolvedValue(listResponse([]));
    render(<PrivateRegistries />);

    await waitFor(() => expect(screen.queryByText(/Loading registries/i)).not.toBeInTheDocument());

    const addBtns = screen.getAllByRole('button', { name: /Add Registry/i });
    fireEvent.click(addBtns[0]);

    const nameInput = screen.getByLabelText(/Name/i);
    fireEvent.change(nameInput, { target: { value: 'my-registry' } });

    fireEvent.click(screen.getByRole('button', { name: /Create/i }));

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'my-registry', registryType: 'npm' }),
      );
    });
  });

  it('opens edit modal when Edit button is clicked', async () => {
    vi.spyOn(api, 'fetchRegistries').mockResolvedValue(listResponse([makeRegistry()]));
    render(<PrivateRegistries />);

    await waitFor(() => expect(screen.queryByText(/Loading registries/i)).not.toBeInTheDocument());

    const editBtn = screen.getByRole('button', { name: /Edit acme-packages/i });
    fireEvent.click(editBtn);

    expect(screen.getByRole('dialog', { name: /Edit registry/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Name/i)).toHaveValue('acme-packages');
  });

  it('calls updateRegistry when edit form is submitted', async () => {
    const updateSpy = vi.spyOn(api, 'updateRegistry').mockResolvedValue(makeRegistry());
    vi.spyOn(api, 'fetchRegistries').mockResolvedValue(listResponse([makeRegistry()]));
    render(<PrivateRegistries />);

    await waitFor(() => expect(screen.queryByText(/Loading registries/i)).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Edit acme-packages/i }));

    const nameInput = screen.getByLabelText(/Name/i);
    fireEvent.change(nameInput, { target: { value: 'updated-registry' } });

    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(
        'reg-1',
        expect.objectContaining({ name: 'updated-registry' }),
      );
    });
  });

  it('shows delete confirmation dialog', async () => {
    vi.spyOn(api, 'fetchRegistries').mockResolvedValue(listResponse([makeRegistry()]));
    render(<PrivateRegistries />);

    await waitFor(() => expect(screen.queryByText(/Loading registries/i)).not.toBeInTheDocument());

    const deleteBtn = screen.getByRole('button', { name: /Delete acme-packages/i });
    fireEvent.click(deleteBtn);

    expect(screen.getByRole('dialog', { name: /Confirm delete/i })).toBeInTheDocument();
    expect(screen.getByText(/Delete Registry\?/i)).toBeInTheDocument();
  });

  it('calls deleteRegistry when delete is confirmed', async () => {
    const deleteSpy = vi.spyOn(api, 'deleteRegistry').mockResolvedValue(true);
    vi.spyOn(api, 'fetchRegistries').mockResolvedValue(listResponse([makeRegistry()]));
    render(<PrivateRegistries />);

    await waitFor(() => expect(screen.queryByText(/Loading registries/i)).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Delete acme-packages/i }));

    const confirmDialog = screen.getByRole('dialog', { name: /Confirm delete/i });
    const confirmBtn = within(confirmDialog).getByRole('button', { name: /Delete/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith('reg-1');
    });
  });

  it('expands registry details when row is clicked', async () => {
    vi.spyOn(api, 'fetchRegistries').mockResolvedValue(listResponse([makeRegistry()]));
    vi.spyOn(api, 'fetchRegistryCredentials').mockResolvedValue(null);
    vi.spyOn(api, 'fetchRegistryArtifacts').mockResolvedValue([]);
    const { container } = render(<PrivateRegistries />);

    await waitFor(() => expect(screen.queryByText(/Loading registries/i)).not.toBeInTheDocument());

    const row = container.querySelector('tr[role="button"]');
    expect(row).not.toBeNull();
    fireEvent.click(row!);

    await waitFor(() => expect(screen.getByText(/Registry Details/i)).toBeInTheDocument());
    expect(screen.getByText(/No credentials configured/i)).toBeInTheDocument();
    expect(screen.getByText(/No artifacts in this registry/i)).toBeInTheDocument();
  });

  it('shows validation error when saving with empty name', async () => {
    vi.spyOn(api, 'fetchRegistries').mockResolvedValue(listResponse([]));
    render(<PrivateRegistries />);

    await waitFor(() => expect(screen.queryByText(/Loading registries/i)).not.toBeInTheDocument());

    const addBtns = screen.getAllByRole('button', { name: /Add Registry/i });
    fireEvent.click(addBtns[0]);
    fireEvent.click(screen.getByRole('button', { name: /Create/i }));

    await waitFor(() => expect(screen.getByText(/Name is required/i)).toBeInTheDocument());
  });

  it('closes modal when Cancel is clicked', async () => {
    vi.spyOn(api, 'fetchRegistries').mockResolvedValue(listResponse([]));
    render(<PrivateRegistries />);

    await waitFor(() => expect(screen.queryByText(/Loading registries/i)).not.toBeInTheDocument());

    const addBtns = screen.getAllByRole('button', { name: /Add Registry/i });
    fireEvent.click(addBtns[0]);
    expect(screen.getByRole('dialog', { name: /Add registry/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});
