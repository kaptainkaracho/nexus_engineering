import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { TacViewer } from './index';
import * as api from '../../api/client';
import type { TacDocumentSummary, TacDocument, TacListResponse } from '../../api/client';

function makeSummary(overrides: Partial<TacDocumentSummary> = {}): TacDocumentSummary {
  return {
    id: 'auth/user-auth',
    filePath: '/docs/tests/auth/user-auth.test.yaml',
    domain: 'auth',
    version: '1.0.0',
    source: 'sprint-9-auth-rbac',
    suiteCount: 2,
    caseCount: 5,
    ...overrides,
  };
}

function tacList(documents: TacDocumentSummary[]): TacListResponse {
  return { data: documents, total: documents.length };
}

function makeDoc(): TacDocument {
  return {
    nexus: {
      schema: 'test-doc/v1',
      metadata: { domain: 'auth', version: '1.0.0', source: 'sprint-9-auth-rbac' },
    },
    suites: [
      {
        id: 'auth-user-registration',
        name: 'User Registration',
        description: 'Test cases for the user registration flow',
        cases: [
          {
            id: 'REG-001',
            title: 'Register with valid email and password',
            type: 'e2e',
            priority: 'critical',
            automated: true,
            scenario: {
              given: 'User is on the registration page',
              when: 'They submit a valid form',
              then: 'Account is created',
            },
            acceptanceCriteria: ['Account created', 'Password hashed'],
            tags: ['registration'],
            traceLinks: [
              {
                type: 'verifies',
                target: { id: 'REQ-AUTH-001', documentId: 'docs/requirements/auth/authentication.req.yaml' },
                confidence: 'high',
              },
            ],
          },
        ],
      },
    ],
  };
}

describe('TacViewer', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('shows loading state initially', () => {
    vi.spyOn(api, 'fetchTacDocuments').mockReturnValue(new Promise(() => {}));
    render(<TacViewer />);
    expect(screen.getByText(/Loading documents/i)).toBeInTheDocument();
  });

  it('renders document list after load', async () => {
    vi.spyOn(api, 'fetchTacDocuments').mockResolvedValue(tacList([makeSummary()]));
    render(<TacViewer />);

    await waitFor(() => expect(screen.queryByText(/Loading documents/i)).not.toBeInTheDocument());
    expect(screen.getByText('auth')).toBeInTheDocument();
    expect(screen.getByText(/2 suites · 5 cases/)).toBeInTheDocument();
    expect(screen.getByText(/1 document/)).toBeInTheDocument();
  });

  it('shows empty state when no documents found', async () => {
    vi.spyOn(api, 'fetchTacDocuments').mockResolvedValue(tacList([]));
    render(<TacViewer />);

    await waitFor(() => expect(screen.getByText(/No documents found/i)).toBeInTheDocument());
  });

  it('shows error state with retry when list fetch fails', async () => {
    vi.spyOn(api, 'fetchTacDocuments').mockRejectedValue(new Error('Network error'));
    render(<TacViewer />);

    await waitFor(() => expect(screen.getByText(/Error loading documents/i)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('shows placeholder detail before a document is selected', async () => {
    vi.spyOn(api, 'fetchTacDocuments').mockResolvedValue(tacList([makeSummary()]));
    render(<TacViewer />);

    await waitFor(() => expect(screen.queryByText(/Loading documents/i)).not.toBeInTheDocument());
    expect(screen.getByText(/Select a Document/i)).toBeInTheDocument();
  });

  it('loads and renders a document detail when selected', async () => {
    vi.spyOn(api, 'fetchTacDocuments').mockResolvedValue(tacList([makeSummary()]));
    vi.spyOn(api, 'fetchTacDocument').mockResolvedValue(makeDoc());
    render(<TacViewer />);

    await waitFor(() => expect(screen.getByText('auth')).toBeInTheDocument());

    const option = screen.getByRole('option', { name: /auth/i });
    fireEvent.click(within(option).getByRole('button'));

    await waitFor(() => expect(screen.getByText('User Registration')).toBeInTheDocument());
    expect(screen.getByText('Register with valid email and password')).toBeInTheDocument();
    expect(screen.getByText(/Account created/)).toBeInTheDocument();
    expect(screen.getByText(/REQ-AUTH-001/)).toBeInTheDocument();
  });

  it('shows detail error state with retry when document fetch fails', async () => {
    vi.spyOn(api, 'fetchTacDocuments').mockResolvedValue(tacList([makeSummary()]));
    vi.spyOn(api, 'fetchTacDocument').mockResolvedValue(null);
    render(<TacViewer />);

    await waitFor(() => expect(screen.getByText('auth')).toBeInTheDocument());

    const option = screen.getByRole('option', { name: /auth/i });
    fireEvent.click(within(option).getByRole('button'));

    await waitFor(() => expect(screen.getByText(/Document not found/i)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('selects a document via keyboard (Enter)', async () => {
    vi.spyOn(api, 'fetchTacDocuments').mockResolvedValue(tacList([makeSummary()]));
    vi.spyOn(api, 'fetchTacDocument').mockResolvedValue(makeDoc());
    render(<TacViewer />);

    await waitFor(() => expect(screen.getByText('auth')).toBeInTheDocument());

    const option = screen.getByRole('option', { name: /auth/i });
    fireEvent.keyDown(within(option).getByRole('button'), { key: 'Enter' });

    await waitFor(() => expect(screen.getByText('User Registration')).toBeInTheDocument());
  });

  it('returns to the list via the back button on mobile', async () => {
    vi.spyOn(api, 'fetchTacDocuments').mockResolvedValue(tacList([makeSummary()]));
    vi.spyOn(api, 'fetchTacDocument').mockResolvedValue(makeDoc());
    render(<TacViewer />);

    await waitFor(() => expect(screen.getByText('auth')).toBeInTheDocument());

    const option = screen.getByRole('option', { name: /auth/i });
    fireEvent.click(within(option).getByRole('button'));

    await waitFor(() => expect(screen.getByText('User Registration')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Back to document list/i }));
    expect(screen.getByText(/Select a Document/i)).toBeInTheDocument();
  });

  it('searches documents with a debounced query', async () => {
    const fetchSpy = vi
      .spyOn(api, 'fetchTacDocuments')
      .mockResolvedValue(tacList([makeSummary({ domain: 'auth' })]));
    render(<TacViewer />);

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());

    const search = screen.getByLabelText(/Search documents/i);
    fireEvent.change(search, { target: { value: 'auth' } });

    await waitFor(() => {
      const lastCall = fetchSpy.mock.calls[fetchSpy.mock.calls.length - 1];
      expect(lastCall?.[0]).toBe('auth');
    });
  });
});
