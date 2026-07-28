import type { Requirement } from '@nexus-engineering/shared'

export interface SeedRequirement {
  id: string
  type: Requirement['type']
  title: string
  description: string
  priority: Requirement['priority']
  status: Requirement['status']
  tags: string[]
  traceLinks: Requirement['traceLinks']
}

export interface SeedADR {
  id: string
  title: string
  status: string
  context: string
  decision: string
  consequences: string[]
  traceLinks: Array<{ type: string; target: { id: string; documentId: string }; confidence: 'high' | 'medium' | 'low' }>
}

export interface SeedTraceGraph {
  nodes: Array<{ id: string; type: string; title?: string; name?: string }>
  edges: Array<{ id: string; source_id: string; target_id: string; relationship_type: string; confidence: 'high' | 'medium' | 'low'; description?: string }>
}

export interface DemoSeedData {
  requirements: SeedRequirement[]
  adrs: SeedADR[]
  traceGraph: SeedTraceGraph
}

const DEMO_REQUIREMENTS: SeedRequirement[] = [
  {
    id: 'DEMO-REQ-AUTH-001',
    type: 'functional',
    title: 'JWT Authentication',
    description: 'The system must issue JWT access tokens with 15-minute expiry for authenticated API requests.',
    priority: 'critical',
    status: 'implemented',
    tags: ['authentication', 'security', 'jwt'],
    traceLinks: [
      { type: 'satisfies', target: { id: 'DEMO-ADR-AUTH-001', documentId: 'DEMO-ADRS' }, confidence: 'high' },
    ],
  },
  {
    id: 'DEMO-REQ-AUTH-002',
    type: 'functional',
    title: 'OAuth 2.0 Social Login',
    description: 'The system must support Google and GitHub OAuth 2.0 authorization code flow for social login.',
    priority: 'high',
    status: 'implemented',
    tags: ['authentication', 'oauth', 'social'],
    traceLinks: [
      { type: 'satisfies', target: { id: 'DEMO-ADR-AUTH-001', documentId: 'DEMO-ADRS' }, confidence: 'high' },
    ],
  },
  {
    id: 'DEMO-REQ-AUTH-003',
    type: 'non-functional',
    title: 'SAML Enterprise SSO',
    description: 'The system must support SAML v2 HTTP-POST binding for enterprise IdP integration.',
    priority: 'medium',
    status: 'implemented',
    tags: ['authentication', 'saml', 'enterprise'],
    traceLinks: [
      { type: 'satisfies', target: { id: 'DEMO-ADR-AUTH-001', documentId: 'DEMO-ADRS' }, confidence: 'high' },
    ],
  },
  {
    id: 'DEMO-REQ-ORG-001',
    type: 'functional',
    title: 'Multi-tenant Organization Isolation',
    description: 'The system must isolate data per organization using org-scoped database queries and middleware.',
    priority: 'critical',
    status: 'implemented',
    tags: ['multi-tenant', 'organization', 'isolation'],
    traceLinks: [
      { type: 'satisfies', target: { id: 'DEMO-ADR-ORG-001', documentId: 'DEMO-ADRS' }, confidence: 'high' },
    ],
  },
  {
    id: 'DEMO-REQ-ORG-002',
    type: 'functional',
    title: 'Organization CRUD',
    description: 'The system must allow creating, reading, updating, and deleting organizations via REST API.',
    priority: 'high',
    status: 'implemented',
    tags: ['organization', 'crud', 'api'],
    traceLinks: [
      { type: 'satisfies', target: { id: 'DEMO-ADR-ORG-001', documentId: 'DEMO-ADRS' }, confidence: 'high' },
    ],
  },
  {
    id: 'DEMO-REQ-ORG-003',
    type: 'non-functional',
    title: 'Org-scoped Role-Based Access Control',
    description: 'Each organization must have independent role definitions and permission sets.',
    priority: 'high',
    status: 'implemented',
    tags: ['rbac', 'multi-tenant', 'authorization'],
    traceLinks: [
      { type: 'satisfies', target: { id: 'DEMO-ADR-ORG-001', documentId: 'DEMO-ADRS' }, confidence: 'high' },
    ],
  },
  {
    id: 'DEMO-REQ-AUDIT-001',
    type: 'functional',
    title: 'Structured Audit Log Capture',
    description: 'All mutating API operations must automatically record audit events with user, action, resource, and timestamp.',
    priority: 'critical',
    status: 'implemented',
    tags: ['audit', 'logging', 'compliance'],
    traceLinks: [
      { type: 'satisfies', target: { id: 'DEMO-ADR-AUDIT-001', documentId: 'DEMO-ADRS' }, confidence: 'high' },
    ],
  },
  {
    id: 'DEMO-REQ-AUDIT-002',
    type: 'functional',
    title: 'Audit Log Query API',
    description: 'The audit log must support filtering by orgId, action, date range, userId, resourceType, and full-text search.',
    priority: 'high',
    status: 'implemented',
    tags: ['audit', 'query', 'api'],
    traceLinks: [
      { type: 'satisfies', target: { id: 'DEMO-ADR-AUDIT-001', documentId: 'DEMO-ADRS' }, confidence: 'high' },
    ],
  },
  {
    id: 'DEMO-REQ-AUDIT-003',
    type: 'non-functional',
    title: 'Audit Retention and Export',
    description: 'Audit logs must support JSON and CSV export, with configurable retention TTL and automatic purge.',
    priority: 'medium',
    status: 'implemented',
    tags: ['audit', 'export', 'retention'],
    traceLinks: [
      { type: 'satisfies', target: { id: 'DEMO-ADR-AUDIT-001', documentId: 'DEMO-ADRS' }, confidence: 'high' },
    ],
  },
  {
    id: 'DEMO-REQ-TRACE-001',
    type: 'functional',
    title: 'Traceability Graph Construction',
    description: 'The system must build a directed graph of requirements, architecture models, components, and test cases with trace links.',
    priority: 'high',
    status: 'implemented',
    tags: ['traceability', 'graph', 'architecture'],
    traceLinks: [
      { type: 'satisfies', target: { id: 'DEMO-ADR-TRACE-001', documentId: 'DEMO-ADRS' }, confidence: 'high' },
    ],
  },
  {
    id: 'DEMO-REQ-TRACE-002',
    type: 'functional',
    title: 'Impact Analysis Engine',
    description: 'A change to any requirement or component must propagate impact analysis through the trace graph to all affected artifacts.',
    priority: 'high',
    status: 'implemented',
    tags: ['traceability', 'impact', 'analysis'],
    traceLinks: [
      { type: 'satisfies', target: { id: 'DEMO-ADR-TRACE-001', documentId: 'DEMO-ADRS' }, confidence: 'high' },
      { type: 'dependsOn', target: { id: 'DEMO-REQ-TRACE-001', documentId: 'DEMO-ADRS' }, confidence: 'high' },
    ],
  },
  {
    id: 'DEMO-REQ-TRACE-003',
    type: 'non-functional',
    title: 'V-Model Traceability Compliance',
    description: 'Every requirement must trace forward to at least one test case and backward to at least one architecture element.',
    priority: 'medium',
    status: 'implemented',
    tags: ['v-model', 'traceability', 'compliance'],
    traceLinks: [
      { type: 'satisfies', target: { id: 'DEMO-ADR-TRACE-001', documentId: 'DEMO-ADRS' }, confidence: 'high' },
    ],
  },
  {
    id: 'DEMO-REQ-SCAN-001',
    type: 'functional',
    title: 'Repository Scanning for Artifact Detection',
    description: 'The system must scan repositories to detect architecture decisions, requirements, test cases, and other engineering artifacts.',
    priority: 'high',
    status: 'implemented',
    tags: ['scanning', 'artifacts', 'detection'],
    traceLinks: [
      { type: 'satisfies', target: { id: 'DEMO-ADR-SCAN-001', documentId: 'DEMO-ADRS' }, confidence: 'high' },
    ],
  },
  {
    id: 'DEMO-REQ-SCAN-002',
    type: 'functional',
    title: 'Multi-repo Scan Support',
    description: 'The scanner must support scanning multiple repositories and aggregating results into a unified view.',
    priority: 'medium',
    status: 'implemented',
    tags: ['scanning', 'multi-repo', 'aggregation'],
    traceLinks: [
      { type: 'satisfies', target: { id: 'DEMO-ADR-SCAN-001', documentId: 'DEMO-ADRS' }, confidence: 'medium' },
    ],
  },
  {
    id: 'DEMO-REQ-UI-001',
    type: 'functional',
    title: 'Dashboard with Live Trace Graph',
    description: 'The frontend must display a live traceability graph with interactive node exploration and impact propagation visualization.',
    priority: 'high',
    status: 'implemented',
    tags: ['frontend', 'dashboard', 'graph'],
    traceLinks: [
      { type: 'satisfies', target: { id: 'DEMO-ADR-TRACE-001', documentId: 'DEMO-ADRS' }, confidence: 'high' },
      { type: 'dependsOn', target: { id: 'DEMO-REQ-TRACE-001', documentId: 'DEMO-ADRS' }, confidence: 'high' },
    ],
  },
]

