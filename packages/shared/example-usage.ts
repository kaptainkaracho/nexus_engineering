// Example usage of unified engineering data model
import { Requirement, ArchitectureModel, SoftwareComponent, TestCase, TraceLink } from './types';

// Create a requirement
const userAuthRequirement: Requirement = {
  id: 'f7b5ff9a-6b9e-4dba-b51d-e3c20a8e59f7',
  version: '1.0.0',
  createdAt: new Date('2024-01-15T10:30:00Z'),
  updatedAt: new Date('2024-01-15T10:30:00Z'),
  source: 'doORS',
  type: 'functional',
  title: 'User Authentication System',
  description: 'Users must be able to securely authenticate with the system using email and password.',
  priority: 'high',
  status: 'approved',
  tags: ['security', 'authentication'],
};

// Create an architecture model showing the auth service structure
const authArchitecture: ArchitectureModel = {
  id: 'e4c3d2f8-7b6a-4b9d-a1e5-f9c2d8e7b6f5',
  version: '1.0.0',
  createdAt: new Date('2024-01-16T14:20:00Z'),
  updatedAt: new Date('2024-01-18T09:15:00Z'),
  source: 'modelio',
  type: 'internalBlockDiagram',
  name: 'Auth Service Internal Structure',
  description: 'Shows internal components of the authentication service.',
  elements: [
    {
      id: 'elem-001',
      type: 'block',
      name: 'AuthService',
      properties: { description: 'Main authentication service' }
    },
    {
      id: 'elem-002',
      type: 'part',
      name: 'TokenManager',
      properties: { responsibleFor: 'JWT token generation and validation' }
    },
    {
      id: 'elem-003',
      type: 'port',
      name: 'httpPort',
      properties: { protocol: 'HTTP/REST', port: 8080 }
    }
  ],
  relationships: [
    {
      sourceElementId: 'elem-001',
      targetElementId: 'elem-002',
      type: 'composition',
      description: 'AuthService contains TokenManager'
    },
    {
      sourceElementId: 'elem-001',
      targetElementId: 'elem-003',
      type: 'dependency',
      description: 'AuthService uses HTTP port for communication'
    }
  ]
};

// Create the software component implementing authentication
const authComponent: SoftwareComponent = {
  id: 'c8d2f5a6-9e7b-4c3d-b2f1-a8e7c6b5d4f9',
  version: '2.1.0',
  createdAt: new Date('2024-02-01T16:45:00Z'),
  updatedAt: new Date('2024-02-28T11:30:00Z'),
  source: 'gitlab',
  name: 'AuthService',
  type: 'service',
  description: 'Handles user authentication, authorization, and session management.',
  path: 'src/services/auth.service.ts',
  language: 'TypeScript',
  technologies: ['Fastify', 'JWT', '@better-auth/nestjs'],
  dependencies: [],
};

// Create test cases for the authentication requirement
const authTestCase: TestCase = {
  id: 'b3e8d1c4-5f2a-4e7b-b6d9-c5f2e8d4a3b8',
  version: '1.0.0',
  createdAt: new Date('2024-03-10T13:15:00Z'),
  updatedAt: new Date('2024-03-12T08:45:00Z'),
  source: 'jenkins',
  name: 'User Authentication Unit Tests',
  type: 'unit',
  description: 'Test authentication service methods in isolation.',
  testSteps: [
    {
      stepNumber: 1,
      action: 'Call AuthService.validateCredentials() with valid email and password'
    },
    {
      stepNumber: 2,
      action: 'Verify a JWT token is returned',
      expected: 'Token should be a valid JWT with user claims'
    },
    {
      stepNumber: 3,
      action: 'Call AuthService.validateCredentials() with invalid credentials'
    },
    {
      stepNumber: 4,
      action: 'Verify authentication fails and error is thrown',
      expected: 'Should throw UnauthorizedError with message "Invalid credentials"'
    }
  ],
  expectedResult: 'All test steps should pass, demonstrating correct authentication behavior.',
  status: 'completed',
  automationStatus: 'automated',
};

// Establish traceability links between artifacts
const requirementToArchTrace: TraceLink = {
  id: 'f1a4b2c8-d9e3-4f1a-b2c5-d6e9f7a3b8c4',
  version: '1.0.0',
  createdAt: new Date('2024-04-15T09:00:00Z'),
  updatedAt: new Date('2024-04-15T09:00:00Z'),
  source: 'nexus',
  sourceId: userAuthRequirement.id,
  sourceType: 'requirement',
  targetId: authArchitecture.id,
  targetType: 'architectureModel',
  relationshipType: 'satisfies',
  confidence: 'high',
  description: 'The architecture model shows how the authentication requirement is implemented.'
};

const archToComponentTrace: TraceLink = {
  id: 'e8b7d6f2-4c3a-4b9d-b1e5-f4c8d7e6b3f5',
  version: '1.0.0',
  createdAt: new Date('2024-04-15T09:15:00Z'),
  updatedAt: new Date('2024-04-15T09:15:00Z'),
  source: 'nexus',
  sourceId: authArchitecture.id,
  sourceType: 'architectureModel',
  targetId: authComponent.id,
  targetType: 'softwareComponent',
  relationshipType: 'tracesTo',
  confidence: 'high',
};

const requirementToTestTrace: TraceLink = {
  id: 'd5c9e2f8-7b6a-4a5d-b1e6-c7f3d8e4b9a5',
  version: '1.0.0',
  createdAt: new Date('2024-04-15T09:30:00Z'),
  updatedAt: new Date('2024-04-15T09:30:00Z'),
  source: 'nexus',
  sourceId: userAuthRequirement.id,
  sourceType: 'requirement',
  targetId: authTestCase.id,
  targetType: 'testCase',
  relationshipType: 'verifies',
  confidence: 'high',
};

console.log('Unified Engineering Data Model - Example Usage');
console.log(`\nRequirement: ${userAuthRequirement.title}`);
console.log(`Architecture Model: ${authArchitecture.name}`);
console.log(`Software Component: ${authComponent.name}`);
console.log(`Test Case: ${authTestCase.name}`);
console.log('\nTraceability established between all artifacts.');