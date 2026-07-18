import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { DiscoveryDashboard } from './index';
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

function registryResponse(artifacts: DiscoveryArtifact[]) {
  const byType = { requirement: 0, architecture: 0, adr: 0, spec: 0, unknown: 0 };
  const byLifecycle = { discovered: 0, parsed: 0, indexed: 0, related: 0, error: 0 };
  for (const a of artifacts) {
    byType[a.type] += 1;
    byLifecycle[a.lifecycle] += 1;
  }
  return {
    data: artifacts,
    summary: { total: artifacts.length, byType, byLifecycle },
  };
}

describe('DiscoveryDashboard', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('shows loading state initially', () => {
    vi.spyOn(api, 'fetchRegistry').mockReturnValue(new Promise(() => {}));
    render(<DiscoveryDashboard />);
    expect(screen.getByText(/Loading artifacts/i)).toBeInTheDocument();
  });

  it('renders overview and artifact list after load', async () => {
    const a = makeArtifact();
    vi.spyOn(api, 'fetchRegistry').mockResolvedValue(registryResponse([a]));
    render(<DiscoveryDashboard />);

    await waitFor(() => expect(screen.queryByText(/Loading artifacts/i)).not.toBeInTheDocument());
    expect(screen.getByText('Total Artifacts')).toBeInTheDocument();
    const totalCard = screen.getByText('Total Artifacts').parentElement as HTMLElement;
    expect(within(totalCard).getByText('1')).toBeInTheDocument(); // total stat
    expect(screen.getByRole('option', { name: /req\.yaml/i })).toBeInTheDocument();
  });

  it('shows empty state when no artifacts are discovered', async () => {
    vi.spyOn(api, 'fetchRegistry').mockResolvedValue(registryResponse([]));
    render(<DiscoveryDashboard />);

    await waitFor(() => expect(screen.getByText(/No artifacts found/i)).toBeInTheDocument());
    expect(screen.getByText(/Run a scan from the Scan Overview/i)).toBeInTheDocument();
  });

  it('shows error state with retry when registry fails', async () => {
    vi.spyOn(api, 'fetchRegistry').mockRejectedValue(new Error('HTTP 500: boom'));
    render(<DiscoveryDashboard />);

    await waitFor(() => expect(screen.getByText(/Error loading artifact registry/i)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('filters the list by artifact type', async () => {
    const req = makeArtifact({ id: 'a1', type: 'requirement', fileName: 'req.yaml' });
    const adr = makeArtifact({
      id: 'a2',
      type: 'adr',
      fileName: 'ADR-1.md',
      relativePath: 'ADR-1.md',
      filePath: '/repo/ADR-1.md',
    });
    vi.spyOn(api, 'fetchRegistry').mockResolvedValue(registryResponse([req, adr]));
    render(<DiscoveryDashboard />);

    await waitFor(() => expect(screen.queryByText(/Loading artifacts/i)).not.toBeInTheDocument());

    const adrChip = screen.getByRole('button', { name: 'ADRs' });
    fireEvent.click(adrChip);

    expect(screen.queryByRole('option', { name: /req\.yaml/i })).not.toBeInTheDocument();
    expect(screen.getByRole('option', { name: /ADR-1\.md/i })).toBeInTheDocument();
  });

  it('filters the list by free-text search', async () => {
    const req = makeArtifact({ id: 'a1', fileName: 'req.yaml' });
    const adr = makeArtifact({
      id: 'a2',
      type: 'adr',
      fileName: 'ADR-1.md',
      relativePath: 'ADR-1.md',
      filePath: '/repo/ADR-1.md',
    });
    vi.spyOn(api, 'fetchRegistry').mockResolvedValue(registryResponse([req, adr]));
    render(<DiscoveryDashboard />);

    await waitFor(() => expect(screen.queryByText(/Loading artifacts/i)).not.toBeInTheDocument());

    const search = screen.getByLabelText(/Search artifacts by name or path/i);
    fireEvent.change(search, { target: { value: 'ADR' } });

    expect(screen.queryByRole('option', { name: /req\.yaml/i })).not.toBeInTheDocument();
    expect(screen.getByRole('option', { name: /ADR-1\.md/i })).toBeInTheDocument();
  });

  it('opens the detail panel when an artifact row is clicked', async () => {
    const a = makeArtifact({ fileName: 'req.yaml', lifecycle: 'parsed', metadata: { source: 'scan' } });
    vi.spyOn(api, 'fetchRegistry').mockResolvedValue(registryResponse([a]));
    render(<DiscoveryDashboard />);

    await waitFor(() => expect(screen.queryByText(/Loading artifacts/i)).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole('option', { name: /req\.yaml/i }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getAllByText('req.yaml').length).toBeGreaterThan(0);
    expect(within(dialog).getAllByText('Parsed').length).toBeGreaterThan(0);
    expect(within(dialog).getByText('source:')).toBeInTheDocument();
  });

  it('closes the detail panel on Escape', async () => {
    const a = makeArtifact();
    vi.spyOn(api, 'fetchRegistry').mockResolvedValue(registryResponse([a]));
    render(<DiscoveryDashboard />);

    await waitFor(() => expect(screen.queryByText(/Loading artifacts/i)).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole('option', { name: /req\.yaml/i }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('runs a scan and refreshes the registry on completion', async () => {
    vi.spyOn(api, 'fetchRegistry')
      .mockResolvedValueOnce(registryResponse([]))
      .mockResolvedValueOnce(registryResponse([makeArtifact({ fileName: 'new.yaml' })]));
    const trigger = vi.spyOn(api, 'triggerScan').mockResolvedValue({
      scanId: 'scan-1',
      status: 'completed',
      filesFound: 12,
      artifactsDetected: 1,
    });

    render(<DiscoveryDashboard />);
    await waitFor(() => expect(screen.queryByText(/Loading artifacts/i)).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Run/i }));

    await waitFor(() => expect(trigger).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(screen.getByText(/Scan complete\. Artifact registry refreshed\./i)).toBeInTheDocument(),
    );
    expect(screen.getByText('12')).toBeInTheDocument(); // files scanned stat
  });

  it('requests a reparse from the detail panel', async () => {
    const a = makeArtifact({ fileName: 'req.yaml' });
    vi.spyOn(api, 'fetchRegistry').mockResolvedValue(registryResponse([a]));
    const reparse = vi
      .spyOn(api, 'reparseArtifact')
      .mockResolvedValue({ ...a, lifecycle: 'discovered', reparseCount: 1 });

    render(<DiscoveryDashboard />);
    await waitFor(() => expect(screen.queryByText(/Loading artifacts/i)).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole('option', { name: /req\.yaml/i }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: /Reparse artifact/i }));

    await waitFor(() => expect(reparse).toHaveBeenCalledWith('art-1'));
  });
});
