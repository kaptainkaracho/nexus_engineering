import { useState } from 'react';
import { Card, Badge, Stack, Button } from '@nexus-engineering/shared';

interface AdrHeader {
  number: string;
  title: string;
  status: 'Proposed' | 'Accepted' | 'Deprecated' | 'Superseded';
  date: string;
  deciders: string[];
  issue: string;
}

interface AdrAlternative {
  name: string;
  description: string;
  pros: string[];
  cons: string[];
  whyNotChosen: string;
}

interface AdrDocument {
  header: AdrHeader;
  context: string;
  decision: string;
  consequences: {
    positive: string[];
    negative: string[];
    neutral: string[];
  };
  alternatives: AdrAlternative[];
  related: string[];
  notes: string[];
}

const SAMPLE_ADRS: AdrDocument[] = [
  {
    header: {
      number: '001',
      title: 'Authentication Strategy',
      status: 'Accepted',
      date: '2026-07-18',
      deciders: ['CTO', 'SecurityEngineer', 'BackendArchitect'],
      issue: 'THE-191',
    },
    context:
      'Nexus needs to implement user authentication to secure the API and provide personalized experiences. The system must support email/password authentication for primary login, OAuth2 integration for social login (Google, GitHub), JWT-based session management, and role-based access control (RBAC). The current codebase uses Fastify for the backend and React for the frontend.',
    decision:
      'We will implement a layered authentication architecture with an Auth Service Layer (centralized authentication logic, support for multiple providers, JWT token generation and validation, session management), Auth Middleware (Fastify plugin for route protection, token validation, user context injection), and Auth Hooks (client-side session management, protected route components, authentication state). Passwords use bcrypt with 12 rounds, JWT uses RS256 with 15-minute access tokens and 7-day refresh tokens, OAuth2 uses Passport.js with strategy pattern, and Redis stores sessions with TTL matching token expiry.',
    consequences: {
      positive: [
        'Separation of concerns: Auth logic is isolated and testable',
        'Extensibility: New providers can be added without changing core logic',
        'Security: Centralized security policies and token management',
        'Developer experience: Clear API for route protection and user context',
      ],
      negative: [
        'Complexity: Additional service layer increases initial setup time',
        'Dependencies: Adds Passport.js and Redis as dependencies',
        'Learning curve: Team needs to understand the layered architecture',
      ],
      neutral: [
        'Existing code may need refactoring to use new middleware',
        'Requires comprehensive API documentation',
        'Needs integration tests for all auth flows',
      ],
    },
    alternatives: [
      {
        name: 'NextAuth.js',
        description: 'Built-in support for multiple providers, handles JWT and session management.',
        pros: ['Good TypeScript support', 'Handles JWT and session management'],
        cons: ['Tightly coupled to Next.js', 'Limited customization', 'Adds significant bundle size'],
        whyNotChosen: 'Framework mismatch and limited customization options.',
      },
      {
        name: 'Firebase Authentication',
        description: 'Managed service reduces operational overhead.',
        pros: ['Built-in OAuth2 providers', 'Good security features'],
        cons: ['Vendor lock-in', 'Limited control over token structure', 'Cost at scale'],
        whyNotChosen: 'Preference for self-hosted solution and full control.',
      },
      {
        name: 'Custom Implementation',
        description: 'Full control over implementation, no external dependencies.',
        pros: ['Full control', 'No external dependencies', 'Tailored to exact requirements'],
        cons: ['High security risk', 'Significant overhead', 'Must stay updated on security best practices'],
        whyNotChosen: 'Security risk and maintenance burden too high.',
      },
    ],
    related: ['ADR-002: RBAC Data Model (pending)', 'ADR-003: Session Management Strategy (pending)'],
    notes: [
      'This ADR should be reviewed by SecurityEngineer before implementation',
      'JWT validation should be cached to reduce database hits',
      'Auth failures should be logged and monitored for suspicious activity',
    ],
  },
  {
    header: {
      number: '002',
      title: 'RBAC Data Model',
      status: 'Proposed',
      date: '2026-07-18',
      deciders: ['CTO', 'BackendArchitect'],
      issue: 'THE-191',
    },
    context:
      'With authentication in place, we need a role-based access control system to manage permissions across the platform. The system must support hierarchical roles, granular permissions at resource-action level, and efficient authorization checks in both API middleware and frontend components.',
    decision:
      'We will implement an RBAC model with three core entities: Roles (admin, engineer, viewer), Permissions (resource-action pairs like "requirement:create", "architecture:read"), and Role-Permission assignments. Authorization will be enforced at the API layer via Fastify middleware that checks the user\'s role permissions against the required scope, and at the frontend via conditional rendering of UI elements based on the user\'s permission set.',
    consequences: {
      positive: [
        'Granular control over what each role can access',
        'Consistent enforcement across API and UI layers',
        'Audit trail via role-permission assignments',
      ],
      negative: [
        'More complex permission model to manage',
        'Additional database queries for authorization checks',
        'UI state management for permission-based rendering',
      ],
      neutral: [
        'Existing routes need permission metadata',
        'New UI pattern for permission-gated components',
      ],
    },
    alternatives: [
      {
        name: 'CASL.js',
        description: 'Dedicated authorization library with frontend integration.',
        pros: ['Well-documented', 'Frontend integration', 'Flexible rule engine'],
        cons: ['Additional dependency', 'Learning curve', 'Opinionated API'],
        whyNotChosen: 'Simpler custom model sufficient for current needs.',
      },
    ],
    related: ['ADR-001: Authentication Strategy'],
    notes: [
      'Permission changes should be logged for audit purposes',
      'Consider caching permission sets in JWT claims for performance',
    ],
  },
];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Proposed: 'proposed',
    Accepted: 'approved',
    Deprecated: 'rejected',
    Superseded: 'conflictsWith',
  };
  return <Badge variant={map[status] || 'info'}>{status}</Badge>;
}

