// Unified Engineering Data Model interfaces
// Defines core types for Nexus Engineering System
export type IsoDateString = string;

export interface BaseEntity {
  id: string;
  version: string;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
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

export type RequirementSchema = any;

// Repository Scanner Types
export interface FileMetadata {
  filePath: string;
  relativePath: string;
  size: number;
  contentHash: string;
  contentType: 'text' | 'binary';
  detectedType?: 'requirement' | 'architectureModel' |
    'softwareComponent' | 'testCase' | 'traceLink';
}

export interface ScanOptions {
  ignorePatterns?: string[];
  maxFileSize?: number;
  minFileSize?: number;
  depthLimit?: number | null;
  includePatterns?: string[];
}

export interface DetectedArtifact {
  artifactType: 'requirement' | 'architecture' | 'adr' | 'spec';
  filePath: string;
  relativePath: string;
  fileName: string;
  detectedAt: IsoDateString;
}

export interface ScanSession {
  id: string;
  startedAt: IsoDateString;
  completedAt?: IsoDateString;
  repositoryPath: string;
  filesFound: number;
  filesSkipped: number;
  artifactsDetected: DetectedArtifact[];
  errors: Array<{ path: string; message: string }>;
  status: 'running' | 'completed' | 'failed';
}

export interface ScanResult {
  scanId: string;
  fileMetadata: FileMetadata[];
  scanReport: ScanReport;
  artifacts: DetectedArtifact[];
}

export interface ScanReport {
  filesFound: number;
  bytesScanned: number;
  scanTimeMs: number;
  errors: Array<{ path: string; error: Error }>;
}

export interface RepositoryReader {
  scan(rootPath: string, options?: ScanOptions): Promise<ScanResult>;
  getFileMetadata(filePath: string): Promise<FileMetadata | null>;
  streamFiles(patterns: string[], rootPath?: string): AsyncIterable<FileEntry>;
}

export interface ArchitectureDecision {
  id: string;
  title: string;
  date: IsoDateString;
  status: 'proposed' | 'accepted' | 'deprecated' | 'superseded';
  deciders: string[];
  context: string;
  decision: string;
  consequences: string[];
  supersededBy?: string;
}

export interface FileEntry {
  filePath: string;
  relativePath: string;
  contentType: 'text' | 'binary';
}