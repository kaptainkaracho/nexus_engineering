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
  detectedType?: 'requirement' | 'architectureModel' | 'softwareComponent' |
    'testCase' | 'traceLink' | 'spec' | 'adr';
}

export interface ScanOptions {
  ignorePatterns?: string[];
  maxFileSize?: number;
  minFileSize?: number;
  depthLimit?: number | null;
  includePatterns?: string[];
  /**
   * Compute a SHA-256 content hash for every scanned file.
   * Expensive for large repositories (reads every byte) — defaults to false.
   * Required only by callers doing change detection / dedupe.
   */
  computeHashes?: boolean;
  /**
   * Build the full hierarchical repository tree in the scan output.
   * The tree is O(files) and heavy to serialize for large repos — defaults to false.
   * Request it explicitly when the UI needs the tree in a single response.
   */
  includeTree?: boolean;
}

/** Standard pagination envelope returned by list endpoints. */
export interface PaginationMeta {
  limit: number;
  offset: number;
  total: number;
  hasMore: boolean;
}

/** Generic paginated payload. */
export interface Paginated<T> {
  items: T[];
  pagination: PaginationMeta;
}

/** Node in the hierarchical repository tree produced by a scan. */
export interface RepositoryTreeNode {
  id: string;
  path: string;
  name: string;
  type: 'directory' | 'file';
  size?: number;
  extension?: string;
  isBinary?: boolean;
  children?: RepositoryTreeNode[];
}

/** Hierarchical representation of a repository, used for UI tree views. */
export interface RepositoryTree {
  root: RepositoryTreeNode;
  nodesByPath: Record<string, RepositoryTreeNode>;
}

/** Paginated scan output returned by GET /api/scan. */
export interface ScanOutput {
  scanId: string;
  fileMetadata: FileMetadata[];
  totalFiles: number;
  artifacts: DetectedArtifact[];
  totalArtifacts: number;
  scanReport: ScanReport;
  tree?: RepositoryTree;
  pagination: PaginationMeta;
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

export type ArchitectureDecisionStatus = 'proposed' | 'accepted' | 'deprecated' | 'superseded';

export interface ArchitectureDecision {
  id: string;
  title: string;
  date: IsoDateString;
  status: ArchitectureDecisionStatus;
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

// Specification Documents (.spec.yaml)
export type SpecStatus = 'draft' | 'active' | 'deprecated';
export type SpecPriority = 'P0' | 'P1' | 'P2' | 'P3';
export type SpecRequirementStatus = 'proposed' | 'approved' | 'implemented' | 'verified';
export type SpecReferenceType = 'req' | 'arch' | 'test';

export interface SpecReference {
  type: SpecReferenceType;
  id: string;
}

export interface SpecRequirement {
  id: string;
  title: string;
  priority: SpecPriority;
  status: SpecRequirementStatus;
  references: SpecReference[];
}

export interface Specification {
  title: string;
  version: string;
  status: SpecStatus;
  requirements: SpecRequirement[];
}

// --- Auth & RBAC Types ---

export interface User {
  id: string
  email: string
  displayName: string | null
  roleId: string
  isActive: boolean
  emailVerified: boolean
  createdAt: string
  updatedAt: string
}

export interface UserWithPassword extends User {
  passwordHash: string
}

export interface Role {
  id: string
  name: string
  description: string | null
  createdAt: string
}

export interface Permission {
  id: string
  name: string
  description: string | null
  resource: string
  action: string
}

export interface RefreshToken {
  id: string
  userId: string
  tokenHash: string
  expiresAt: string
  createdAt: string
  revoked: boolean
}

export interface JwtPayload {
  sub: string
  email: string
  role: string
  permissions: string[]
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  displayName?: string
}

export interface AuthResponse {
  user: Omit<User, 'passwordHash'>
  accessToken: string
  refreshToken: string
}

export interface RefreshRequest {
  refreshToken: string
}