function AdrHeaderCard({ header }: { header: AdrHeader }) {
  return (
    <div className="rounded-lg border border-border bg-surface-primary p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="rounded bg-primary-50 px-2 py-0.5 text-xs font-mono font-bold text-primary-700 dark:bg-primary-950 dark:text-primary-300">
            ADR-{header.number}
          </span>
          <StatusBadge status={header.status} />
        </div>
        <span className="text-xs text-text-tertiary">{header.date}</span>
      </div>
      <h3 className="mt-2 text-base font-semibold text-text-primary">{header.title}</h3>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-tertiary">
        <span>
          <span className="font-medium text-text-secondary">Deciders:</span>{' '}
          {header.deciders.join(', ')}
        </span>
        <span>
          <span className="font-medium text-text-secondary">Issue:</span>{' '}
          <span className="font-mono text-primary-600">{header.issue}</span>
        </span>
      </div>
    </div>
  );
}

function SectionBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-tertiary">
        {title}
      </h4>
      {children}
    </div>
  );
}

function ConsequenceList({ items, type }: { items: string[]; type: 'positive' | 'negative' | 'neutral' }) {
  const iconMap = {
    positive: (
      <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-success-100 text-center text-[10px] font-bold text-success-700 dark:bg-success-950 dark:text-success-300">
        +
      </span>
    ),
    negative: (
      <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-error-100 text-center text-[10px] font-bold text-error-700 dark:bg-error-950 dark:text-error-300">
        −
      </span>
    ),
    neutral: (
      <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-neutral-100 text-center text-[10px] font-bold text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
        ~
      </span>
    ),
  };

  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2 text-sm text-text-secondary">
          {iconMap[type]}
          {item}
        </li>
      ))}
    </ul>
  );
}

