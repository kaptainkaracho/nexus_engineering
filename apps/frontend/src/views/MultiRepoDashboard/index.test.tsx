import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MultiRepoDashboard } from './index';
import * as api from '../../api/client';
import type { DiscoveryArtifact } from '../../api/client';

function makeArtifact(overrides: Partial<DiscoveryArtifact> = {}): DiscoveryArtifact {
  return {
    id: 'art-1',
    type: 'requirement',
    filePath: '/repo/req.yaml',
    repositoryPath: '/repo',
    relativePath: 'req.yaml',
    fileName: 'req.yaml',
    lifecycle: 'discovered',
    metadata: { source: 'scan' },
    errors: [],
    reparseCount: 0,
    createdAt: '2026-07-18T10:00:00Z',
    updatedAt: '2026-07-18T10:00:00Z',
    ...overrides,
  };
}

describe('MultiRepoDashboard', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the page title and description', () => {
    render(<MultiRepoDashboard />);
    expect(screen.getByText('Multi-Repository Scanner')).toBeInTheDocument();
    expect(
      screen.getByText(/Scan multiple repositories simultaneously/i),
    ).toBeInTheDocument();
  });

  it('shows the ready-to-scan empty state by default', () => {
    render(<MultiRepoDashboard />);
    expect(screen.getByText('Ready to Scan')).toBeInTheDocument();
    expect(screen.getByText(/Add one or more repository paths/i)).toBeInTheDocument();
  });

  it('renders a default repository path input', () => {
    render(<MultiRepoDashboard />);
    const input = screen.getByLabelText(/Repository path 1/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('/repo');
  });

  it('has the scan button enabled when paths exist', () => {
    render(<MultiRepoDashboard />);
    expect(screen.getByRole('button', { name: /Scan Repositories/i })).not.toBeDisabled();
  });

  it('adds a new path input when "Add Path" is clicked', () => {
    render(<MultiRepoDashboard />);
    fireEvent.click(screen.getByRole('button', { name: /Add another repository path/i }));
    expect(screen.getByLabelText(/Repository path 2/i)).toBeInTheDocument();
  });

  it('removes a path when the delete button is clicked', () => {
    render(<MultiRepoDashboard />);
    fireEvent.click(screen.getByRole('button', { name: /Add another repository path/i }));

    const removeButtons = screen.getAllByLabelText(/Remove path/i);
    fireEvent.click(removeButtons[0]);

    expect(screen.queryByDisplayValue('/repo')).not.toBeInTheDocument();
  });

  it('does not render remove button when only one path exists', () => {
    render(<MultiRepoDashboard />);
    expect(screen.queryByLabelText(/Remove path/i)).not.toBeInTheDocument();
  });

  it('updates path value on input change', () => {
    render(<MultiRepoDashboard />);
    const input = screen.getByLabelText(/Repository path 1/i);
    fireEvent.change(input, { target: { value: '/my/custom/repo' } });
    expect(input).toHaveValue('/my/custom/repo');
  });

  it('shows the path count indicator', () => {
    render(<MultiRepoDashboard />);
    expect(screen.getByText(/1 path\(s\)/i)).toBeInTheDocument();
  });

  it('disables scan button when paths are empty', () => {
    render(<MultiRepoDashboard />);
    const input = screen.getByLabelText(/Repository path 1/i);
    fireEvent.change(input, { target: { value: '' } });
    expect(screen.getByRole('button', { name: /Scan Repositories/i })).toBeDisabled();
  });

  it('triggers a scan and shows results when completed immediately', async () => {
    const trigger = vi.spyOn(api, 'triggerMultiScan').mockResolvedValue({
      sessionId: 'session-1',
      scans: [{ repositoryPath: '/repo', scanId: 'scan-1', status: 'completed', filesFound: 10, artifactsDetected: 3 }],
      totalFilesFound: 10,
      totalArtifactsDetected: 3,
      scanTimeMs: 1500,
      errors: [],
    });

    render(<MultiRepoDashboard />);
    fireEvent.click(screen.getByRole('button', { name: /Scan Repositories/i }));

    await waitFor(() => {
      expect(trigger).toHaveBeenCalledWith({
        repositoryPaths: ['/repo'],
        scanMode: 'parallel',
      });
    });

    await waitFor(() => {
      const tens = screen.getAllByText('10');
      expect(tens.length).toBeGreaterThanOrEqual(2);
      const threes = screen.getAllByText('3');
      expect(threes.length).toBeGreaterThanOrEqual(2);
      expect(screen.getByText('1.5s')).toBeInTheDocument();
    });
  }, 10000);

  it('shows error state when scan trigger fails', async () => {
    vi.spyOn(api, 'triggerMultiScan').mockRejectedValue(new Error('Network error'));

    render(<MultiRepoDashboard />);
    fireEvent.click(screen.getByRole('button', { name: /Scan Repositories/i }));

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  }, 10000);

  it('shows error card and reponame when scan returns errors', async () => {
    vi.spyOn(api, 'triggerMultiScan').mockResolvedValue({
      sessionId: 'session-1',
      scans: [{ repositoryPath: '/repo', scanId: 'scan-1', status: 'completed', filesFound: 10, artifactsDetected: 3 }],
      totalFilesFound: 10,
      totalArtifactsDetected: 3,
      scanTimeMs: 1500,
      errors: [{ repositoryPath: '/repo', message: 'Permission denied' }],
    });

    const { container } = render(<MultiRepoDashboard />);
    fireEvent.click(screen.getByRole('button', { name: /Scan Repositories/i }));

    await waitFor(() => {
      expect(screen.getByText(/Permission denied/i)).toBeInTheDocument();
    });
  }, 10000);

  it('resets to idle when Reset button is clicked', async () => {
    vi.spyOn(api, 'triggerMultiScan').mockResolvedValue({
      sessionId: 'session-1',
      scans: [{ repositoryPath: '/repo', scanId: 'scan-1', status: 'completed', filesFound: 10, artifactsDetected: 3 }],
      totalFilesFound: 10,
      totalArtifactsDetected: 3,
      scanTimeMs: 1500,
      errors: [],
    });

    render(<MultiRepoDashboard />);
    fireEvent.click(screen.getByRole('button', { name: /Scan Repositories/i }));

    await waitFor(() => expect(screen.getByText(/Reset/i)).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Reset/i }));
    expect(screen.getByText('Ready to Scan')).toBeInTheDocument();
  }, 10000);

  it('shows per-repo view artifacts button on completed scan', async () => {
    vi.spyOn(api, 'triggerMultiScan').mockResolvedValue({
      sessionId: 'session-1',
      scans: [{ repositoryPath: '/repo', scanId: 'scan-1', status: 'completed', filesFound: 10, artifactsDetected: 3 }],
      totalFilesFound: 10,
      totalArtifactsDetected: 3,
      scanTimeMs: 1500,
      errors: [],
    });

    render(<MultiRepoDashboard />);
    fireEvent.click(screen.getByRole('button', { name: /Scan Repositories/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /View Artifacts/i })).toBeInTheDocument();
    });
  }, 10000);

  it('loads and shows artifacts for a selected repository', async () => {
    vi.spyOn(api, 'triggerMultiScan').mockResolvedValue({
      sessionId: 'session-1',
      scans: [{ repositoryPath: '/repo', scanId: 'scan-1', status: 'completed', filesFound: 10, artifactsDetected: 3 }],
      totalFilesFound: 10,
      totalArtifactsDetected: 3,
      scanTimeMs: 1500,
      errors: [],
    });
    const byRepo = vi.spyOn(api, 'fetchArtifactsByRepository').mockResolvedValue({
      data: [makeArtifact({ id: 'art-1', fileName: 'req.yaml' })],
      total: 1,
      repositoryPath: '/repo',
    });

    render(<MultiRepoDashboard />);
    fireEvent.click(screen.getByRole('button', { name: /Scan Repositories/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /View Artifacts/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /View Artifacts/i }));

    await waitFor(() => {
      expect(byRepo).toHaveBeenCalledWith('/repo');
      expect(screen.getByText(/Artifacts:/i)).toBeInTheDocument();
      const yamls = screen.getAllByText(/req\.yaml/i);
      expect(yamls.length).toBeGreaterThanOrEqual(1);
    });
  }, 10000);

  it('shows error state when loading artifacts fails', async () => {
    vi.spyOn(api, 'triggerMultiScan').mockResolvedValue({
      sessionId: 'session-1',
      scans: [{ repositoryPath: '/repo', scanId: 'scan-1', status: 'completed', filesFound: 10, artifactsDetected: 3 }],
      totalFilesFound: 10,
      totalArtifactsDetected: 3,
      scanTimeMs: 1500,
      errors: [],
    });
    vi.spyOn(api, 'fetchArtifactsByRepository').mockRejectedValue(
      new Error('Failed to fetch'),
    );

    render(<MultiRepoDashboard />);
    fireEvent.click(screen.getByRole('button', { name: /Scan Repositories/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /View Artifacts/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /View Artifacts/i }));

    await waitFor(() => {
      expect(screen.getByText(/Failed to Load Artifacts/i)).toBeInTheDocument();
      expect(screen.getByText(/Failed to fetch/i)).toBeInTheDocument();
    });
  }, 10000);
});
