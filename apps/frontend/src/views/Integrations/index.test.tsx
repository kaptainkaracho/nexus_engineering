import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { IntegrationsView } from './index';

describe('IntegrationsView', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the page title and description', () => {
    render(<IntegrationsView />);
    expect(screen.getByText('Integrations')).toBeInTheDocument();
    expect(screen.getByText(/Configure and manage connections/)).toBeInTheDocument();
  });

  it('renders auth config panels for all 3 connectors', () => {
    render(<IntegrationsView />);
    expect(screen.getByText('Jira Configuration')).toBeInTheDocument();
    expect(screen.getByText('Linear Configuration')).toBeInTheDocument();
    expect(screen.getByText('GitHub Configuration')).toBeInTheDocument();
    expect(screen.getByText('Authentication Configuration')).toBeInTheDocument();
  });

  it('renders sync status dashboard with table', () => {
    render(<IntegrationsView />);
    expect(screen.getByText('Sync Status')).toBeInTheDocument();
    expect(screen.getByRole('table', { name: /integration sync status/i })).toBeInTheDocument();
    expect(screen.getByText('Connector')).toBeInTheDocument();
    expect(screen.getByText('Health')).toBeInTheDocument();
    expect(screen.getByText('Last Sync')).toBeInTheDocument();
  });

  it('renders manual sync trigger panel', () => {
    render(<IntegrationsView />);
    expect(screen.getByText('Manual Sync')).toBeInTheDocument();
    const syncButtons = screen.getAllByText('Sync Now');
    expect(syncButtons).toHaveLength(3);
  });

  it('shows disconnected badges for initial state', () => {
    render(<IntegrationsView />);
    const disconnected = screen.getAllByText('Disconnected');
    expect(disconnected).toHaveLength(3);
  });
});