function AlternativeCard({ alt }: { alt: AdrAlternative }) {
  return (
    <Card variant="outlined" padding="sm" className="!p-3">
      <Stack gap={2}>
        <h5 className="text-sm font-semibold text-text-primary">{alt.name}</h5>
        <p className="text-xs text-text-secondary">{alt.description}</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wide text-success-600 dark:text-success-400">
              Pros
            </p>
            <ul className="space-y-0.5">
              {alt.pros.map((p, i) => (
                <li key={i} className="flex gap-1 text-xs text-text-secondary">
                  <span className="text-success-500">+</span> {p}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wide text-error-600 dark:text-error-400">
              Cons
            </p>
            <ul className="space-y-0.5">
              {alt.cons.map((c, i) => (
                <li key={i} className="flex gap-1 text-xs text-text-secondary">
                  <span className="text-error-500">−</span> {c}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="text-[11px] italic text-text-tertiary">
          Why not chosen: {alt.whyNotChosen}
        </p>
      </Stack>
    </Card>
  );
}

function AdrDetailCard({
  adr,
  expanded,
  onToggle,
}: {
  adr: AdrDocument;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <Card variant="outlined" padding="none">
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-xl"
      >
        <div className="p-4">
          <AdrHeaderCard header={adr.header} />
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border px-4 pb-4 pt-3">
          <Stack gap={5}>
            <SectionBlock title="Context">
              <p className="text-sm leading-relaxed text-text-secondary">{adr.context}</p>
            </SectionBlock>

            <SectionBlock title="Decision">
              <div className="rounded-lg border border-border bg-surface-secondary p-3">
                <p className="text-sm leading-relaxed text-text-primary">{adr.decision}</p>
              </div>
            </SectionBlock>

            <SectionBlock title="Consequences">
              <Stack gap={3}>
                {adr.consequences.positive.length > 0 && (
                  <ConsequenceList items={adr.consequences.positive} type="positive" />
                )}
                {adr.consequences.negative.length > 0 && (
                  <ConsequenceList items={adr.consequences.negative} type="negative" />
                )}
                {adr.consequences.neutral.length > 0 && (
                  <ConsequenceList items={adr.consequences.neutral} type="neutral" />
                )}
              </Stack>
            </SectionBlock>

            {adr.alternatives.length > 0 && (
              <SectionBlock title="Alternatives Considered">
                <Stack gap={2}>
                  {adr.alternatives.map((alt, i) => (
                    <AlternativeCard key={i} alt={alt} />
                  ))}
                </Stack>
              </SectionBlock>
            )}

            {adr.related.length > 0 && (
              <SectionBlock title="Related Decisions">
                <div className="flex flex-wrap gap-1.5">
                  {adr.related.map((r, i) => (
                    <span
                      key={i}
                      className="rounded-md bg-surface-tertiary px-2 py-0.5 text-xs font-mono font-medium text-text-secondary"
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </SectionBlock>
            )}

            {adr.notes.length > 0 && (
              <SectionBlock title="Notes">
                <ul className="space-y-1">
                  {adr.notes.map((note, i) => (
                    <li key={i} className="flex gap-2 text-sm text-text-secondary">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-text-tertiary" />
                      {note}
                    </li>
                  ))}
                </ul>
              </SectionBlock>
            )}
          </Stack>
        </div>
      )}
    </Card>
  );
}

function TemplatePreview() {
  return (
    <Card variant="elevated" padding="md" className="border-l-4 border-l-secondary-500">
      <Stack gap={4}>
        <div className="flex items-center gap-2">
          <span className="rounded bg-secondary-100 px-2 py-0.5 text-xs font-semibold text-secondary-700 dark:bg-secondary-900 dark:text-secondary-300">
            Template
          </span>
          <span className="text-xs text-text-tertiary">
            Copy to <code className="rounded bg-surface-tertiary px-1.5 py-0.5 font-mono text-xs">docs/architecture/adr/adr-{'{NUMBER}'}-{'{slug}'}.md</code>
          </span>
        </div>
        <div className="overflow-x-auto rounded-lg border border-border bg-surface-secondary">
          <pre className="p-4 text-xs leading-relaxed text-text-secondary"><code>{`# ADR-{NUMBER}: {TITLE}

**Status:** {Proposed | Accepted | Deprecated | Superseded}
**Date:** {YYYY-MM-DD}
**Deciders:** {List of people involved}
**Issue:** THE-{NUMBER}

---

## Context

{What is the issue motivating this decision?}

## Decision

{What is the change we are proposing or doing?}

## Consequences

### Positive
- {What becomes easier or more supported?}

### Negative
- {What becomes harder or less supported?}

### Neutral
- {Implications that are neither positive nor negative}

## Alternatives Considered

### Option 1: {Name}
{Description}
**Pros:** ...
**Cons:** ...
**Why not chosen:** {Explanation}

## Related Decisions
- ADR-{NUMBER}: {Title}

## Notes
{Additional notes or references}`}</code></pre>
        </div>
      </Stack>
    </Card>
  );
}

export function AacTemplate() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showTemplate, setShowTemplate] = useState(false);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const statusOrder: Record<string, number> = {
    Accepted: 0,
    Proposed: 1,
    Deprecated: 2,
    Superseded: 3,
  };

  const sorted = [...SAMPLE_ADRS].sort(
    (a, b) => (statusOrder[a.header.status] ?? 99) - (statusOrder[b.header.status] ?? 99),
  );

  return (
    <Stack gap={6}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Architecture as Code (AAC)</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Architecture Decision Records (ADRs) as Markdown documents with structured frontmatter,
            context, decision rationale, consequences, and alternatives considered. Linked to issues
            for full traceability.
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

      {showTemplate && <TemplatePreview />}

      {sorted.length === 0 ? (
        <Card variant="outlined" padding="lg">
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary-50 dark:bg-secondary-950">
              <svg className="h-6 w-6 text-secondary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-primary">No ADRs yet</h3>
              <p className="mt-1 text-sm text-text-tertiary">
                Copy the template to record your first architectural decision.
              </p>
            </div>
            <Button variant="secondary" size="sm">
              Create from Template
            </Button>
          </div>
        </Card>
      ) : (
        <Stack gap={3}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-text-tertiary">
              Architecture Decision Records
            </p>
            <span className="text-xs text-text-tertiary">
              {sorted.length} ADR{sorted.length !== 1 ? 's' : ''}
            </span>
          </div>
          {sorted.map((adr) => (
            <AdrDetailCard
              key={adr.header.number}
              adr={adr}
              expanded={expandedId === adr.header.number}
              onToggle={() => toggleExpand(adr.header.number)}
            />
          ))}
        </Stack>
      )}
    </Stack>
  );
}
