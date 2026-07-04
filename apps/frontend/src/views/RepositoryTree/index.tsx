import { useState, useCallback } from 'react';
import { Card, Badge, cn } from '@nexus-engineering/shared';

/** Tree nodes for repository explorer */
interface RepoNode {
  id: string;
  name: string;
  type: 'folder' | 'file';
  path: string;
  language?: string;
  fileSize?: string;
  lastModified?: string;
  children?: RepoNode[];
}

interface FileDetail {
  node: RepoNode;
  content: string;
  extension: string;
}

export const REPO_TREE: RepoNode = {
  id: 'root',
  name: '.',
  type: 'folder',
  path: '/',
  children: [
    {
      id: 'apps',
      name: 'apps/',
      type: 'folder',
      path: '/apps/',
      language: 'directory',
      children: [
        {
          id: 'backend-app',
          name: 'backend/',
          type: 'folder',
          path: '/apps/backend/',
          language: 'directory',
          children: [
            { id: 'scan-ts', name: 'scan.ts', type: 'file', path: '/apps/backend/scan.ts', language: 'TypeScript', fileSize: '2.4 KB', lastModified: 'Jun 15, 2026' },
            { id: 'server-ts', name: 'server.ts', type: 'file', path: '/apps/backend/server.ts', language: 'TypeScript', fileSize: '1.8 KB', lastModified: 'Jul 01, 2026' },
            {
              id: 'src-folder',
              name: 'src/',
              type: 'folder',
              path: '/apps/backend/src/',
              language: 'directory',
              children: [
                { id: 'app-ts', name: 'app.ts', type: 'file', path: '/apps/backend/src/app.ts', language: 'TypeScript', fileSize: '3.1 KB', lastModified: 'Jul 02, 2026' },
                {
                  id: 'routes-folder',
                  name: 'routes/',
                  type: 'folder',
                  path: '/apps/backend/src/routes/',
                  language: 'directory',
                  children: [
                    { id: 'req-route', name: 'requirements.ts', type: 'file', path: '/apps/backend/src/routes/requirements.ts', language: 'TypeScript', fileSize: '4.7 KB', lastModified: 'Jul 03, 2026' },
                    { id: 'repo-route', name: 'repository.ts', type: 'file', path: '/apps/backend/src/routes/repository.ts', language: 'TypeScript', fileSize: '3.2 KB', lastModified: 'Jul 02, 2026' },
                  ],
                },
                {
                  id: 'scanners-folder',
                  name: 'scanners/',
                  type: 'folder',
                  path: '/apps/backend/src/scanners/',
                  language: 'directory',
                  children: [
                    { id: 'repo-scanner', name: 'repositoryScanner.ts', type: 'file', path: '/apps/backend/src/scanners/repositoryScanner.ts', language: 'TypeScript', fileSize: '5.9 KB', lastModified: 'Jul 03, 2026' },
                  ],
                },
              ],
            },
          ],
        },
        {
          id: 'frontend-app',
          name: 'frontend/',
          type: 'folder',
          path: '/apps/frontend/',
          language: 'directory',
          children: [
            { id: 'vite-conf', name: 'vite.config.ts', type: 'file', path: '/apps/frontend/vite.config.ts', language: 'TypeScript', fileSize: '0.5 KB', lastModified: 'Jun 20, 2026' },
            { id: 'index-html', name: 'index.html', type: 'file', path: '/apps/frontend/index.html', language: 'HTML', fileSize: '1.2 KB', lastModified: 'May 10, 2026' },
            {
              id: 'src-folder-fe',
              name: 'src/',
              type: 'folder',
              path: '/apps/frontend/src/',
              language: 'directory',
              children: [
                { id: 'app-tsx', name: 'App.tsx', type: 'file', path: '/apps/frontend/src/App.tsx', language: 'TypeScript (React)', fileSize: '8.4 KB', lastModified: 'Jul 02, 2026' },
                { id: 'main-tsx', name: 'main.tsx', type: 'file', path: '/apps/frontend/src/main.tsx', language: 'TypeScript (React)', fileSize: '0.1 KB', lastModified: 'May 10, 2026' },
                {
                  id: 'views-folder',
                  name: 'views/',
                  type: 'folder',
                  path: '/apps/frontend/src/views/',
                  language: 'directory',
                  children: [
                    { id: 'artifact-viewer-index-tsx', name: 'ArtifactViewer/index.tsx', type: 'file', path: '/apps/frontend/src/views/ArtifactViewer/index.tsx', language: 'TypeScript (React)', fileSize: '19.7 KB', lastModified: 'Jul 03, 2026' },
                    { id: 'artifact-viewer-sample-ts', name: 'ArtifactViewer/sample-data.ts', type: 'file', path: '/apps/frontend/src/views/ArtifactViewer/sample-data.ts', language: 'TypeScript', fileSize: '4.2 KB', lastModified: 'Jul 01, 2026' },
                    { id: 'repo-tree-index-tsx', name: 'RepositoryTree/index.tsx', type: 'file', path: '/apps/frontend/src/views/RepositoryTree/index.tsx', language: 'TypeScript (React)', fileSize: '--', lastModified: '--' },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    { id: 'packages-folder', name: 'packages/', type: 'folder', path: '/packages/', language: 'directory' },
    { id: 'tsconfig', name: 'tsconfig.json', type: 'file', path: '/tsconfig.json', language: 'JSON', fileSize: '0.3 KB', lastModified: 'May 10, 2026' },
    {
      id: 'docs-folder',
      name: 'docs/',
      type: 'folder',
      path: '/docs/',
      language: 'directory',
      children: [
        { id: 'sprint-plan', name: 'SPRINT-4-PLAN.md', type: 'file', path: '/docs/SPRINT-4-PLAN.md', language: 'Markdown', fileSize: '3.8 KB', lastModified: 'Jul 04, 2026' },
        { id: 'cto-dispo', name: 'the-116-cto-disposition.md', type: 'file', path: '/docs/the-116-cto-disposition.md', language: 'Markdown', fileSize: '2.1 KB', lastModified: 'Jul 03, 2026' },
      ],
    },
  ],
};

const FILE_CONTENTS: Record<string, { content: string; extension: string }> = {
  'app-tsx': {
    extension: 'tsx',
    content: `import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Server } from './shared/server';
import { startBackendScanners } from './services/scannerRunner';

const config = Server.readConfig();

async function main() {
  const scanners = startBackendScanners(config.scanners);
  const server = new Server({ scanners });
  await server.listen(config.port);
}

main().catch(console.error);`,
  },
  'artifact-viewer-index-tsx': {
    extension: 'tsx',
    content: `import { useMemo, useState } from 'react';
import { Card, Badge } from '@nexus-engineering/shared';
import { fetchArtefacts } from '../../api/client';

type ArtefactTab = 'requirements' | 'architecture' | 'components' | 'testcases';

export function ArtifactViewer() {
  const [activeTab, setActiveTab] = useState<ArtefactTab>('requirements');
  return <Card padding="md">Artefact viewer — \${activeTab}</Card>;
}`,
  },
  'repo-scanner': {
    extension: 'ts',
    content: `import { RepositoryReader } from '@nexus-engineering/shared';

interface ScanResult {
  scanned: number;
  artifacts: Array<{ type: string; path: string }>;
}

export function scan(filePath: string): Promise<ScanResult> {
  return new Promise((resolve) => {
    const reader = new RepositoryReader();
    const result = reader.scan(path);
    resolve({ scanned: result.total, artifacts: result.entries });
  });
}`,
  },
  'requirements': {
    extension: 'ts',
    content: `import Fastify from 'fastify';

const router = Fastify();

/** POST /api/reqs */
router.post('/api/requirements', async (req, res) => {
  const body = req.body as ReqInput;
  await store.createRequirement(body);
  return { ok: true };
});

export default router;`,
  },
};

function getFileIcon(name: string): string {
  if (!name.includes('.')) return '📁';
  const ext = name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'tsx': case 'ts': return 'TSX';
    case 'js': case 'mjs': return 'JS';
    case 'json': return '{ }';
    case 'html': return '<>';
    case 'md': return 'MD';
    case 'css': return '#';
    case 'yml': case 'yaml': return 'Y';
    default: return ext?.toUpperCase().slice(0, 2) ?? '📄';
  }
}

interface TreeRowProps {
  node: RepoNode;
  depth: number;
  expandedIds: Set<string>;
  selectedId: string | null;
  onToggle: (id: string) => void;
  onSelect: (node: RepoNode) => void;
}

function TreeRow({ node, depth, expandedIds, selectedId, onToggle, onSelect }: TreeRowProps) {
  const isSelected = node.id === selectedId;
  const hasChildren = !!node.children?.length;
  const isExpanded = expandedIds.has(node.id);
  const indent = depth * 16 + 8;

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          if (node.type === 'folder') {
            onToggle(node.id);
          } else {
            onSelect(node);
          }
        }}
        className={cn(
          'flex w-full items-center gap-1.5 px-2 py-1 text-left text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
          isSelected ? '!bg-primary-50 dark:!bg-primary-950 !text-primary-700 dark:!text-primary-300' : 'hover:bg-surface-secondary/60 text-text-primary',
        )}
        style={{ paddingLeft: `${indent}px` }}
        aria-expanded={node.type === 'folder' ? isExpanded : undefined}
        aria-label={`${node.type}: ${node.name}`}
      >
        {node.type === 'folder' ? (
          <span className="shrink-0 text-xs" aria-hidden="true">{isExpanded ? '▼' : '▶'}</span>
        ) : (
          <span className="shrink-0 text-xs w-4 text-center text-text-tertiary" aria-hidden="true" />
        )}
        <span className={cn('shrink-0', node.type === 'file' ? 'text-base font-medium tracking-tight' : '')}>
          {node.type === 'folder' ? (isExpanded ? '📂' : '📁') : getFileIcon(node.name)}
        </span>
        <span className="truncate">{node.name}</span>
      </button>
      {hasChildren && isExpanded && (
        <>
          {node.children!.map((child) => (
            <TreeRow key={child.id} node={child} depth={depth + 1} expandedIds={expandedIds} selectedId={selectedId} onToggle={onToggle} onSelect={onSelect} />
          ))}
        </>
      )}
    </div>
  );
}

interface RepositoryFileTreeProps {
  tree: RepoNode;
  initialExpandedIds?: Set<string>;
}

export function RepositoryFileTree({ tree, initialExpandedIds }: RepositoryFileTreeProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => initialExpandedIds ?? new Set<string>(['root', 'apps']),
  );
  const [selectedFile, setSelectedFile] = useState<FileDetail | null>(null);

  const handleToggle = useCallback((id: string) => {
    setExpandedIds((prev) => prev.has(id) ? new Set([...prev].filter((x) => x !== id)) : new Set([...prev, id]));
  }, []);

  const handleSelect = useCallback((node: RepoNode) => {
    setSelectedId(node.id);
    if (FILE_CONTENTS[node.id]) {
      setSelectedFile({ node, ...FILE_CONTENTS[node.id] });
    } else {
      setSelectedFile(null);
    }
  }, []);

  const rootChildrenCount = tree.children?.length ?? 0;

  return (
    <div className="flex h-full flex-col gap-4">
      {/* File tree panel */}
      <div className={cn(
        'overflow-y-auto rounded-xl border border-border bg-surface-primary',
        selectedFile ? 'w-full' : '',
        'lg:w-[45%]',
      )}>
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">Files</h3>
          <span className="text-xs text-text-tertiary">{rootChildrenCount} root item{rootChildrenCount !== 1 ? 's' : ''}</span>
        </div>
        <TreeRow node={tree} depth={0} expandedIds={expandedIds} selectedId={selectedFile?.node.id ?? null} onToggle={handleToggle} onSelect={handleSelect} />
      </div>

      {/* File detail panel */}
      {selectedFile && (
        <Card variant="default" padding="md" className={cn('w-full', 'lg:w-[55%] lg:shrink-0')}>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-text-primary">{selectedFile.node.name}</span>
                {selectedFile.node.language && (
                  <Badge variant="info" className="!px-1.5 !py-0 !text-[10px]">{selectedFile.node.language}</Badge>
                )}
              </div>
              <button type="button" onClick={() => setSelectedFile(null)} className="shrink-0 text-xs text-text-tertiary hover:text-text-primary focus:outline-none" aria-label={`Dismiss ${selectedFile.node.name}`}>Dismiss</button>
            </div>

            {/* Metadata row */}
            <div className={cn('flex flex-wrap gap-x-4 gap-y-1 border-b border-border pb-2.5 pt-1 text-xs text-text-tertiary')}>
              {selectedFile.node.path && <span>Path: <span className="font-mono text-text-secondary">{selectedFile.node.path}</span></span>}
              {selectedFile.node.fileSize && <span>Size: {selectedFile.node.fileSize}</span>}
              {selectedFile.node.lastModified && <span>Modified: {selectedFile.node.lastModified}</span>}
            </div>

            {/* File content */}
            <pre className="overflow-x-auto rounded-lg bg-surface-secondary p-3 text-xs font-mono leading-relaxed text-text-secondary">
              <code>{selectedFile.content}</code>
            </pre>
          </div>
        </Card>
      )}
    </div>
  );
}
