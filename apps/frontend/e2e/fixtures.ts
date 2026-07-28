import { test as base, expect, type Page, type Route } from '@playwright/test';

/**
 * Locally-defined API contract types for the Nexus backend.
 *
 * These intentionally mirror the shapes produced by `apps/frontend/src/api/client`
 * but are declared here so the E2E suite stays decoupled from application internals
 * (and from Playwright's test-file transform, which does not elide `import type`
 * from the app entry point).
 */
export type ArtifactType = 'requirement' | 'architecture' | 'adr' | 'spec' | 'unknown';
export type LifecycleState = 'discovered' | 'parsed' | 'indexed' | 'related' | 'error';

export interface ArtifactError {
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

export interface RegistrySummary {
  total: number;
  byType: Record<ArtifactType, number>;
  byLifecycle: Record<LifecycleState, number>;
}

export interface DiscoveryArtifact {
  id: string;
  type: ArtifactType;
  filePath: string;
  repositoryPath: string;
  relativePath?: string;
  fileName?: string;
  lifecycle: LifecycleState;
  metadata: Record<string, unknown>;
  errors: ArtifactError[];
  reparseCount: number;
  createdAt: string;
  updatedAt: string;
  lastParsedAt?: string;
}

export interface RegistryResponse {
  data: DiscoveryArtifact[];
  summary: RegistrySummary;
}

export interface GraphNode {
  id: string;
  type: string;
  title?: string;
  name?: string;
}

export interface GraphEdge {
  sourceId: string;
  targetId: string;
  relationshipType: string;
  confidence: string;
  description?: string;
}

export interface TraceabilityGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  totalNodes: number;
  totalEdges: number;
}

// ── RBAC types (mirrored from @nexus-engineering/shared) ──────────────────

export interface RbacRole {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  createdAt: string;
}

export interface RbacPermission {
  id: string;
  name: string;
  description: string | null;
  resource: string;
  action: string;
}

export interface RbacUserWithRole {
  id: string;
  email: string;
  displayName: string | null;
  roleId: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Compliance types (mirrored from app api client) ──────────────────────

export interface ComplianceReport {
  id: string;
  title: string;
  report_type: string;
  format: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  created_by: string;
  file_path: string | null;
}

export interface ComplianceAggregation {
  generatedAt: string;
  summary: { totalNodes: number; totalEdges: number };
  coverage: { overallCoveragePercent: number; byType: Record<string, number> };
  soc2?: {
    totalMappings: number;
    compliant: number;
    nonCompliant: number;
    notAssessed: number;
    byCategory: Record<string, { compliant: number; nonCompliant: number; notAssessed: number }>;
  };
}

export interface Soc2ControlMapping {
  id: string;
  category: string;
  artifact_type: string;
  artifact_id: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function emptySummary(): RegistrySummary {
  return {
    total: 0,
    byType: { requirement: 0, architecture: 0, adr: 0, spec: 0, unknown: 0 },
    byLifecycle: { discovered: 0, parsed: 0, indexed: 0, related: 0, error: 0 },
  };
}

/**
 * Network-level API mock for the Nexus backend. A single catch-all route
 * ("/api/**") dispatches to per-path handlers registered by a test, which
 * keeps specs hermetic and independent of a live backend.
 */
class ApiController {
  private handlers = new Map<string, (route: Route) => Promise<void>>();

  constructor(private readonly page: Page) {}

