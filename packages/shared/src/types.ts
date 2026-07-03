// Unified Engineering Data Model interfaces
// Defines core types for Nexus Engineering System

export interface BaseEntity {
  id: string;
  version: string;
  createdAt: Date;
  updatedAt: Date;
  source: string;
}

export interface Requirement extends BaseEntity {
  type: 'functional' | 'non-functional' | 'system' | 'user';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'proposed' | 'approved' | 'rejected' | 'implemented' | 'verified';
  tags?: string[];
  traceLinks?: RequirementTraceLink[];
}

export interface RequirementTraceLink {
  type: 'verifies' | 'satisfies' | 'dependsOn' | 'tracesTo' | 'refines' | 'conflictsWith';
  target: RequirementReference;
  confidence?: 'high' | 'medium' | 'low';
  description?: string;
}

export interface RequirementReference {
  id: string;
  documentId: string;
}

export interface ArchitectureModel extends BaseEntity {
  type: 'blockDefinition' | 'internalBlockDiagram' | 'stateMachine' | 'sequenceDiagram' |
        'parametricDiagnostic' | 'requirementTraceabilityMatrix';
  name: string;
  description: string;
  elements: ArchitectureElement[];
  relationships?: ArchitectureRelationship[];
}

export interface ArchitectureElement {
  id: string;
  type: 'block' | 'part' | 'port' | 'connector' | 'valueProperty' |
        'unit' | 'constraint' | 'interfaceDefinition';
  name: string;
  properties?: Record<string, unknown>;
}

export interface ArchitectureRelationship {
  sourceElementId: string;
  targetElementId: string;
  type: 'composition' | 'aggregation' | 'dependency' | 'association' |
        'generalization' | 'realization';
  description?: string;
}

export interface SoftwareComponent extends BaseEntity {
  name: string;
  type: 'module' | 'class' | 'interface' | 'enum' | 'service' | 'component' |
        'microService' | 'library' | 'configuration';
  description: string;
  path?: string;
  language?: string;
  technologies?: string[];
  dependencies?: string[];
}

export interface TestCase extends BaseEntity {
  name: string;
  type: 'unit' | 'integration' | 'system' | 'acceptable' | 'performance' |
        'security' | 'usability';
  description: string;
  testSteps?: TestStep[];
  expectedResult: string;
  status: 'draft' | 'ready' | 'inProgress' | 'completed' | 'failed';
  automationStatus: 'manual' | 'automated' | 'partially-automated';
}

export interface TestStep {
  stepNumber: number;
  action: string;
  expected?: string;
}

export interface TraceLink extends BaseEntity {
  sourceId: string;
  sourceType: 'requirement' | 'architectureModel' | 'softwareComponent' |
               'testCase' | 'traceLink';
  targetId: string;
  targetType: 'requirement' | 'architectureModel' | 'softwareComponent' |
               'testCase' | 'traceLink';
  relationshipType: 'satisfies' | 'verifies' | 'tracesTo' | 'dependsOn' |
                     'refines' | 'conflictsWith';
  confidence: 'high' | 'medium' | 'low';
  description?: string;
}


// JSON Schema types for validation
export type RequirementSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#';
  type: 'object';
  properties: {
    id: { type: 'string', format: 'uuid' };
    version: { type: 'string' };
    createdAt: { type: 'string', format: 'date-time' };
    updatedAt: { type: 'string', format: 'date-time' };
    source: { type: 'string' };
    type: { type: 'string', enum: ['functional', 'non-functional', 'system', 'user'] };
    title: { type: 'string' };
    description: { type: 'string' };
    priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] };
    status: { type: 'string', enum: ['proposed', 'approved', 'rejected', 'implemented', 'verified'] };
    tags: { type: 'array', items: { type: 'string' } };
  };
  required: ['id', 'version', 'createdAt', 'updatedAt', 'source', 'type', 'title', 
            'description', 'priority', 'status'];
};

