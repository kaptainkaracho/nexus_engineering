import { useState } from 'react';
import { Card, Badge, Stack, Button } from '@nexus-engineering/shared';

interface RacMetadata {
  domain: string;
  version: string;
  source: string;
  author?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface RacRequirement {
  id: string;
  type: 'functional' | 'non-functional' | 'system' | 'user';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'proposed' | 'approved' | 'rejected' | 'implemented' | 'verified';
  tags?: string[];
  acceptanceCriteria?: string[];
  dependencies?: string[];
  relatedIssues?: string[];
  notes?: string;
}

interface RacDocument {
  schema: string;
  metadata: RacMetadata;
  requirements: RacRequirement[];
}

const SAMPLE_RAC: RacDocument = {
  schema: 'req-doc/v1',
  metadata: {
    domain: 'Authentication',
    version: '1.0.0',
    source: 'docs/requirements/auth/authentication.req.yaml',
    author: 'UXDesigner',
    createdAt: '2026-07-18',
    updatedAt: '2026-07-18',
  },
  requirements: [
    {
      id: 'REQ-AUTH-001',
      type: 'functional',
      title: 'User Login with Email',
      description:
        'The system MUST allow a user to log in using their email address and password. The email must be case-insensitive. Password validation must follow security best practices.',
      priority: 'high',
      status: 'approved',
      tags: ['auth', 'security', 'user'],
      acceptanceCriteria: [
        'Given a registered user, when they enter valid email and password, then they are authenticated',
        'Given a user, when they enter invalid credentials, then they see an error message',
      ],
      dependencies: ['REQ-SEC-001'],
      relatedIssues: ['THE-191'],
      notes: 'Password requirements are defined in REQ-SEC-001.',
    },
    {
      id: 'REQ-AUTH-002',
      type: 'non-functional',
      title: 'Session Timeout',
      description:
        'Sessions MUST expire after 30 minutes of inactivity. Users should be prompted before session expiry.',
      priority: 'medium',
      status: 'proposed',
      tags: ['auth', 'security', 'performance'],
      acceptanceCriteria: [
        'Given an active user, when they are inactive for 25 minutes, then they see a warning',
        'Given an inactive user, when 30 minutes pass, then their session is terminated',
      ],
      dependencies: ['REQ-AUTH-001'],
      relatedIssues: [],
      notes: 'Cleanup job will run every 5 minutes.',
    },
  ],
};

const BLANK_RAC_TEMPLATE: RacDocument = {
  schema: 'req-doc/v1',
  metadata: {
    domain: '',
    version: '1.0.0',
    source: '',
    author: '',
    createdAt: '',
    updatedAt: '',
  },
  requirements: [
    {
      id: 'REQ-{DOMAIN}-{NUMBER}',
      type: 'functional',
      title: '',
      description: '',
      priority: 'medium',
      status: 'proposed',
      tags: [],
      acceptanceCriteria: [],
      dependencies: [],
      relatedIssues: [],
      notes: '',
    },
  ],
};

const TYPE_BADGE: Record<string, string> = {
  functional: 'info',
  'non-functional': 'tracesTo',
  system: 'block',
  user: 'port',
};

const PRIORITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function TypeBadge({ type }: { type: string }) {
  return (
    <Badge variant={TYPE_BADGE[type] || 'info'}>
      {type.replace('-', ' ')}
    </Badge>
  );
}

function RacRequirementCard({
  req,
  expanded,
  onToggle,
}: {
  req: RacRequirement;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <Card variant="outlined" padding="sm" className="!p-0">
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-xl"
      >
        <div className="flex items-start justify-between gap-4 p-4">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="shrink-0 rounded bg-primary-50 px-1.5 py-0.5 text-xs font-mono font-medium text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                {req.id}
              </span>
              <TypeBadge type={req.type} />
              <Badge variant={req.priority}>{req.priority}</Badge>
              <Badge variant={req.status}>{req.status}</Badge>
            </div>
            <h3 className="text-base font-semibold text-text-primary">{req.title}</h3>
            <p className="text-sm text-text-secondary line-clamp-2">{req.description}</p>
          </div>
          <svg
            className={`mt-1 h-4 w-4 shrink-0 text-text-tertiary transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border px-4 pb-4 pt-3">
          <Stack gap={4}>
            {req.tags && req.tags.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-text-tertiary">
                  Tags
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {req.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md bg-surface-tertiary px-2 py-0.5 text-xs font-medium text-text-secondary"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {req.acceptanceCriteria && req.acceptanceCriteria.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-text-tertiary">
                  Acceptance Criteria
                </p>
                <ul className="space-y-1">
                  {req.acceptanceCriteria.map((ac, i) => (
                    <li key={i} className="flex gap-2 text-sm text-text-secondary">
                      <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-success-100 text-center text-[10px] font-bold text-success-700 dark:bg-success-950 dark:text-success-300">
                        ✓
                      </span>
                      {ac}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {req.dependencies && req.dependencies.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-text-tertiary">
                  Dependencies
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {req.dependencies.map((dep) => (
                    <span
                      key={dep}
                      className="rounded-md bg-warning-50 px-2 py-0.5 text-xs font-mono font-medium text-warning-700 dark:bg-warning-950 dark:text-warning-300"
                    >
                      {dep}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {req.relatedIssues && req.relatedIssues.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-text-tertiary">
                  Related Issues
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {req.relatedIssues.map((issue) => (
                    <span
                      key={issue}
                      className="rounded-md bg-info-50 px-2 py-0.5 text-xs font-mono font-medium text-info-700 dark:bg-info-950 dark:text-info-300"
                    >
                      {issue}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {req.notes && (
              <div>
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-text-tertiary">
                  Notes
                </p>
                <p className="text-sm text-text-secondary italic">{req.notes}</p>
              </div>
            )}
          </Stack>
        </div>
      )}
    </Card>
  );
}

function MetadataBar({ metadata }: { metadata: RacMetadata }) {
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-2 rounded-lg bg-surface-tertiary px-4 py-3 text-xs text-text-tertiary">
      <span>
        <span className="font-medium text-text-secondary">Domain:</span> {metadata.domain}
      </span>
      <span>
        <span className="font-medium text-text-secondary">Schema:</span> req-doc/v1
      </span>
      <span>
        <span className="font-medium text-text-secondary">Version:</span> {metadata.version}
      </span>
      {metadata.author && (
        <span>
          <span className="font-medium text-text-secondary">Author:</span> {metadata.author}
        </span>
      )}
      {metadata.source && (
        <span className="hidden sm:inline">
          <span className="font-medium text-text-secondary">Source:</span> {metadata.source}
        </span>
      )}
      {metadata.createdAt && (
        <span>
          <span className="font-medium text-text-secondary">Created:</span> {metadata.createdAt}
        </span>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <Card variant="outlined" padding="lg">
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-950">
          <svg className="h-6 w-6 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-text-primary">No requirements yet</h3>
          <p className="mt-1 text-sm text-text-tertiary">
            Copy the template to start documenting your requirements.
          </p>
        </div>
        <Button variant="secondary" size="sm">
          Create from Template
        </Button>
      </div>
    </Card>
  );
}

export function RacTemplate() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showTemplate, setShowTemplate] = useState(false);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const sorted = [...SAMPLE_RAC.requirements].sort(
    (a, b) => (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99),
  );

  return (
    <Stack gap={6}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Requirements as Code (RAC)</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Structured YAML requirement documents with the <code className="rounded bg-surface-tertiary px-1.5 py-0.5 text-xs font-mono text-text-secondary">nexus</code> schema.
            Each document contains metadata and a list of requirements with traceable IDs.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          }
          onClick={() => setShowTemplate(!showTemplate)}
        >
          {showTemplate ? 'Hide Template' : 'New from Template'}
        </Button>
      </div>

      {showTemplate && (
        <Card variant="elevated" padding="md" className="border-l-4 border-l-primary-500">
          <Stack gap={4}>
            <div className="flex items-center gap-2">
              <span className="rounded bg-primary-100 px-2 py-0.5 text-xs font-semibold text-primary-700 dark:bg-primary-900 dark:text-primary-300">
                Template
              </span>
              <span className="text-xs text-text-tertiary">Copy to <code className="rounded bg-surface-tertiary px-1.5 py-0.5 font-mono text-xs">docs/requirements/&lt;domain&gt;/</code></span>
            </div>
            <div className="overflow-x-auto rounded-lg border border-border bg-surface-secondary">
              <pre className="p-4 text-xs leading-relaxed text-text-secondary"><code>{`# =============================================================================
# RAC Requirement Template
# =============================================================================
# Copy this template to your domain directory and fill in the values.
# =============================================================================

nexus:
  schema: req-doc/v1
  metadata:
    domain: <your-domain>
    version: 1.0.0
    source: <relative-path>
    author: <your-name>
    createdAt: {date}
    updatedAt: {date}

requirements:
  - id: REQ-{DOMAIN}-{NUMBER}
    type: functional  # functional | non-functional | system | user
    title: <short descriptive title>
    description: <detailed description in Markdown>
    priority: medium  # low | medium | high | critical
    status: proposed  # proposed | approved | rejected | implemented | verified
    tags:
      - <keyword>
    acceptanceCriteria:
      - "Given <context>, when <action>, then <result>"
    dependencies:
      - REQ-{DOMAIN}-{NUMBER}
    relatedIssues:
      - THE-{NUMBER}
    notes: <additional context>`}</code></pre>
            </div>
          </Stack>
        </Card>
      )}

      <div>
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-text-tertiary">
            Document Metadata
          </p>
          <span className="text-xs text-text-tertiary">
            {SAMPLE_RAC.requirements.length} requirement{SAMPLE_RAC.requirements.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="mt-2">
          <MetadataBar metadata={SAMPLE_RAC.metadata} />
        </div>
      </div>

      {sorted.length === 0 ? (
        <EmptyState />
      ) : (
        <Stack gap={3}>
          {sorted.map((req) => (
            <RacRequirementCard
              key={req.id}
              req={req}
              expanded={expandedId === req.id}
              onToggle={() => toggleExpand(req.id)}
            />
          ))}
        </Stack>
      )}
    </Stack>
  );
}
