import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { IntegrationsView } from './index';
import type { SyncStatus } from '@nexus-engineering/shared';

const mockStatuses: SyncStatus[] = [
  { connector: 'jira', health: 'disconnected', inProgress: false },
  { connector: 'linear', health: 'disconnected', inProgress: false },
  { connector: 'github', health: 'disconnected', inProgress: false },
];

const mockFetchSyncStatus = vi.fn();
const mockTriggerSync = vi.fn();
const mockTestConnection = vi.fn();
const mockSaveAuthConfig = vi.fn();

vi.mock('../../api/integrations', () => ({
  fetchSyncStatus: () => mockFetchSyncStatus(),
  triggerSync: (...args: unknown[]) => mockTriggerSync(...args),
  testConnection: (...args: unknown[]) => mockTestConnection(...args),
  saveAuthConfig: (...args: unknown[]) => mockSaveAuthConfig(...args),
}));

describe('IntegrationsView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchSyncStatus.mockResolvedValue({ statuses: mockStatuses, error: null });
    mockTestConnection.mockResolvedValue({ success: true });
    mockSaveAuthConfig.mockResolvedValue({ success: true });
    mockTriggerSync.mockResolvedValue({
      connector: 'jira',
      status: 'success',
      itemsTotal: 1,
      itemsSynced: 1,
      itemsFailed: 0,
      errors: [],
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    });
  });

  it('renders loading skeleton while fetching status', () => {
    render(<IntegrationsView />);
    expect(screen.getByText('Integrations')).toBeInTheDocument();
  });

  it('renders sync status after fetch completes', async () => {
    render(<IntegrationsView />);
    await waitFor(() => {
      expect(screen.getByText('Sync Status')).toBeInTheDocument();
    });
    expect(mockFetchSyncStatus).toHaveBeenCalledTimes(1);
  });

  it('renders auth config panels for all 3 connectors', async () => {
    render(<IntegrationsView />);
    await waitFor(() => {
      expect(screen.getByText('Jira Configuration')).toBeInTheDocument();
    });
    expect(screen.getByText('Linear Configuration')).toBeInTheDocument();
    expect(screen.getByText('GitHub Configuration')).toBeInTheDocument();
    expect(screen.getByText('Authentication Configuration')).toBeInTheDocument();
  });

  it('renders sync status dashboard table with disconnected state', async () => {
    render(<IntegrationsView />);
    await waitFor(() => {
      expect(screen.getByRole('table', { name: /integration sync status/i })).toBeInTheDocument();
    });
    const disconnected = screen.getAllByText('Disconnected');
    expect(disconnected).toHaveLength(3);
  });

  it('renders manual sync trigger panel', async () => {
    render(<IntegrationsView />);
    await waitFor(() => {
      expect(screen.getByText('Manual Sync')).toBeInTheDocument();
    });
    const syncButtons = screen.getAllByText('Sync Now');
    expect(syncButtons).toHaveLength(3);
  });

  it('renders error alert when status fetch fails', async () => {
    mockFetchSyncStatus.mockResolvedValue({
      statuses: [],
      error: 'Network error',
    });
    render(<IntegrationsView />);
    await waitFor(() => {
      expect(screen.getByText('Unable to load sync status')).toBeInTheDocument();
    });
    expect(screen.getByText('Network error')).toBeInTheDocument();
  });

  it('renders empty state when no statuses returned', async () => {
    mockFetchSyncStatus.mockResolvedValue({ statuses: [], error: null });
    render(<IntegrationsView />);
    await waitFor(() => {
      expect(screen.getByText('No integrations configured')).toBeInTheDocument();
    });
    expect(screen.getByText('Configure an integration to enable manual sync')).toBeInTheDocument();
  });
});