  async install(): Promise<void> {
    // Anchor to paths that begin with "/api/" directly after the host so we
    // never intercept same-origin module requests such as "/src/api/client.ts".
    await this.page.route(/^https?:\/\/[^/]+?\/api\//, (route) => this.dispatch(route));
  }

  private async dispatch(route: Route): Promise<void> {
    const path = new URL(route.request().url()).pathname;
    const method = route.request().method();
    // Try method-specific handler first, then method-agnostic
    let handler = this.handlers.get(`${method} ${path}`);
    if (!handler) handler = this.handlers.get(path);
    if (handler) return handler(route);
    // Default: a scan that completes immediately with no artifacts.
    if (path.startsWith('/api/scan')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ scanId: 'scan-1', status: 'completed', filesFound: 0 }),
      });
    }
    // Fall through to any more-specific page.route handlers registered later,
    // or to the actual network if none match.
    return route.fallback();
  }

  registry(response: Partial<RegistryResponse> = {}): void {
    const data = response.data ?? [];
    const summary = response.summary ?? emptySummary();
    this.handlers.set('/api/artifacts/registry', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data, summary }),
      }),
    );
  }

  registryError(status = 500): void {
    this.handlers.set('/api/artifacts/registry', (route) =>
      route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'registry failure' }),
      }),
    );
  }

  graph(graph: Partial<TraceabilityGraph> = {}): void {
    const body = {
      nodes: graph.nodes ?? [],
      edges: graph.edges ?? [],
      totalNodes: graph.totalNodes ?? graph.nodes?.length ?? 0,
      totalEdges: graph.totalEdges ?? graph.edges?.length ?? 0,
    };
    this.handlers.set('/api/graph/traceability', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(body),
      }),
    );
  }

  gateConfig(config: TraceGateConfigData): void {
    this.handlers.set('/api/traceability/gate-config', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(config),
      }),
    );
  }

  gateConfigError(status = 500): void {
    this.handlers.set('/api/traceability/gate-config', (route) =>
      route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'gate config error' }),
      }),
    );
  }

  gateResult(result: TraceGateResultData): void {
    this.handlers.set('/api/traceability/gate', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(result),
      }),
    );
  }

  gateResultError(status = 500): void {
    this.handlers.set('/api/traceability/gate', (route) =>
      route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'gate evaluation error' }),
      }),
    );
  }
  // ── RBAC handlers ───────────────────────────────────────────────────────

  roles(response: { roles: RbacRole[]; total: number }): void {
    this.handlers.set('/api/roles', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(response) }),
    );
  }

  permissions(response: { permissions: RbacPermission[]; total: number }): void {
    this.handlers.set('/api/permissions', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(response) }),
    );
  }

  usersWithRoles(response: { users: RbacUserWithRole[]; total: number }): void {
    this.handlers.set('/api/users/roles', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(response) }),
    );
  }

  createRole(response: RbacRole): void {
    this.handlers.set('POST /api/roles', (route) =>
      route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(response) }),
    );
  }

  updateRole(id: string, response: RbacRole): void {
    this.handlers.set(`PUT /api/roles/${id}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(response) }),
    );
  }

  deleteRole(id: string): void {
    this.handlers.set(`DELETE /api/roles/${id}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'Role deleted successfully' }) }),
    );
  }

  setRolePermissions(id: string, response: RbacRole & { permissions: RbacPermission[] }): void {
    this.handlers.set(`PUT /api/roles/${id}/permissions`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(response) }),
    );
  }

  // ── Compliance handlers ─────────────────────────────────────────────────

  complianceReports(response: { data: ComplianceReport[]; total: number; hasMore: boolean }): void {
    this.handlers.set('GET /api/compliance/reports', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(response) }),
    );
  }

  createComplianceReport(response: ComplianceReport): void {
    this.handlers.set('POST /api/compliance/reports', (route) =>
      route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(response) }),
    );
  }

  deleteComplianceReport(id: string): void {
    this.handlers.set(`DELETE /api/compliance/reports/${id}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: `Report ${id} deleted` }) }),
    );
  }

  complianceAggregations(response: ComplianceAggregation): void {
    this.handlers.set('/api/compliance/aggregations', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(response) }),
    );
  }

  soc2Mappings(response: Soc2ControlMapping[]): void {
    this.handlers.set('/api/compliance/soc2/mappings', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(response) }),
    );
  }
  // ── Integrations handlers ─────────────────────────────────────────────────

  integrationsSyncStatus(response: {
    jira: { configured: boolean; status: string };
    linear: { configured: boolean; status: string };
    github: { configured: boolean; status: string };
    lastSyncTime: string;
    syncHealth: string;
  }): void {
    this.handlers.set('/api/integrations/sync-status', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: response }) }),
    );
  }

  integrationsSyncStatusError(status = 500): void {
    this.handlers.set('/api/integrations/sync-status', (route) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify({ error: 'sync status error' }) }),
    );
  }

  integrationsTestConnection(connector: string, response: { success: boolean; error?: string }): void {
    this.handlers.set(`POST /api/integrations/${connector}/test`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(response) }),
    );
  }
}

type Fixtures = {
  api: ApiController;
  pageErrors: Error[];
  consoleErrors: string[];
  auth: void;
};

export const test = base.extend<Fixtures>({
  auth: [
    async ({ page }, use) => {
      await page.addInitScript(() => {
        sessionStorage.setItem('auth_session', JSON.stringify({
          user: { id: 'e2e-user', email: 'test@nexus.dev', name: 'E2E Test', role: 'user', createdAt: '2025-01-01T00:00:00Z' },
          token: 'e2e-token',
          expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
        }));
      });
      await use();
    },
    { auto: true },
  ],
  api: [
    async ({ page }, use) => {
      const controller = new ApiController(page);
      await controller.install();
      await use(controller);
    },
    { auto: true },
  ],
  pageErrors: async ({ page }, use) => {
    const errors: Error[] = [];
    page.on('pageerror', (error) => errors.push(error));
    await use(errors);
  },
  consoleErrors: async ({ page }, use) => {
    const messages: string[] = [];
    const handler = (msg: { type: () => string; text: () => string }) => {
      if (msg.type() === 'error') messages.push(msg.text());
    };
    page.on('console', handler);
    await use(messages);
  },
});

// ── Trace Gate types (mirrored from @nexus-engineering/shared) ──────────────

export type GateMode = 'warn' | 'block';

export interface TraceGateConfigData {
  coverageThreshold: number;
  maxGaps: number;
  requireTypes: string[];
  mode: GateMode;
}

export interface GateViolationData {
  rule: string;
  message: string;
  actual: number | string[];
  expected: number | string[];
}

export interface GateMetricsData {
  coveragePercent: number;
  gapCount: number;
  missingTypes: string[];
}

export interface TraceGateResultData {
  pass: boolean;
  mode: GateMode;
  metrics: GateMetricsData;
  config: TraceGateConfigData;
  violations: GateViolationData[];
  evaluatedAt: string;
}

export { expect };

/** Build a DiscoveryArtifact with sensible defaults for tests. */
export function makeArtifact(overrides: Partial<DiscoveryArtifact> = {}): DiscoveryArtifact {
  return {
    id: 'artifact-1',
    type: 'requirement',
    filePath: '/repo/requirements/REQ-1.md',
    repositoryPath: '/repo',
    relativePath: 'requirements/REQ-1.md',
    fileName: 'REQ-1.md',
    lifecycle: 'discovered',
    metadata: {},
    errors: [],
    reparseCount: 0,
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    ...overrides,
  };
}

/** Build a RegistrySummary with sensible defaults for tests. */
export function makeSummary(overrides: Partial<RegistrySummary> = {}): RegistrySummary {
  return { ...emptySummary(), ...overrides };
}

/** Default gate config matching DEFAULT_GATE_CONFIG in @nexus-engineering/shared. */
export function makeGateConfig(overrides: Partial<TraceGateConfigData> = {}): TraceGateConfigData {
  return {
    coverageThreshold: 80,
    maxGaps: 0,
    requireTypes: [],
    mode: 'warn',
    ...overrides,
  };
}

/** Build a passing gate result with sensible defaults. */
export function makeGateResult(overrides: Partial<TraceGateResultData> = {}): TraceGateResultData {
  return {
    pass: true,
    mode: 'warn',
    metrics: { coveragePercent: 95, gapCount: 0, missingTypes: [] },
    config: makeGateConfig(),
    violations: [],
    evaluatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/** Build a gate violation object. */
export function makeGateViolation(overrides: Partial<GateViolationData> = {}): GateViolationData {
  return {
    rule: 'coverageThreshold',
    message: 'Coverage 45% is below threshold 80%',
    actual: 45,
    expected: 80,
    ...overrides,
  };
}