const DEMO_ADRS: SeedADR[] = [
  {
    id: 'DEMO-ADR-AUTH-001',
    title: 'Authentication Strategy: JWT with OAuth and SAML Federation',
    status: 'accepted',
    context: 'The Nexus platform must support multiple authentication mechanisms: email/password for local users, OAuth 2.0 for social login, and SAML v2 for enterprise SSO.',
    decision: 'Issue short-lived JWT access tokens (15 minutes) signed with RS256. Support three authentication paths with identical JWT payloads containing sub, email, role, permissions, and orgId claims.',
    consequences: [
      'Services validate tokens locally via public key without network calls',
      'OAuth and SAML users can link multiple identities to one account',
      'Enterprise deployments can enforce SAML-only authentication',
      'Token revocation has up to 15-minute window for access tokens',
      'Provider configs are managed via environment variables',
    ],
    traceLinks: [
      { type: 'satisfies', target: { id: 'DEMO-REQ-AUTH-001', documentId: 'DEMO-ADRS' }, confidence: 'high' },
      { type: 'satisfies', target: { id: 'DEMO-REQ-AUTH-002', documentId: 'DEMO-ADRS' }, confidence: 'high' },
      { type: 'satisfies', target: { id: 'DEMO-REQ-AUTH-003', documentId: 'DEMO-ADRS' }, confidence: 'high' },
    ],
  },
  {
    id: 'DEMO-ADR-ORG-001',
    title: 'Multi-tenant Data Isolation via Org-scoped Queries',
    status: 'accepted',
    context: 'Nexus supports multiple organizations sharing the same deployment. Data from different organizations must be strictly isolated.',
    decision: 'Enforce multi-tenancy at the application layer: all database queries include an orgId WHERE clause, middleware extracts orgId from JWT claims, cross-org access is denied at the repository layer with 403 responses.',
    consequences: [
      'Simple deployment topology with a single database',
      'All queries must explicitly include orgId (forgetting is a security bug)',
      'Org admin manages members and roles without support interaction',
      'Data export/import is scoped per organization',
    ],
    traceLinks: [
      { type: 'satisfies', target: { id: 'DEMO-REQ-ORG-001', documentId: 'DEMO-ADRS' }, confidence: 'high' },
      { type: 'satisfies', target: { id: 'DEMO-REQ-ORG-002', documentId: 'DEMO-ADRS' }, confidence: 'high' },
      { type: 'satisfies', target: { id: 'DEMO-REQ-ORG-003', documentId: 'DEMO-ADRS' }, confidence: 'high' },
    ],
  },
  {
    id: 'DEMO-ADR-AUDIT-001',
    title: 'Structured Audit Log with Query API and Retention',
    status: 'accepted',
    context: 'Enterprise compliance requires a complete audit trail of all mutating operations with who, what, when, and on which resource.',
    decision: 'Middleware on all mutating endpoints automatically records audit events. Events include id, timestamp, userId, userEmail, action, resourceType, resourceId, details, ipAddress, and orgId. Query API supports filtering and export.',
    consequences: [
      'Zero additional effort per endpoint (middleware handles recording)',
      'CSV export enables external SIEM integration',
      'Retention purge must be scheduled via cron or on-demand API',
      'Audit events increase database write volume proportionally to API usage',
    ],
    traceLinks: [
      { type: 'satisfies', target: { id: 'DEMO-REQ-AUDIT-001', documentId: 'DEMO-ADRS' }, confidence: 'high' },
      { type: 'satisfies', target: { id: 'DEMO-REQ-AUDIT-002', documentId: 'DEMO-ADRS' }, confidence: 'high' },
      { type: 'satisfies', target: { id: 'DEMO-REQ-AUDIT-003', documentId: 'DEMO-ADRS' }, confidence: 'high' },
    ],
  },
  {
    id: 'DEMO-ADR-TRACE-001',
    title: 'V-Model Traceability with Directed Graph Analysis',
    status: 'accepted',
    context: 'The V-Model requires bidirectional traceability between requirements, architecture, components, and test cases.',
    decision: 'Build a directed graph of nodes (requirements, architecture models, components, test cases) and edges (trace links with confidence scores). Impact analysis traverses the graph to propagate changes.',
    consequences: [
      'Every requirement must trace forward to test cases',
      'Every test case must trace backward to requirements',
      'Impact changes propagate automatically through the graph',
      'Dashboard visualizes the live traceability graph',
    ],
    traceLinks: [
      { type: 'satisfies', target: { id: 'DEMO-REQ-TRACE-001', documentId: 'DEMO-ADRS' }, confidence: 'high' },
      { type: 'satisfies', target: { id: 'DEMO-REQ-TRACE-002', documentId: 'DEMO-ADRS' }, confidence: 'high' },
      { type: 'satisfies', target: { id: 'DEMO-REQ-TRACE-003', documentId: 'DEMO-ADRS' }, confidence: 'high' },
      { type: 'satisfies', target: { id: 'DEMO-REQ-UI-001', documentId: 'DEMO-ADRS' }, confidence: 'high' },
    ],
  },
  {
    id: 'DEMO-ADR-SCAN-001',
    title: 'Repository Scanning with Artifact Detection',
    status: 'accepted',
    context: 'Engineering artifacts must be automatically detected from source repositories to populate the traceability model.',
    decision: 'Implement a multi-repo scanner that detects requirements, architecture decisions, test cases, and other artifacts from YAML and structured documents in the repository.',
    consequences: [
      'Automated detection reduces manual data entry',
      'Multi-repo support enables enterprise-scale scanning',
      'Scan metadata tracks source, timestamp, and detection confidence',
      'Scanned data feeds the trace graph and impact analysis',
    ],
    traceLinks: [
      { type: 'satisfies', target: { id: 'DEMO-REQ-SCAN-001', documentId: 'DEMO-ADRS' }, confidence: 'high' },
      { type: 'satisfies', target: { id: 'DEMO-REQ-SCAN-002', documentId: 'DEMO-ADRS' }, confidence: 'medium' },
    ],
  },
]

