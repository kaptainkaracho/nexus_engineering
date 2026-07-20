import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

  it('shows loading skeleton initially', () => {
    vi.spyOn(api, 'fetchRegistries').mockReturnValue(new Promise(() => {}));
    render(<PrivateRegistries />);
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders registry cards after load', async () => {
    vi.spyOn(api, 'fetchRegistries').mockResolvedValue(listResponse([makeRegistry()]));
    render(<PrivateRegistries />);

    await waitFor(() => expect(screen.queryByText(/acme-packages/i)).toBeInTheDocument());
    expect(screen.getByText('NPM')).toBeInTheDocument();
  });

  it('shows empty state when no registries exist', async () => {
    vi.spyOn(api, 'fetchRegistries').mockResolvedValue(listResponse([]));
    render(<PrivateRegistries />);

    await waitFor(() => expect(screen.getByText(/No registries configured/i)).toBeInTheDocument());
    const createBtn = screen.getByRole('button', { name: /Create your first registry/i });
    expect(createBtn).toBeInTheDocument();
  });

  it('shows error state with retry when fetch fails', async () => {
    vi.spyOn(api, 'fetchRegistries').mockRejectedValue(new Error('Network error'));
    render(<PrivateRegistries />);

    await waitFor(() => expect(screen.getByText('Network error')).toBeInTheDocument());
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('opens create modal when Create button is clicked', async () => {
    vi.spyOn(api, 'fetchRegistries').mockResolvedValue(listResponse([]));
    render(<PrivateRegistries />);

    await waitFor(() => expect(screen.queryByText(/No registries configured/i)).toBeInTheDocument());

    const createBtns = screen.getAllByText(/Create/i);
    fireEvent.click(createBtns[0]);

    expect(screen.getByRole('dialog', { name: /Create Registry/i })).toBeInTheDocument();
  });

  it('calls createRegistry when create form is submitted', async () => {
    const createSpy = vi.spyOn(api, 'createRegistry').mockResolvedValue(makeRegistry());
    vi.spyOn(api, 'fetchRegistries').mockResolvedValue(listResponse([]));
    render(<PrivateRegistries />);

    await waitFor(() => expect(screen.queryByText(/No registries configured/i)).toBeInTheDocument());

    const createBtns = screen.getAllByText(/Create/i);
    fireEvent.click(createBtns[0]);
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

    const nameInput = screen.getByLabelText(/Registry name/i);
    fireEvent.change(nameInput, { target: { value: 'my-registry' } });

    const submitBtn = screen.getByRole('button', { name: /Create registry/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'my-registry', registryType: 'generic' }),
      );
    });
  });

  it('calls scanRegistry when Scan button is clicked', async () => {
    const scanSpy = vi.spyOn(api, 'scanRegistry').mockResolvedValue({ success: true, packagesFound: 42 });
    vi.spyOn(api, 'fetchRegistries').mockResolvedValue(listResponse([makeRegistry()]));
    render(<PrivateRegistries />);

    await waitFor(() => expect(screen.queryByText(/acme-packages/i)).toBeInTheDocument());

    const scanBtn = screen.getByRole('button', { name: /^Scan$/i });
    fireEvent.click(scanBtn);

    await waitFor(() => {
      expect(scanSpy).toHaveBeenCalledWith('reg-1');
    });
  });

  it('shows delete confirmation and deletes', async () => {
    const deleteSpy = vi.spyOn(api, 'deleteRegistry').mockResolvedValue(true);
    vi.spyOn(api, 'fetchRegistries').mockResolvedValue(listResponse([makeRegistry()]));
    render(<PrivateRegistries />);

    await waitFor(() => expect(screen.queryByText(/acme-packages/i)).toBeInTheDocument());

    const actionsBtn = screen.getByRole('button', { name: /Actions for acme-packages/i });
    fireEvent.click(actionsBtn);

    const deleteBtn = screen.getByRole('menuitem', { name: /Delete/i });
    fireEvent.click(deleteBtn);

    await waitFor(() => expect(screen.getByRole('dialog', { name: /Delete registry/i })).toBeInTheDocument());

    const confirmBtn = screen.getByRole('button', { name: /Delete registry/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith('reg-1');
    });
  });

  it('opens credentials modal from overflow menu', async () => {
    vi.spyOn(api, 'fetchRegistries').mockResolvedValue(listResponse([makeRegistry()]));
    vi.spyOn(api, 'fetchRegistryCredentials').mockResolvedValue(null);
    render(<PrivateRegistries />);

    await waitFor(() => expect(screen.queryByText(/acme-packages/i)).toBeInTheDocument());

    const actionsBtn = screen.getByRole('button', { name: /Actions for acme-packages/i });
    fireEvent.click(actionsBtn);

    const credsBtn = screen.getByRole('menuitem', { name: /Credentials/i });
    fireEvent.click(credsBtn);

    await waitFor(() => expect(screen.getByText(/Registry Credentials/i)).toBeInTheDocument());
  });

  it('filters registries by search query', async () => {
    vi.spyOn(api, 'fetchRegistries').mockResolvedValue(listResponse([
      makeRegistry({ id: '1', name: 'alpha-registry' }),
      makeRegistry({ id: '2', name: 'beta-registry' }),
    ]));
    render(<PrivateRegistries />);

    await waitFor(() => expect(screen.queryByText(/alpha-registry/i)).toBeInTheDocument());

    const searchInput = screen.getByPlaceholderText(/Search registries/i);
    fireEvent.change(searchInput, { target: { value: 'beta' } });

    expect(screen.queryByText(/alpha-registry/i)).not.toBeInTheDocument();
    expect(screen.getByText(/beta-registry/i)).toBeInTheDocument();
  });

  it('shows validation error when saving with empty name', async () => {
    vi.spyOn(api, 'fetchRegistries').mockResolvedValue(listResponse([]));
    render(<PrivateRegistries />);

    await waitFor(() => expect(screen.queryByText(/No registries configured/i)).toBeInTheDocument());

    const createBtns = screen.getAllByText(/Create/i);
    fireEvent.click(createBtns[0]);

    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Create registry/i }));

    await waitFor(() => expect(screen.getByText(/Name is required/i)).toBeInTheDocument());
  });

  it('closes modal when Cancel is clicked', async () => {
    vi.spyOn(api, 'fetchRegistries').mockResolvedValue(listResponse([]));
    render(<PrivateRegistries />);

    await waitFor(() => expect(screen.queryByText(/No registries configured/i)).toBeInTheDocument());

    const createBtns = screen.getAllByText(/Create/i);
    fireEvent.click(createBtns[0]);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    const cancelBtn = screen.getAllByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtn[0]);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});
