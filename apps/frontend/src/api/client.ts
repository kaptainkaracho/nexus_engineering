/**
 * API client for the Nexus Engineering backend
 */

import type {
  ArtifactRegistry,
  RegistryProviderType,
  RegistryCredentials,
  RegistryArtifact,
} from '@nexus-engineering/shared';

const BASE = import.meta.env.VITE_API_URL || '';

// Define the missing artefact types
export interface ArtefactRequirement {
  id: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  source: string;
  type: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  tags: string[];
}

export interface ArtefactArchitecture {
  id: string;
  type: string;
  name: string;
  description: string;
  elements: Array<{ id: string; type: string; name: string; properties: Record<string, any>; }>;
}

export interface ArtefactComponent {
  id: string;
  name: string;
  type: string;
  description: string;
  path?: string;
  language?: string;
  technologies?: string[];
}

export interface ArtefactTestCase {
  id: string;
  name: string;
  type: string;
  description: string;
  testSteps: Array<{ stepNumber: number; action: string; expected?: string; }>;
  expectedResult: string;
  status: string;
  automationStatus: string;
}

export interface ArtefactTrace {
  id: string;
  sourceId: string;
  sourceType: string;
  targetId: string;
  targetType: string;
  relationshipType: string;
  confidence: string;
  description: string;
}

export interface ArtefactListResponse {
  requirements: ArtefactRequirement[];
  architectures: ArtefactArchitecture[];
  components: ArtefactComponent[];
  testCases: ArtefactTestCase[];
  traces: ArtefactTrace[];
  total: number;
  errors: Map<string, string[]>;
}

export interface ArtefactCollection {
  artefacts: ArtefactRequirement[] | ArtefactArchitecture[] | ArtefactComponent[] | ArtefactTestCase[];
  traces: ArtefactTrace[];
}

const API_ENDPOINT = '/api/requirements';

