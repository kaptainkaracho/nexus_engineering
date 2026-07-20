import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { AuditLogViewer } from './index';
import * as api from '../../api/client';
import type { AuditLogEntry, AuditLogFilter } from '../../api/client';

function makeEntry(overrides: Partial<AuditLogEntry> = {}): AuditLogEntry {
  return {
    id: 'log-1',
    timestamp: '2026-07-19T10:30:00Z',
    userId: 'user-1',
    userEmail: 'alice@example.com',
    action: 'CREATE',
    resourceType: 'organization',
    resourceId: 'org-42',
    details: 'Created new organization "Acme Corp"',
    ipAddress: '192.168.1.1',
    ...overrides,
  };
}

function auditLogResponse(entries: AuditLogEntry[], total?: number) {
  return {
    data: entries,
    total: total ?? entries.length,
    limit: 50,
    offset: 0,
    hasMore: false,
  };
}

describe('AuditLogViewer', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('shows loading state initially', () => {
    vi.spyOn(api, 'fetchAuditLogs').mockReturnValue(new Promise(() => {}));
    render(<AuditLogViewer />);
    expect(screen.getByText(/Loading audit logs/i)).toBeInTheDocument();
  });

  it('renders table with log entries after load', async () => {
    vi.spyOn(api, 'fetchAuditLogs').mockResolvedValue(auditLogResponse([makeEntry()]));
    render(<AuditLogViewer />);

    await waitFor(() => expect(screen.queryByText(/Loading audit logs/i)).not.toBeInTheDocument());
    expect(screen.getByText('1 Entry')).toBeInTheDocument();
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    expect(screen.getByText('CREATE')).toBeInTheDocument();
  });

  it('shows empty state when no filters active and no entries', async () => {
    vi.spyOn(api, 'fetchAuditLogs').mockResolvedValue(auditLogResponse([]));
    render(<AuditLogViewer />);

    await waitFor(() => expect(screen.getByText(/No Audit Logs Yet/i)).toBeInTheDocument());
  });

  it('shows no matching entries state when filters active and no results', async () => {
    vi.spyOn(api, 'fetchAuditLogs').mockResolvedValue(auditLogResponse([]));
    render(<AuditLogViewer />);

    await waitFor(() => expect(screen.queryByText(/Loading audit logs/i)).not.toBeInTheDocument());

    const searchInput = screen.getByLabelText(/Search/i);
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    fireEvent.click(screen.getByRole('button', { name: /Apply/i }));

    await waitFor(() => expect(screen.getByText(/No Matching Entries/i)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /Reset Filters/i })).toBeInTheDocument();
  });

  it('shows error state with retry when fetch fails', async () => {
    vi.spyOn(api, 'fetchAuditLogs').mockRejectedValue(new Error('Network error'));
    render(<AuditLogViewer />);

    await waitFor(() => expect(screen.getByText(/Error loading audit logs/i)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('applies filters when Apply button is clicked', async () => {
    const fetchSpy = vi.spyOn(api, 'fetchAuditLogs').mockResolvedValue(auditLogResponse([makeEntry()]));
    render(<AuditLogViewer />);

    await waitFor(() => expect(screen.queryByText(/Loading audit logs/i)).not.toBeInTheDocument());

    const actionSelect = screen.getByLabelText(/Action/i);
    fireEvent.change(actionSelect, { target: { value: 'DELETE' } });

    const searchInput = screen.getByLabelText(/Search/i);
    fireEvent.change(searchInput, { target: { value: 'alice' } });

    fireEvent.click(screen.getByRole('button', { name: /Apply/i }));

    await waitFor(() => {
      const lastCall = fetchSpy.mock.calls[fetchSpy.mock.calls.length - 1][0];
      expect(lastCall?.action).toBe('DELETE');
      expect(lastCall?.search).toBe('alice');
    });
  });

  it('resets filters when Reset button is clicked', async () => {
    vi.spyOn(api, 'fetchAuditLogs').mockResolvedValue(auditLogResponse([]));
    render(<AuditLogViewer />);

    await waitFor(() => expect(screen.queryByText(/Loading audit logs/i)).not.toBeInTheDocument());

    const searchInput = screen.getByLabelText(/Search/i);
    fireEvent.change(searchInput, { target: { value: 'test' } });
    fireEvent.click(screen.getByRole('button', { name: /Apply/i }));

    await waitFor(() => expect(screen.getByText(/No Matching Entries/i)).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Reset Filters/i }));

    await waitFor(() => expect(screen.getByText(/No Audit Logs Yet/i)).toBeInTheDocument());
    expect(screen.getByLabelText(/Search/i)).toHaveValue('');
  });

  it('expands row details on click', async () => {
    const entry = makeEntry({ details: 'Created new org' });
    vi.spyOn(api, 'fetchAuditLogs').mockResolvedValue(auditLogResponse([entry]));
    render(<AuditLogViewer />);

    await waitFor(() => expect(screen.queryByText(/Loading audit logs/i)).not.toBeInTheDocument());

    const toggleBtn = screen.getByRole('button', { name: /Expand details for alice/i });
    fireEvent.click(toggleBtn);

    const detailsCard = screen.getByRole('region', { name: 'Entry details' });
    expect(within(detailsCard).getByText('Created new org')).toBeInTheDocument();
    expect(within(detailsCard).getByText('192.168.1.1')).toBeInTheDocument();
  });

  it('navigates pages with pagination controls', async () => {
    const entries = Array.from({ length: 60 }, (_, i) =>
      makeEntry({ id: `log-${i}`, userEmail: `user${i}@example.com` }),
    );
    vi.spyOn(api, 'fetchAuditLogs').mockResolvedValue(auditLogResponse(entries.slice(0, 50), 60));
    render(<AuditLogViewer />);

    await waitFor(() => expect(screen.queryByText(/Loading audit logs/i)).not.toBeInTheDocument());

    expect(screen.getByText(/Page 1 of 2/)).toBeInTheDocument();

    const nextBtn = screen.getByRole('button', { name: /Next page/i });
    fireEvent.click(nextBtn);

    await waitFor(() => expect(screen.getByText(/Page 2 of 2/)).toBeInTheDocument());
  });

  it('applies filter on Enter key in search input', async () => {
    const fetchSpy = vi.spyOn(api, 'fetchAuditLogs').mockResolvedValue(auditLogResponse([makeEntry()]));
    render(<AuditLogViewer />);

    await waitFor(() => expect(screen.queryByText(/Loading audit logs/i)).not.toBeInTheDocument());

    const searchInput = screen.getByLabelText(/Search/i);
    fireEvent.change(searchInput, { target: { value: 'search-term' } });
    fireEvent.keyDown(searchInput, { key: 'Enter' });

    await waitFor(() => {
      const lastCall = fetchSpy.mock.calls[fetchSpy.mock.calls.length - 1][0];
      expect(lastCall?.search).toBe('search-term');
    });
  });

  it('renders date range filter inputs', async () => {
    vi.spyOn(api, 'fetchAuditLogs').mockResolvedValue(auditLogResponse([makeEntry()]));
    render(<AuditLogViewer />);

    await waitFor(() => expect(screen.queryByText(/Loading audit logs/i)).not.toBeInTheDocument());

    expect(screen.getByLabelText(/From Date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/To Date/i)).toBeInTheDocument();
  });

  it('includes date range in filter when Apply is clicked', async () => {
    const fetchSpy = vi.spyOn(api, 'fetchAuditLogs').mockResolvedValue(auditLogResponse([makeEntry()]));
    render(<AuditLogViewer />);

    await waitFor(() => expect(screen.queryByText(/Loading audit logs/i)).not.toBeInTheDocument());

    const fromDate = screen.getByLabelText(/From Date/i);
    const toDate = screen.getByLabelText(/To Date/i);
    fireEvent.change(fromDate, { target: { value: '2026-07-01' } });
    fireEvent.change(toDate, { target: { value: '2026-07-31' } });
    fireEvent.click(screen.getByRole('button', { name: /Apply/i }));

    await waitFor(() => {
      const lastCall = fetchSpy.mock.calls[fetchSpy.mock.calls.length - 1][0];
      expect(lastCall?.startDate).toBe('2026-07-01');
      expect(lastCall?.endDate).toBe('2026-07-31');
    });
  });

  it('renders export buttons when entries are loaded', async () => {
    vi.spyOn(api, 'fetchAuditLogs').mockResolvedValue(auditLogResponse([makeEntry()]));
    render(<AuditLogViewer />);

    await waitFor(() => expect(screen.queryByText(/Loading audit logs/i)).not.toBeInTheDocument());

    expect(screen.getByRole('button', { name: /Export as CSV/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Export as JSON/i })).toBeInTheDocument();
  });

  it('calls exportAuditLogs with CSV format on CSV button click', async () => {
    const exportSpy = vi.spyOn(api, 'exportAuditLogs').mockResolvedValue(new Blob());
    vi.spyOn(api, 'fetchAuditLogs').mockResolvedValue(auditLogResponse([makeEntry()]));
    render(<AuditLogViewer />);

    await waitFor(() => expect(screen.queryByText(/Loading audit logs/i)).not.toBeInTheDocument());

    const csvBtn = screen.getByRole('button', { name: /Export as CSV/i });
    fireEvent.click(csvBtn);

    await waitFor(() => {
      expect(exportSpy).toHaveBeenCalledWith('csv', expect.any(Object));
    });
  });

  it('calls exportAuditLogs with JSON format on JSON button click', async () => {
    const exportSpy = vi.spyOn(api, 'exportAuditLogs').mockResolvedValue(new Blob());
    vi.spyOn(api, 'fetchAuditLogs').mockResolvedValue(auditLogResponse([makeEntry()]));
    render(<AuditLogViewer />);

    await waitFor(() => expect(screen.queryByText(/Loading audit logs/i)).not.toBeInTheDocument());

    const jsonBtn = screen.getByRole('button', { name: /Export as JSON/i });
    fireEvent.click(jsonBtn);

    await waitFor(() => {
      expect(exportSpy).toHaveBeenCalledWith('json', expect.any(Object));
    });
  });
});
