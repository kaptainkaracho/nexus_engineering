import { useState, useCallback, useEffect } from 'react';
import { Card, Badge, cn } from '@nexus-engineering/shared';
import { scanRepository, getFileContent, ScanResult, TreeNode } from '../../api/client';

/** Tree nodes for repository explorer */
interface RepoNode extends TreeNode {}

interface FileDetail {
  node: RepoNode;
  content: string;
  extension: string;
}

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
  initialExpandedIds?: Set<string>;
}

export function RepositoryFileTree({ initialExpandedIds }: RepositoryFileTreeProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => initialExpandedIds ?? new Set<string>(['root', 'apps']),
  );
  const [selectedFile, setSelectedFile] = useState<FileDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [treeData, setTreeData] = useState<TreeNode[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    scanRepository('.')
      .then((result: ScanResult) => {
        if (!cancelled && result.tree.length > 0) {
          setTreeData(result.tree);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const handleToggle = useCallback((id: string) => {
    setExpandedIds((prev) => prev.has(id) ? new Set([...prev].filter((x) => x !== id)) : new Set([...prev, id]));
  }, []);

  const handleSelect = useCallback(async (node: RepoNode) => {
    setSelectedId(node.id);
    if (node.type === 'file') {
      setLoading(true);
      try {
        const fileDetail = await getFileContent(node.path);
        setSelectedFile({ node, ...fileDetail });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load file');
      } finally {
        setLoading(false);
      }
    } else {
      setSelectedFile(null);
    }
  }, []);

  const flatTree: RepoNode = { id: 'root', name: '.', type: 'folder', path: '/', children: treeData };
  const rootChildrenCount = flatTree.children?.length ?? 0;

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
        {loading && <div className="p-4 text-center text-sm text-text-tertiary">Loading repository...</div>}
        {error && (
          <div className="p-4 text-center text-sm text-red-600">
            Error: {error}
            <button type="button" onClick={() => window.location.reload()} className="ml-2 underline">Retry</button>
          </div>
        )}
        {!loading && !error && treeData.length === 0 && (
          <div className="p-4 text-center text-sm text-text-tertiary">No repository data. Ensure the backend /scan endpoint is reachable.</div>
        )}
        {flatTree.children?.map((child) => (
          <TreeRow key={child.id} node={child} depth={0} expandedIds={expandedIds} selectedId={selectedFile?.node.id ?? null} onToggle={handleToggle} onSelect={handleSelect} />
        ))}
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
              {selectedFile.node.fileSize != null && <span>Size: {selectedFile.node.fileSize} bytes</span>}
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