/** Fetch all requirements converted to frontend artefact types */
const FALLBACK_DATA: ArtefactListResponse = {
  requirements: [
    { id: 'f7b5ff9a-6b9e-4dba-b51d-e3c20a8e59f7', version: '1.0.0', createdAt: '2024-01-15T10:30:00Z', updatedAt: '2024-01-15T10:30:00Z', source: 'doORS', type: 'functional', title: 'User Authentication System', description: 'Users must be able to securely authenticate with the system using email and password.', priority: 'high', status: 'approved', tags: ['security', 'authentication'] },
    { id: 'a2c4d6e8-1f3a-4b5c-9d7e-2f8a3b6c1d4e', version: '1.0.0', createdAt: '2024-02-01T09:00:00Z', updatedAt: '2024-02-01T09:00:00Z', source: 'jira', type: 'non-functional', title: 'Response Time Requirement', description: 'All API endpoints must respond within 200ms at p95 under normal load.', priority: 'critical', status: 'proposed', tags: ['performance'] },
  ],
  architectures: [
    { id: 'e4c3d2f8-7b6a-4b9d-a1e5-f9c2d8e7b6f5', type: 'internalBlockDiagram', name: 'Auth Service Internal Structure', description: 'Shows internal components of the authentication service.', elements: [{ id: 'elem-001', type: 'block', name: 'AuthService', properties: {} }, { id: 'elem-002', type: 'part', name: 'TokenManager', properties: {} }, { id: 'elem-003', type: 'port', name: 'httpPort', properties: {} }] },
  ],
  components: [
    { id: 'c8d2f5a6-9e7b-4c3d-b2f1-a8e7c6b5d4f9', name: 'AuthService', type: 'service', description: 'Handles user authentication, authorization, and session management.', path: 'src/services/auth.service.ts', language: 'TypeScript', technologies: ['Fastify', 'JWT', '@better-auth/nestjs'] },
  ],
  testCases: [
    { id: 'b3e8d1c4-5f2a-4e7b-b6d9-c5f2e8d4a3b8', name: 'User Authentication Unit Tests', type: 'unit', description: 'Test authentication service methods in isolation.', testSteps: [{ stepNumber: 1, action: 'Call AuthService.validateCredentials() with valid email and password' }, { stepNumber: 2, action: 'Verify a JWT token is returned', expected: 'Token should be a valid JWT with user claims' }, { stepNumber: 3, action: 'Call AuthService.validateCredentials() with invalid credentials' }, { stepNumber: 4, action: 'Verify authentication fails and error is thrown', expected: 'Should throw UnauthorizedError' }], expectedResult: 'All test steps should pass.', status: 'completed', automationStatus: 'automated' },
  ],
  traces: [
    { id: 'f1a4b2c8-d9e3-4f1a-b2c5-d6e9f7a3b8c4', sourceId: 'f7b5ff9a-6b9e-4dba-b51d-e3c20a8e59f7', sourceType: 'requirement', targetId: 'e4c3d2f8-7b6a-4b9d-a1e5-f9c2d8e7b6f5', targetType: 'architectureModel', relationshipType: 'satisfies', confidence: 'high', description: 'The architecture model shows how the authentication requirement is implemented.' },
    { id: 'e8b7d6f2-4c3a-4b9d-b1e5-f4c8d7e6b3f5', sourceId: 'e4c3d2f8-7b6a-4b9d-a1e5-f9c2d8e7b6f5', sourceType: 'architectureModel', targetId: 'c8d2f5a6-9e7b-4c3d-b2f1-a8e7c6b5d4f9', targetType: 'softwareComponent', relationshipType: 'tracesTo', confidence: 'high', description: 'Architecture model traces to software component' },
    { id: 'd5c9e2f8-7b6a-4a5d-b1e6-c7f3d8e4b9a5', sourceId: 'f7b5ff9a-6b9e-4dba-b51d-e3c20a8e59f7', sourceType: 'requirement', targetId: 'b3e8d1c4-5f2a-4e7b-b6d9-c5f2e8d4a3b8', targetType: 'testCase', relationshipType: 'verifies', confidence: 'high', description: 'Requirement verifies test case' },
  ],
  total: 7,
  errors: new Map(),
};

export async function fetchArtefacts(): Promise<ArtefactListResponse> {
  try {
    const res = await fetch(`${BASE}${API_ENDPOINT}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return res.json();
  } catch {
    return FALLBACK_DATA;
  }
}

/** Fetch a single requirement by ID */
export async function fetchRequirement(id: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}${API_ENDPOINT}/${id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return res.json();
  } catch {
    return null;
  }
}

/** Scan a repository path for requirement documents */
export interface FileEntry {
  path: string;
  relativePath: string;
  contentType: 'text' | 'binary';
}

export interface TreeNode {
  id: string;
  name: string;
  type: 'folder' | 'file';
  path: string;
  language?: string;
  fileSize?: number;
  lastModified?: string;
  children?: TreeNode[];
}

export interface ScanResult {
  files: FileEntry[];
  tree: TreeNode[];
  warnings: string[];
}

export interface FileDetail {
  path: string;
  content: string;
  extension: string;
  language?: string;
  fileSize?: number;
}

/** Scan a repository directory and return tree structure */
export async function scanRepository(directoryPath: string): Promise<ScanResult> {
  try {
    const res = await fetch(`${BASE}/api/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repositoryPath: directoryPath }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return res.json();
  } catch {
    return { files: [], tree: [], warnings: ['Failed to load repository'] };
  }
}

