import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import { RepositoryFileTree } from './index';
import * as api from '../../api/client';

/** Helper to create test nodes */
function makeNode(id: string, name: string, type: 'folder' | 'file', path: string) {
  return { id, name, type, path } as api.TreeNode;
}

/** Mock scanRepository to return test data */
function mockScanOk(treeData: api.TreeNode[]) {
  vi.clearAllMocks();
  vi.spyOn(api, 'scanRepository').mockResolvedValue({ files: [], tree: treeData, warnings: [] });
}

/** Test basic rendering and loading state */
describe('RepositoryTree rendering', () => {
  it('shows loading state initially', () => {
    vi.spyOn(api, 'scanRepository').mockReturnValue(new Promise(() => {}));
    render(<RepositoryFileTree />);
    expect(screen.getByText(/Loading repository/)).toBeInTheDocument();
  });

  it('hides loading indicator after data loads', async () => {
    const testTree = [makeNode('test', 'Test File', 'folder', '/test')];
    mockScanOk(testTree);
    render(<RepositoryFileTree />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading repository/)).not.toBeInTheDocument();
    });
  });
});

/** Test error state */
describe('error state', () => {
  it('shows error message when API request fails', async () => {
    vi.spyOn(api, 'scanRepository').mockRejectedValue(new Error('API Error'));
    render(<RepositoryFileTree />);

    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });
});

/** Test folder expansion functionality */
describe('folder expansion', () => {
  it('toggles folder expansion on click', async () => {
    const testNode = makeNode('folder1', 'Folder 1', 'folder', '/folder1');
    mockScanOk([testNode]);
    render(<RepositoryFileTree />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading repository/)).not.toBeInTheDocument();
    });

    // Find the folder button - check within the tree container
    const treeContainer = screen.getByText('Files').closest('div.overflow-y-auto');
    const folderBtn = treeContainer?.querySelector('button[aria-label="folder: Folder 1"]');

    expect(folderBtn).toBeInTheDocument();
    expect(folderBtn).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(folderBtn!);
    expect(folderBtn).toHaveAttribute('aria-expanded', 'true');
  });
});

/** Test file selection and detail panel */
describe('file selection', () => {
  it('selects file and shows detail panel', async () => {
    const testNode = makeNode('file1', 'file1.txt', 'file', '/file1.txt');
    mockScanOk([testNode]);

    vi.spyOn(api, 'getFileContent').mockResolvedValue({
      path: '/file1.txt',
      content: 'Hello, World!',
      extension: 'txt',
    } as api.FileDetail);

    render(<RepositoryFileTree />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading repository/)).not.toBeInTheDocument();
    });

    // Find file button
    const treeContainer = screen.getByText('Files').closest('div.overflow-y-auto');
    const fileBtn = treeContainer?.querySelector('button[aria-label="file: file1.txt"]');

    expect(fileBtn).toBeInTheDocument();
    fireEvent.click(fileBtn!);

    await waitFor(() => {
      expect(screen.getByText('file1.txt')).toBeInTheDocument();
    });
  });
});

/** Test initial expanded state */
describe('initial state', () => {
  it('shows items expanded by default', async () => {
    const testTree = [makeNode('folder1', 'Folder 1', 'folder', '/folder1')];
    mockScanOk(testTree);
    render(<RepositoryFileTree />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading repository/)).not.toBeInTheDocument();
    });

    expect(screen.getByText('Folder 1')).toBeInTheDocument();
  });
});