function buildTraceGraph(): SeedTraceGraph {
  const nodes = [
    { id: 'DEMO-ADR-AUTH-001', type: 'architectureModel', title: 'Authentication Strategy ADR' },
    { id: 'DEMO-ADR-ORG-001', type: 'architectureModel', title: 'Multi-tenant Isolation ADR' },
    { id: 'DEMO-ADR-AUDIT-001', type: 'architectureModel', title: 'Audit Log ADR' },
    { id: 'DEMO-ADR-TRACE-001', type: 'architectureModel', title: 'V-Model Traceability ADR' },
    { id: 'DEMO-ADR-SCAN-001', type: 'architectureModel', title: 'Repository Scanning ADR' },
    { id: 'DEMO-REQ-AUTH-001', type: 'requirement', title: 'JWT Authentication' },
    { id: 'DEMO-REQ-AUTH-002', type: 'requirement', title: 'OAuth 2.0 Social Login' },
    { id: 'DEMO-REQ-AUTH-003', type: 'requirement', title: 'SAML Enterprise SSO' },
    { id: 'DEMO-REQ-ORG-001', type: 'requirement', title: 'Multi-tenant Isolation' },
    { id: 'DEMO-REQ-ORG-002', type: 'requirement', title: 'Organization CRUD' },
    { id: 'DEMO-REQ-ORG-003', type: 'requirement', title: 'Org-scoped RBAC' },
    { id: 'DEMO-REQ-AUDIT-001', type: 'requirement', title: 'Audit Log Capture' },
    { id: 'DEMO-REQ-AUDIT-002', type: 'requirement', title: 'Audit Log Query API' },
    { id: 'DEMO-REQ-AUDIT-003', type: 'requirement', title: 'Audit Retention and Export' },
    { id: 'DEMO-REQ-TRACE-001', type: 'requirement', title: 'Traceability Graph Construction' },
    { id: 'DEMO-REQ-TRACE-002', type: 'requirement', title: 'Impact Analysis Engine' },
    { id: 'DEMO-REQ-TRACE-003', type: 'requirement', title: 'V-Model Traceability Compliance' },
    { id: 'DEMO-REQ-SCAN-001', type: 'requirement', title: 'Repository Scanning' },
    { id: 'DEMO-REQ-SCAN-002', type: 'requirement', title: 'Multi-repo Scan Support' },
    { id: 'DEMO-REQ-UI-001', type: 'requirement', title: 'Dashboard with Live Trace Graph' },
    { id: 'DEMO-TC-AUTH-001', type: 'testCase', title: 'JWT Token Validation Test' },
    { id: 'DEMO-TC-AUTH-002', type: 'testCase', title: 'OAuth Callback Handler Test' },
    { id: 'DEMO-TC-ORG-001', type: 'testCase', title: 'Org-scoped Query Test' },
    { id: 'DEMO-TC-AUDIT-001', type: 'testCase', title: 'Audit Event Recording Test' },
    { id: 'DEMO-TC-TRACE-001', type: 'testCase', title: 'Graph Construction Test' },
    { id: 'DEMO-TC-SCAN-001', type: 'testCase', title: 'Artifact Detection Test' },
  ]

  const edges: SeedTraceGraph['edges'] = [
    { id: 'edge-auth-1', source_id: 'DEMO-ADR-AUTH-001', target_id: 'DEMO-REQ-AUTH-001', relationship_type: 'satisfies', confidence: 'high', description: 'ADR satisfies JWT auth requirement' },
    { id: 'edge-auth-2', source_id: 'DEMO-ADR-AUTH-001', target_id: 'DEMO-REQ-AUTH-002', relationship_type: 'satisfies', confidence: 'high', description: 'ADR satisfies OAuth login requirement' },
    { id: 'edge-auth-3', source_id: 'DEMO-ADR-AUTH-001', target_id: 'DEMO-REQ-AUTH-003', relationship_type: 'satisfies', confidence: 'high', description: 'ADR satisfies SAML SSO requirement' },
    { id: 'edge-org-1', source_id: 'DEMO-ADR-ORG-001', target_id: 'DEMO-REQ-ORG-001', relationship_type: 'satisfies', confidence: 'high' },
    { id: 'edge-org-2', source_id: 'DEMO-ADR-ORG-001', target_id: 'DEMO-REQ-ORG-002', relationship_type: 'satisfies', confidence: 'high' },
    { id: 'edge-org-3', source_id: 'DEMO-ADR-ORG-001', target_id: 'DEMO-REQ-ORG-003', relationship_type: 'satisfies', confidence: 'high' },
    { id: 'edge-audit-1', source_id: 'DEMO-ADR-AUDIT-001', target_id: 'DEMO-REQ-AUDIT-001', relationship_type: 'satisfies', confidence: 'high' },
    { id: 'edge-audit-2', source_id: 'DEMO-ADR-AUDIT-001', target_id: 'DEMO-REQ-AUDIT-002', relationship_type: 'satisfies', confidence: 'high' },
    { id: 'edge-audit-3', source_id: 'DEMO-ADR-AUDIT-001', target_id: 'DEMO-REQ-AUDIT-003', relationship_type: 'satisfies', confidence: 'high' },
    { id: 'edge-trace-1', source_id: 'DEMO-ADR-TRACE-001', target_id: 'DEMO-REQ-TRACE-001', relationship_type: 'satisfies', confidence: 'high' },
    { id: 'edge-trace-2', source_id: 'DEMO-ADR-TRACE-001', target_id: 'DEMO-REQ-TRACE-002', relationship_type: 'satisfies', confidence: 'high' },
    { id: 'edge-trace-3', source_id: 'DEMO-ADR-TRACE-001', target_id: 'DEMO-REQ-TRACE-003', relationship_type: 'satisfies', confidence: 'high' },
    { id: 'edge-trace-4', source_id: 'DEMO-ADR-TRACE-001', target_id: 'DEMO-REQ-UI-001', relationship_type: 'satisfies', confidence: 'high' },
    { id: 'edge-scan-1', source_id: 'DEMO-ADR-SCAN-001', target_id: 'DEMO-REQ-SCAN-001', relationship_type: 'satisfies', confidence: 'high' },
    { id: 'edge-scan-2', source_id: 'DEMO-ADR-SCAN-001', target_id: 'DEMO-REQ-SCAN-002', relationship_type: 'satisfies', confidence: 'medium' },
    { id: 'edge-1', source_id: 'DEMO-REQ-AUTH-001', target_id: 'DEMO-TC-AUTH-001', relationship_type: 'verifies', confidence: 'high' },
    { id: 'edge-2', source_id: 'DEMO-REQ-AUTH-002', target_id: 'DEMO-TC-AUTH-002', relationship_type: 'verifies', confidence: 'high' },
    { id: 'edge-3', source_id: 'DEMO-REQ-ORG-001', target_id: 'DEMO-TC-ORG-001', relationship_type: 'verifies', confidence: 'high' },
    { id: 'edge-4', source_id: 'DEMO-REQ-AUDIT-001', target_id: 'DEMO-TC-AUDIT-001', relationship_type: 'verifies', confidence: 'high' },
    { id: 'edge-5', source_id: 'DEMO-REQ-TRACE-001', target_id: 'DEMO-TC-TRACE-001', relationship_type: 'verifies', confidence: 'high' },
    { id: 'edge-6', source_id: 'DEMO-REQ-SCAN-001', target_id: 'DEMO-TC-SCAN-001', relationship_type: 'verifies', confidence: 'high' },
    { id: 'edge-dep-1', source_id: 'DEMO-REQ-TRACE-002', target_id: 'DEMO-REQ-TRACE-001', relationship_type: 'dependsOn', confidence: 'high' },
    { id: 'edge-dep-2', source_id: 'DEMO-REQ-UI-001', target_id: 'DEMO-REQ-TRACE-001', relationship_type: 'dependsOn', confidence: 'high' },
    { id: 'edge-dep-3', source_id: 'DEMO-REQ-UI-001', target_id: 'DEMO-REQ-TRACE-002', relationship_type: 'dependsOn', confidence: 'high' },
    { id: 'edge-dep-4', source_id: 'DEMO-REQ-TRACE-003', target_id: 'DEMO-REQ-AUTH-001', relationship_type: 'dependsOn', confidence: 'high' },
    { id: 'edge-dep-5', source_id: 'DEMO-REQ-AUDIT-003', target_id: 'DEMO-REQ-AUDIT-001', relationship_type: 'dependsOn', confidence: 'high' },
  ]

  return { nodes, edges }
}

export function getDemoSeedData(): DemoSeedData {
  return {
    requirements: DEMO_REQUIREMENTS,
    adrs: DEMO_ADRS,
    traceGraph: buildTraceGraph(),
  }
}

export function getDemoRequirements(): SeedRequirement[] {
  return DEMO_REQUIREMENTS
}

export function getDemoADRs(): SeedADR[] {
  return DEMO_ADRS
}

export function getDemoTraceGraph(): SeedTraceGraph {
  return buildTraceGraph()
}