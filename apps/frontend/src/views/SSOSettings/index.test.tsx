import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SSOSettings } from './index';
import * as sso from '../../api/sso';

vi.mock('../../api/sso', () => ({
  fetchSSOConfig: vi.fn(),
  toggleProvider: vi.fn(),
  getOAuthUrl: vi.fn((p: string) => `/api/auth/oauth/${p}`),
}));

const mockConfig = {
  providers: [
    { id: '1', name: 'Google', type: 'google' as const, enabled: false, clientId: 'google-id-123', createdAt: '', updatedAt: '' },
    { id: '2', name: 'GitHub', type: 'github' as const, enabled: true, clientId: 'github-id-456', createdAt: '', updatedAt: '' },
    { id: '3', name: 'SAML', type: 'saml' as const, enabled: false, metadataUrl: '', createdAt: '', updatedAt: '' },
  ],
  samlMetadataUrl: 'http://localhost:3001/api/auth/saml/metadata',
};

describe('SSOSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(sso.fetchSSOConfig).mockResolvedValue(mockConfig);
  });

  it('renders loading state initially', () => {
    vi.mocked(sso.fetchSSOConfig).mockReturnValue(new Promise(() => {}));
    render(<SSOSettings />);
    expect(screen.queryByText('SSO Settings')).not.toBeInTheDocument();
  });

  it('renders SSO settings title', async () => {
    render(<SSOSettings />);
    await waitFor(() => {
      expect(screen.getByText('SSO Settings')).toBeInTheDocument();
    });
  });

  it('renders all three provider cards', async () => {
    render(<SSOSettings />);
    await waitFor(() => {
      expect(screen.getByText('Google')).toBeInTheDocument();
      expect(screen.getByText('GitHub')).toBeInTheDocument();
      expect(screen.getByText('SAML')).toBeInTheDocument();
    });
  });

  it('shows correct enable/disable button states per provider', async () => {
    render(<SSOSettings />);
    await waitFor(() => {
      const googleBtn = screen.getByRole('button', { name: 'Enable Google SSO' });
      expect(googleBtn).toBeInTheDocument();
      expect(googleBtn).toHaveTextContent('Enable');

      const githubBtn = screen.getByRole('button', { name: 'Disable GitHub SSO' });
      expect(githubBtn).toBeInTheDocument();
      expect(githubBtn).toHaveTextContent('Disable');

      const samlBtn = screen.getByRole('button', { name: 'Enable SAML SSO' });
      expect(samlBtn).toBeInTheDocument();
      expect(samlBtn).toHaveTextContent('Enable');
    });
  });

  it('toggles provider on button click', async () => {
    vi.mocked(sso.toggleProvider).mockResolvedValue(undefined);
    render(<SSOSettings />);

    await waitFor(() => {
      expect(screen.getByText('SSO Settings')).toBeInTheDocument();
    });

    const googleBtn = screen.getByRole('button', { name: 'Enable Google SSO' });
    fireEvent.click(googleBtn);

    await waitFor(() => {
      expect(sso.toggleProvider).toHaveBeenCalledWith('1', true);
    });
  });

  it('shows SAML metadata URL section', async () => {
    render(<SSOSettings />);
    await waitFor(() => {
      expect(screen.getByText('SAML Metadata URL')).toBeInTheDocument();
      expect(screen.getByText('http://localhost:3001/api/auth/saml/metadata')).toBeInTheDocument();
    });
  });

  it('has copy metadata URL button', async () => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    render(<SSOSettings />);

    await waitFor(() => {
      expect(screen.getByText('SAML Metadata URL')).toBeInTheDocument();
    });

    const copyBtn = screen.getByRole('button', { name: 'Copy metadata URL' });
    fireEvent.click(copyBtn);

    await waitFor(() => {
      expect(screen.getByText('Copied!')).toBeInTheDocument();
    });
  });

  it('has ARIA labels on interactive elements', async () => {
    render(<SSOSettings />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Enable Google SSO' })).toHaveAttribute('aria-label');
      expect(screen.getByRole('button', { name: 'Disable GitHub SSO' })).toHaveAttribute('aria-label');
      expect(screen.getByRole('button', { name: 'Enable SAML SSO' })).toHaveAttribute('aria-label');
      expect(screen.getByRole('button', { name: 'Copy metadata URL' })).toHaveAttribute('aria-label');
    });
  });
});
