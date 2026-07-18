// Sample engineering artefacts for artifact viewer demonstration
import { Requirement, ArchitectureModel, SoftwareComponent, TestCase, TraceLink } from '@nexus-engineering/shared';

export const sampleRequirements: Requirement[] = [
  {
    id: 'f7b5ff9a-6b9e-4dba-b51d-e3c20a8e59f7',
    version: '1.0.0',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    source: 'doORS',
    type: 'functional',
    title: 'User Authentication System',
    description: 'Users must be able to securely authenticate with the system using email and password.',
    priority: 'high',
    status: 'approved',
    tags: ['security', 'authentication'],
  },
  {
    id: 'a2c4d6e8-1f3a-4b5c-9d7e-2f8a3b6c1d4e',
    version: '1.0.0',
    createdAt: '2024-02-01T09:00:00Z',
    updatedAt: '2024-02-01T09:00:00Z',
    source: 'jira',
    type: 'non-functional',
    title: 'Response Time Requirement',
    description: 'All API endpoints must respond within 200ms at p95 under normal load.',
    priority: 'critical',
    status: 'proposed',
    tags: ['performance'],
  },
];

export const sampleArchitectures: ArchitectureModel[] = [
  {
    id: 'e4c3d2f8-7b6a-4b9d-a1e5-f9c2d8e7b6f5',
    version: '1.0.0',
    createdAt: '2024-01-16T14:20:00Z',
    updatedAt: '2024-01-18T09:15:00Z',
    source: 'modelio',
    type: 'internalBlockDiagram',
    name: 'Auth Service Internal Structure',
    description: 'Shows internal components of the authentication service.',
    elements: [
      { id: 'elem-001', type: 'block' as const, name: 'AuthService', properties: { description: 'Main authentication service' } },
      { id: 'elem-002', type: 'part' as const, name: 'TokenManager', properties: { responsibleFor: 'JWT token generation and validation' } },
      { id: 'elem-003', type: 'port' as const, name: 'httpPort', properties: { protocol: 'HTTP/REST', port: 8080 } },
    ],
    relationships: [
      { sourceElementId: 'elem-001', targetElementId: 'elem-002', type: 'composition' as const, description: 'AuthService contains TokenManager' },
      { sourceElementId: 'elem-001', targetElementId: 'elem-003', type: 'dependency' as const, description: 'AuthService uses HTTP port for communication' },
    ],
  },
];

export const sampleComponents: SoftwareComponent[] = [
  {
    id: 'c8d2f5a6-9e7b-4c3d-b2f1-a8e7c6b5d4f9',
    version: '2.1.0',
    createdAt: '2024-02-01T16:45:00Z',
    updatedAt: '2024-02-28T11:30:00Z',
    source: 'gitlab',
    name: 'AuthService',
    type: 'service' as const,
    description: 'Handles user authentication, authorization, and session management.',
    path: 'src/services/auth.service.ts',
    language: 'TypeScript',
    technologies: ['Fastify', 'JWT', '@better-auth/nestjs'],
    dependencies: [],
  },
];

export const sampleTestCases: TestCase[] = [
  {
    id: 'b3e8d1c4-5f2a-4e7b-b6d9-c5f2e8d4a3b8',
    version: '1.0.0',
    createdAt: '2024-03-10T13:15:00Z',
    updatedAt: '2024-03-12T08:45:00Z',
    source: 'jenkins',
    name: 'User Authentication Unit Tests',
    type: 'unit' as const,
    description: 'Test authentication service methods in isolation.',
    testSteps: [
      { stepNumber: 1, action: 'Call AuthService.validateCredentials() with valid email and password' },
      { stepNumber: 2, action: 'Verify a JWT token is returned', expected: 'Token should be a valid JWT with user claims' },
      { stepNumber: 3, action: 'Call AuthService.validateCredentials() with invalid credentials' },
      { stepNumber: 4, action: 'Verify authentication fails and error is thrown', expected: 'Should throw UnauthorizedError with message "Invalid credentials"' },
    ],
    expectedResult: 'All test steps should pass, demonstrating correct authentication behavior.',
    status: 'completed' as const,
    automationStatus: 'automated' as const,
  },
];

export const sampleTraces: TraceLink[] = [
  {
    id: 'f1a4b2c8-d9e3-4f1a-b2c5-d6e9f7a3b8c4',
    version: '1.0.0',
    createdAt: '2024-04-15T09:00:00Z',
    updatedAt: '2024-04-15T09:00:00Z',
    source: 'nexus',
    sourceId: sampleRequirements[0].id,
    sourceType: 'requirement' as const,
    targetId: sampleArchitectures[0].id,
    targetType: 'architectureModel' as const,
    relationshipType: 'satisfies' as const,
    confidence: 'high' as const,
    description: 'The architecture model shows how the authentication requirement is implemented.',
  },
  {
    id: 'e8b7d6f2-4c3a-4b9d-b1e5-f4c8d7e6b3f5',
    version: '1.0.0',
    createdAt: '2024-04-15T09:15:00Z',
    updatedAt: '2024-04-15T09:15:00Z',
    source: 'nexus',
    sourceId: sampleArchitectures[0].id,
    sourceType: 'architectureModel' as const,
    targetId: sampleComponents[0].id,
    targetType: 'softwareComponent' as const,
    relationshipType: 'tracesTo' as const,
    confidence: 'high' as const,
  },
  {
    id: 'd5c9e2f8-7b6a-4a5d-b1e6-c7f3d8e4b9a5',
    version: '1.0.0',
    createdAt: '2024-04-15T09:30:00Z',
    updatedAt: '2024-04-15T09:30:00Z',
    source: 'nexus',
    sourceId: sampleRequirements[0].id,
    sourceType: 'requirement' as const,
    targetId: sampleTestCases[0].id,
    targetType: 'testCase' as const,
    relationshipType: 'verifies' as const,
    confidence: 'high' as const,
  },
];

export type ArtefactTab = 'requirements' | 'architecture' | 'components' | 'testcases' | 'traceability';
export type ArtefactDetailKind = 'requirement' | 'architecture' | 'component' | 'testCase';
