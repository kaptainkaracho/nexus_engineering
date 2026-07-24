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
    const handler = this.handlers.get(path);
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
