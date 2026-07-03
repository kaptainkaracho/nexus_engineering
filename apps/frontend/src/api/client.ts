/**
 * API client for the Nexus Engineering backend
 */

const BASE = import.meta.env.VITE_API_URL || '';

export interface ArtefactListResponse {
  requirements: ArtefactRequirement[];
  architectures: ArtefactArchitecture[];
  components: ArtefactComponent[];
  testCases: ArtefactTestCase[];
  traces: ArtefactTrace[];
  total: number;
  errors: Map<string, string[]>;
}

export interface ArtefactRequirement {
  id: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  source: string;
  type: 'functional' | 'non-functional' | 'system' | 'user';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'proposed' | 'approved' | 'rejected' | 'implemented' | 'verified' | 'draft';
  tags?: string[];
}

export interface ArtefactArchitecture {
  id: string;
  name: string;
  type: string;
  description: string;
  elements?: Array<{id: string; name: string; type: string; properties?: Record<string, unknown>}>;
}

export interface ArtefactComponent {
  id: string;
  name: string;
  type: 'module' | 'class' | 'interface' | 'enum' | 'service' | 'component' | 'microService' | 'library' | 'configuration';
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
  testSteps?: Array<{stepNumber: number; action: string; expected?: string}>;
  expectedResult?: string;
  status: 'draft' | 'ready' | 'inProgress' | 'completed' | 'failed';
  automationStatus: 'manual' | 'automated' | 'partially-automated';
}

export interface ArtefactTrace {
  id: string;
  sourceId: string;
  sourceType: string;
  targetId: string;
  targetType: string;
  relationshipType: string;
  confidence: 'high' | 'medium' | 'low';
  description?: string;
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
    { id: 'e8b7d6f2-4c3a-4b9d-b1e5-f4c8d7e6b3f5', sourceId: 'e4c3d2f8-7b6a-4b9d-a1e5-f9c2d8e7b6f5', sourceType: 'architectureModel', targetId: 'c8d2f5a6-9e7b-4c3d-b2f1-a8e7c6b5d4f9', targetType: 'softwareComponent', relationshipType: 'tracesTo', confidence: 'high' },
    { id: 'd5c9e2f8-7b6a-4a5d-b1e6-c7f3d8e4b9a5', sourceId: 'f7b5ff9a-6b9e-4dba-b51d-e3c20a8e59f7', sourceType: 'requirement', targetId: 'b3e8d1c4-5f2a-4e7b-b6d9-c5f2e8d4a3b8', targetType: 'testCase', relationshipType: 'verifies', confidence: 'high' },
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
export async function scanRequirements(repositoryPath: string): Promise<{ scanned: number; total: number }> {
  try {
    const res = await fetch(`${API_ENDPOINT}/scan`, {
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
