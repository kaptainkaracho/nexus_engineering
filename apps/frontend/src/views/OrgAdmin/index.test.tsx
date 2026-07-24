import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OrgAdmin } from './index';
import * as orgs from '../../api/orgs';

vi.mock('../../api/orgs', () => ({
  fetchOrganizations: vi.fn(),
  fetchOrgMembers: vi.fn(),
  updateMemberRole: vi.fn(),
  removeMember: vi.fn(),
  inviteMember: vi.fn(),
}));

const mockOrgs = [
  { id: 'org-1', name: 'Acme Corp', description: '', memberCount: 3, createdAt: '2026-01-01' },
  { id: 'org-2', name: 'Beta Inc', description: '', memberCount: 1, createdAt: '2026-02-01' },
];

const mockMembers = [
  { id: 'mem-1', userId: 'u1', email: 'alice@acme.com', name: 'Alice', role: 'org:admin' as const, joinedAt: '2026-01-01T00:00:00Z' },
  { id: 'mem-2', userId: 'u2', email: 'bob@acme.com', name: 'Bob', role: 'org:member' as const, joinedAt: '2026-01-15T00:00:00Z' },
  { id: 'mem-3', userId: 'u3', email: 'carol@acme.com', name: 'Carol', role: 'org:viewer' as const, joinedAt: '2026-02-01T00:00:00Z' },
];

describe('OrgAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(orgs.fetchOrganizations).mockResolvedValue(mockOrgs);
  });

  it('renders loading state initially', () => {
    vi.mocked(orgs.fetchOrganizations).mockReturnValue(new Promise(() => {}));
    render(<OrgAdmin />);
    expect(screen.queryByText('Organization Admin')).not.toBeInTheDocument();
  });

  it('renders organization admin title', async () => {
    render(<OrgAdmin />);
    await waitFor(() => {
      expect(screen.getByText('Organization Admin')).toBeInTheDocument();
    });
  });

  it('lists organizations in sidebar', async () => {
    render(<OrgAdmin />);
    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      expect(screen.getByText('Beta Inc')).toBeInTheDocument();
    });
  });

  it('shows member count per organization', async () => {
    render(<OrgAdmin />);
    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  it('shows empty state when no organizations exist', async () => {
    vi.mocked(orgs.fetchOrganizations).mockResolvedValue([]);
    render(<OrgAdmin />);
    await waitFor(() => {
      expect(screen.getByText('No Organizations Yet')).toBeInTheDocument();
    });
  });

  it('shows select org prompt when no org selected', async () => {
    render(<OrgAdmin />);
    await waitFor(() => {
      expect(screen.getByText('Select an Organization')).toBeInTheDocument();
    });
  });

  it('loads and displays members when org is selected', async () => {
    vi.mocked(orgs.fetchOrgMembers).mockResolvedValue(mockMembers);
    render(<OrgAdmin />);

    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Acme Corp'));

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('bob@acme.com')).toBeInTheDocument();
      expect(screen.getByText('Carol')).toBeInTheDocument();
    });
  });

  it('shows invite member section when org is selected', async () => {
    vi.mocked(orgs.fetchOrgMembers).mockResolvedValue(mockMembers);
    render(<OrgAdmin />);

    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Acme Corp'));

    await waitFor(() => {
      expect(screen.getByText('Invite Member')).toBeInTheDocument();
      expect(screen.getByLabelText('Email address')).toBeInTheDocument();
      expect(screen.getByLabelText('Invite role')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Send Invite' })).toBeInTheDocument();
    });
  });

  it('calls inviteMember on invite submission', async () => {
    vi.mocked(orgs.fetchOrgMembers).mockResolvedValue(mockMembers);
    vi.mocked(orgs.inviteMember).mockResolvedValue(undefined);
    render(<OrgAdmin />);

    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Acme Corp'));

    await waitFor(() => {
      expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'dave@acme.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send Invite' }));

    await waitFor(() => {
      expect(orgs.inviteMember).toHaveBeenCalledWith('org-1', 'dave@acme.com', 'org:member');
    });
  });

  it('has role selector per member', async () => {
    vi.mocked(orgs.fetchOrgMembers).mockResolvedValue(mockMembers);
    render(<OrgAdmin />);

    await waitFor(() => expect(screen.getByText('Acme Corp')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Acme Corp'));

    await waitFor(() => {
      const roleSelects = screen.getAllByLabelText(/Role for/);
      expect(roleSelects.length).toBe(3);
    });
  });

  it('calls updateMemberRole on role change', async () => {
    vi.mocked(orgs.fetchOrgMembers).mockResolvedValue(mockMembers);
    vi.mocked(orgs.updateMemberRole).mockResolvedValue(undefined);
    render(<OrgAdmin />);

    await waitFor(() => expect(screen.getByText('Acme Corp')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Acme Corp'));

    await waitFor(() => {
      const bobRole = screen.getByLabelText('Role for Bob');
      expect(bobRole).toBeInTheDocument();
    });

    const bobRole = screen.getByLabelText('Role for Bob');
    fireEvent.change(bobRole, { target: { value: 'org:admin' } });

    await waitFor(() => {
      expect(orgs.updateMemberRole).toHaveBeenCalledWith('org-1', 'u2', 'org:admin');
    });
  });

  it('calls removeMember on remove button click', async () => {
    vi.mocked(orgs.fetchOrgMembers).mockResolvedValue(mockMembers);
    vi.mocked(orgs.removeMember).mockResolvedValue(undefined);
    render(<OrgAdmin />);

    await waitFor(() => expect(screen.getByText('Acme Corp')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Acme Corp'));

    await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument());

    const removeBtns = screen.getAllByRole('button', { name: /Remove/ });
    expect(removeBtns.length).toBe(3);

    fireEvent.click(removeBtns[0]);

    await waitFor(() => {
      expect(orgs.removeMember).toHaveBeenCalledWith('org-1', 'u1');
    });
  });

  it('has ARIA labels on interactive elements', async () => {
    vi.mocked(orgs.fetchOrgMembers).mockResolvedValue(mockMembers);
    render(<OrgAdmin />);

    await waitFor(() => expect(screen.getByText('Acme Corp')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Acme Corp'));

    await waitFor(() => {
      expect(screen.getByLabelText('Email address')).toBeInTheDocument();
      expect(screen.getByLabelText('Invite role')).toBeInTheDocument();
      expect(screen.getByLabelText('Role for Alice')).toBeInTheDocument();
      expect(screen.getByLabelText('Role for Bob')).toBeInTheDocument();
    });
  });
});