/** Get file content for a specific file path */
export async function getFileContent(filePath: string): Promise<FileDetail> {
  try {
    const res = await fetch(`${BASE}/api/scan/file?path=${encodeURIComponent(filePath)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return res.json();
  } catch {
    return { path: filePath, content: 'Error loading file', extension: 'error' };
  }
}

/** Legacy method - kept for compatibility */
export async function scanRequirements(repositoryPath: string): Promise<{ scanned: number; total: number }> {
  try {
    const res = await fetch(`${BASE}/api/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repositoryPath }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch {
    return { scanned: 0, total: 0 };
  }
}

// =========================================================
// Discovery Dashboard — Artifact Registry + Scan API
// =========================================================

export type ArtifactType = 'requirement' | 'architecture' | 'adr' | 'spec' | 'unknown';
export type LifecycleState = 'discovered' | 'parsed' | 'indexed' | 'related' | 'error';

export interface ArtifactError {
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
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

export interface RegistrySummary {
  total: number;
  byType: Record<ArtifactType, number>;
  byLifecycle: Record<LifecycleState, number>;
}

export interface RegistryResponse {
  data: DiscoveryArtifact[];
  summary: RegistrySummary;
}

export interface ScanTriggerResponse {
  scanId: string;
  status: 'running' | 'completed' | 'failed';
  filesFound?: number;
  artifactsDetected?: number;
}

export interface ScanStatus {
  id: string;
  startedAt: string;
  completedAt?: string;
  repositoryPath: string;
  filesFound: number;
  filesSkipped: number;
  artifactsDetected: Array<{
    artifactType: ArtifactType;
    filePath: string;
    relativePath: string;
    fileName: string;
    detectedAt: string;
  }>;
  errors: Array<{ path: string; message: string }>;
  status: 'running' | 'completed' | 'failed';
}

const DEFAULT_REPOSITORY_PATH = '/repo';

/** Fetch the full artifact registry and aggregate summary */
export async function fetchRegistry(): Promise<RegistryResponse> {
  try {
    const res = await fetch(`${BASE}/api/artifacts/registry`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const json = await res.json();
    return { data: json.data ?? [], summary: json.summary ?? emptySummary() };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('HTTP')) throw error;
    return { data: [], summary: emptySummary() };
  }
}

/** Fetch artifacts filtered by type from the registry */
export async function fetchRegistryByType(type: ArtifactType): Promise<DiscoveryArtifact[]> {
  try {
    const res = await fetch(`${BASE}/api/artifacts/registry/type/${type}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const json = await res.json();
    return json.data ?? [];
  } catch {
    return [];
  }
}

/** Trigger a repository scan; returns the scan id for status polling */
export async function triggerScan(
  repositoryPath: string = DEFAULT_REPOSITORY_PATH,
): Promise<ScanTriggerResponse> {
  const res = await fetch(`${BASE}/api/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ repositoryPath }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return res.json();
}

/** Poll the status of an in-flight scan */
export async function fetchScanStatus(scanId: string): Promise<ScanStatus> {
  const res = await fetch(`${BASE}/api/scan/${encodeURIComponent(scanId)}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return res.json();
}

/** Request a re-parse of a single artifact (resets to discovered) */
export async function reparseArtifact(id: string): Promise<DiscoveryArtifact> {
  const res = await fetch(`${BASE}/api/artifacts/registry/${encodeURIComponent(id)}/reparse`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  const json = await res.json();
  return json.data;
}

// =========================================================
// Graph Builder — Traceability Graph API
// =========================================================

export type GraphNodeType =
  | 'requirement'
  | 'architectureModel'
  | 'softwareComponent'
  | 'testCase';

export type TraceConfidence = 'high' | 'medium' | 'low';

export interface GraphNode {
  id: string;
  type: GraphNodeType;
  title?: string;
  name?: string;
}

export interface GraphEdge {
  sourceId: string;
  targetId: string;
  relationshipType: string;
  confidence: TraceConfidence;
  description?: string;
}

export interface TraceabilityGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  totalNodes: number;
  totalEdges: number;
}

export interface TraceabilityGraphResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
  totalNodes: number;
  totalEdges: number;
}

function emptyGraph(): TraceabilityGraph {
  return { nodes: [], edges: [], totalNodes: 0, totalEdges: 0 };
}

/** Fetch the full traceability graph (nodes = artifacts, edges = trace links) */
export async function fetchTraceabilityGraph(): Promise<TraceabilityGraph> {
  try {
    const res = await fetch(`${BASE}/api/graph/traceability`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const json = (await res.json()) as TraceabilityGraphResponse;
    return {
      nodes: json.nodes ?? [],
      edges: json.edges ?? [],
      totalNodes: json.totalNodes ?? json.nodes?.length ?? 0,
      totalEdges: json.totalEdges ?? json.edges?.length ?? 0,
    };
  } catch {
    return emptyGraph();
  }
}

// =========================================================
// Multi-Repo Scanner — Trigger + Status + Per-Repo Artifacts
// =========================================================

export interface MultiRepoScanRequest {
  repositoryPaths: string[]
  scanMode?: 'parallel' | 'sequential'
}

export interface MultiRepoScanEntry {
  repositoryPath: string
  scanId: string
  status: 'running' | 'completed' | 'failed'
  filesFound?: number
  artifactsDetected?: number
  error?: string
}

export interface MultiRepoScanResponse {
  sessionId: string
  scans: MultiRepoScanEntry[]
  totalFilesFound: number
  totalArtifactsDetected: number
  scanTimeMs: number
  errors: Array<{ repositoryPath: string; message: string }>
}

export interface MultiRepoSession {
  id: string
  startedAt: string
  completedAt?: string
  scans: MultiRepoScanEntry[]
  totalFilesFound: number
  totalArtifactsDetected: number
  scanTimeMs?: number
  errors: Array<{ repositoryPath: string; message: string }>
  status: 'running' | 'completed' | 'failed'
}

/** Trigger a multi-repository scan */
export async function triggerMultiScan(
  request: MultiRepoScanRequest,
): Promise<MultiRepoScanResponse> {
  const res = await fetch(`${BASE}/api/scan/multi`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return res.json();
}

/** Poll the status of a multi-repo scan session */
export async function fetchMultiScanStatus(sessionId: string): Promise<MultiRepoSession> {
  const res = await fetch(`${BASE}/api/scan/multi/${encodeURIComponent(sessionId)}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return res.json();
}

export interface ByRepositoryResponse {
  data: DiscoveryArtifact[]
  total: number
  repositoryPath: string
}

/** Get artifacts filtered by repository path */
export async function fetchArtifactsByRepository(
  repositoryPath: string,
): Promise<ByRepositoryResponse> {
  const res = await fetch(
    `${BASE}/api/artifacts/by-repository?path=${encodeURIComponent(repositoryPath)}`,
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return res.json();
}

// =========================================================
// Audit Log — Viewer API
// =========================================================

export interface AuditLogEntry {
  id: string
  timestamp: string
  userId: string
  userEmail: string
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'READ' | 'ARCHIVE' | 'RESTORE'
  resourceType: string
  resourceId: string
  details: string | null
  ipAddress: string | null
}

export interface AuditLogFilter {
  startDate?: string
  endDate?: string
  userId?: string
  action?: string
  resourceType?: string
  search?: string
  limit?: number
  offset?: number
}

export interface AuditLogResponse {
  data: AuditLogEntry[]
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

/** Fetch paginated audit logs with optional filters */
export async function fetchAuditLogs(filter?: AuditLogFilter): Promise<AuditLogResponse> {
  const params = new URLSearchParams();
  if (filter) {
    if (filter.limit != null) params.set('limit', String(filter.limit));
    if (filter.offset != null) params.set('offset', String(filter.offset));
    if (filter.action) params.set('action', filter.action);
    if (filter.resourceType) params.set('resourceType', filter.resourceType);
    if (filter.userId) params.set('userId', filter.userId);
    if (filter.startDate) params.set('startDate', filter.startDate);
    if (filter.endDate) params.set('endDate', filter.endDate);
    if (filter.search) params.set('search', filter.search);
  }
  const qs = params.toString();
  try {
    const res = await fetch(`${BASE}/api/audit-logs${qs ? `?${qs}` : ''}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return res.json();
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('HTTP')) throw err;
    return { data: [], total: 0, limit: filter?.limit ?? 50, offset: filter?.offset ?? 0, hasMore: false };
  }
}

/** Export audit logs as CSV or JSON */
export async function exportAuditLogs(format: 'csv' | 'json', filter?: AuditLogFilter): Promise<Blob | null> {
  const params = new URLSearchParams();
  params.set('format', format);
  if (filter) {
    if (filter.action) params.set('action', filter.action);
    if (filter.resourceType) params.set('resourceType', filter.resourceType);
    if (filter.userId) params.set('userId', filter.userId);
    if (filter.startDate) params.set('startDate', filter.startDate);
    if (filter.endDate) params.set('endDate', filter.endDate);
    if (filter.search) params.set('search', filter.search);
  }
  const qs = params.toString();
  try {
    const res = await fetch(`${BASE}/api/audit-logs/export?${qs}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return res.blob();
  } catch {
    return null;
  }
}

/** Fetch a single audit log entry by ID */
export async function fetchAuditLog(id: string): Promise<AuditLogEntry | null> {
  try {
    const res = await fetch(`${BASE}/api/audit-logs/${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return res.json();
  } catch {
    return null;
  }
}

function emptySummary(): RegistrySummary {
  return {
    total: 0,
    byType: { requirement: 0, architecture: 0, adr: 0, spec: 0, unknown: 0 },
    byLifecycle: { discovered: 0, parsed: 0, indexed: 0, related: 0, error: 0 },
  };
}

// =========================================================
// Private Registry Management API
// =========================================================

export interface RegistryListResponse {
  data: ArtifactRegistry[]
  total: number
}

export interface RegistryCreateRequest {
  name: string
  description?: string
  registryType: RegistryProviderType
  url?: string
  visibility: 'private' | 'team' | 'organization'
  allowedRoles?: string[]
}

export interface RegistryUpdateRequest {
  name?: string
  description?: string
  url?: string
  visibility?: 'private' | 'team' | 'organization'
  allowedRoles?: string[]
  enabled?: boolean
}

export async function fetchRegistries(): Promise<RegistryListResponse> {
  try {
    const res = await fetch(`${BASE}/api/registries`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const json = await res.json();
    return { data: json.data ?? [], total: json.total ?? json.data?.length ?? 0 };
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('HTTP')) throw err;
    return { data: [], total: 0 };
  }
}

export async function fetchRegistryById(id: string): Promise<ArtifactRegistry | null> {
  try {
    const res = await fetch(`${BASE}/api/registries/${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return res.json();
  } catch {
    return null;
  }
}

export async function createRegistry(data: RegistryCreateRequest): Promise<ArtifactRegistry | null> {
  try {
    const res = await fetch(`${BASE}/api/registries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return res.json();
  } catch {
    return null;
  }
}

export async function updateRegistry(id: string, data: RegistryUpdateRequest): Promise<ArtifactRegistry | null> {
  try {
    const res = await fetch(`${BASE}/api/registries/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return res.json();
  } catch {
    return null;
  }
}

export async function deleteRegistry(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/api/registries/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return true;
  } catch {
    return false;
  }
}

export async function toggleRegistry(id: string, enabled: boolean): Promise<ArtifactRegistry | null> {
  return updateRegistry(id, { enabled });
}

export async function fetchRegistryCredentials(registryId: string): Promise<RegistryCredentials | null> {
  try {
    const res = await fetch(`${BASE}/api/registries/${encodeURIComponent(registryId)}/credentials`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return res.json();
  } catch {
    return null;
  }
}

export async function fetchRegistryArtifacts(registryId: string): Promise<RegistryArtifact[]> {
  try {
    const res = await fetch(`${BASE}/api/registries/${encodeURIComponent(registryId)}/artifacts`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const json = await res.json();
    return json.data ?? [];
  } catch {
    return [];
  }
}