export type ArchitectureModelSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#';
  type: 'object';
  properties: {
    id: { type: 'string', format: 'uuid' };
    version: { type: 'string' };
    createdAt: { type: 'string', format: 'date-time' };
    updatedAt: { type: 'string', format: 'date-time' };
    source: { type: 'string' };
    type: { type: 'string', enum: ['blockDefinition', 'internalBlockDiagram', 'stateMachine', 
                                   'sequenceDiagram', 'parametricDiagnostic', 'requirementTraceabilityMatrix'] };
    name: { type: 'string' };
    description: { type: 'string' };
    elements: { type: 'array', items: { $ref: '#/definitions/ArchitectureElement' } };
    relationships: { type: 'array', items: { $ref: '#/definitions/ArchitectureRelationship' }, nullable: true };
  };
  required: ['id', 'version', 'createdAt', 'updatedAt', 'source', 'type', 'name', 
            'description', 'elements'];
  definitions: {
    ArchitectureElement: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        type: { type: 'string', enum: ['block', 'part', 'port', 'connector', 
                                       'valueProperty', 'unit', 'constraint', 'interfaceDefinition'] },
        name: { type: 'string' },
        properties: { type: 'object', additionalProperties: true }
      },
      required: ['id', 'type', 'name']
    };
    ArchitectureRelationship: {
      type: 'object',
      properties: {
        sourceElementId: { type: 'string' },
        targetElementId: { type: 'string' },
        type: { type: 'string', enum: ['composition', 'aggregation', 'dependency', 
                                       'association', 'generalization', 'realization'] },
        description: { type: 'string', nullable: true }
      },
      required: ['sourceElementId', 'targetElementId', 'type']
    }
  };
};

export type SoftwareComponentSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#';
  type: 'object';
  properties: {
    id: { type: 'string', format: 'uuid' };
    version: { type: 'string' };
    createdAt: { type: 'string', format: 'date-time' };
    updatedAt: { type: 'string', format: 'date-time' };
    source: { type: 'string' };
    name: { type: 'string' };
    type: { type: 'string', enum: ['module', 'class', 'interface', 'enum', 'service', 
                                   'component', 'microService', 'library', 'configuration'] };
    description: { type: 'string' };
    path: { type: 'string', nullable: true };
    language: { type: 'string', nullable: true };
    technologies: { type: 'array', items: { type: 'string' }, nullable: true };
    dependencies: { type: 'array', items: { type: 'string' }, nullable: true }
  };
  required: ['id', 'version', 'createdAt', 'updatedAt', 'source', 'name', 'type', 
            'description'];
};

export type TestCaseSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#';
  type: 'object';
  properties: {
    id: { type: 'string', format: 'uuid' };
    version: { type: 'string' };
    createdAt: { type: 'string', format: 'date-time' };
    updatedAt: { type: 'string', format: 'date-time' };
    source: { type: 'string' };
    name: { type: 'string' };
    type: { type: 'string', enum: ['unit', 'integration', 'system', 'acceptable', 
                                   'performance', 'security', 'usability'] };
    description: { type: 'string' };
    testSteps: { type: 'array', items: { $ref: '#/definitions/TestStep' }, nullable: true };
    expectedResult: { type: 'string' };
    status: { type: 'string', enum: ['draft', 'ready', 'inProgress', 'completed', 'failed'] };
    automationStatus: { type: 'string', enum: ['manual', 'automated', 'partially-automated'] };
  };
  required: ['id', 'version', 'createdAt', 'updatedAt', 'source', 'name', 'type', 
            'description', 'expectedResult', 'status', 'automationStatus'];
  definitions: {
    TestStep: {
      type: 'object',
      properties: {
        stepNumber: { type: 'number', minimum: 1 },
        action: { type: 'string' },
        expected: { type: 'string', nullable: true }
      },
      required: ['stepNumber', 'action']
    }
  };
};

export type TraceLinkSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#';
  type: 'object';
  properties: {
    id: { type: 'string', format: 'uuid' };
    version: { type: 'string' };
    createdAt: { type: 'string', format: 'date-time' };
    updatedAt: { type: 'string', format: 'date-time' };
    source: { type: 'string' };
    sourceId: { type: 'string' };
    sourceType: { type: 'string', enum: ['requirement', 'architectureModel', 
                                         'softwareComponent', 'testCase', 'traceLink'] };
    targetId: { type: 'string' };
    targetType: { type: 'string', enum: ['requirement', 'architectureModel', 
                                         'softwareComponent', 'testCase', 'traceLink'] };
    relationshipType: { type: 'string', enum: ['satisfies', 'verifies', 'tracesTo', 
                                               'dependsOn', 'refines', 'conflictsWith'] };
    confidence: { type: 'string', enum: ['high', 'medium', 'low'] };
    description: { type: 'string', nullable: true }
  };
  required: ['id', 'version', 'createdAt', 'updatedAt', 'source', 'sourceId', 
            'sourceType', 'targetId', 'targetType', 'relationshipType', 'confidence'];
};