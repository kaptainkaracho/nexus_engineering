export {
  colors,
  typography,
  spacing,
  cn,
  Button,
  Input,
  Card,
  Container,
  Stack,
  Grid,
  Nav,
  Badge,
  Alert,
  RadioGroup,
} from './design-system';

export type {
  ButtonProps,
  InputProps,
  CardProps,
  ContainerProps,
  StackProps,
  GridProps,
  NavProps,
  NavItem,
  BadgeProps,
  BadgeVariant,
  AlertProps,
  AlertVariant,
  RadioOption,
  RadioGroupProps,
} from './design-system';

export type {
  BaseEntity,
  Requirement,
  ArchitectureModel,
  SoftwareComponent,
  TestCase,
  TraceLink,
  ArchitectureElement,
  ArchitectureRelationship,
  TestStep
} from './types';

export type {
  NexusMetadata,
  NexusDocument
} from './requirements/format';

export type {
  RequirementSchema
} from './requirements/schema';

export type {
  DocumentOperation,
  RepositoryDocumentOperation
} from './operations';

export type {
  DocumentType
} from './operations';

export type {
  Document
} from './operations';

export type {
  ArchitectureDecision,
  ArchitectureDecisionStatus,
  FileMetadata,
  ScanOptions,
  ScanResult,
  ScanReport,
  RepositoryReader,
  FileEntry,
  DetectedArtifact,
  ScanSession,
  SpecStatus,
  SpecPriority,
  SpecRequirementStatus,
  SpecReferenceType,
  SpecReference,
  SpecRequirement,
  Specification,
  User,
  Role,
  Permission,
  RefreshToken,
  JwtPayload,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  RefreshRequest,
  Organization,
  Team,
  OrganizationMember,
  TeamMember,
  ArtifactRegistry,
  RegistryArtifact,
  RegistryCredentials,
  RegistryProviderType,
  AuditLog,
  AuditLogFilter,
  AuditAction,
  AuditLogRetentionConfig,
  MultiScanSession,
  MultiRepoScanResult,
  MultiRepoScanOptions,
} from './types';

export type {
  CoverageGap,
  CoverageGapReport,
  ImpactScope,
  AffectedArtifact,
  ImpactAnalysis,
  LLMConfig,
  LLMMessage,
  LLMCompletionRequest,
  LLMCompletionResponse,
  TraceabilityQuery,
  TraceabilityAxis,
  AxisCoverage,
  CrossArtifactGap,
  CrossArtifactGapType,
  DomainCoverage,
  CoverageAnalysisReport,
  AffectedArtifactV2,
  ImpactGraphNode,
  ImpactGraphEdge,
  ImpactGraph,
  ImpactChain,
  ImpactAnalysisV2,
  TraceabilityReport,
  StructuredLLMResponse,
  RiskLevel,
  ImpactReportArtifact,
  ImpactReportRecommendation,
  ImpactReportSummary,
  ImpactReportMetadata,
  ImpactReport,
  ImpactReportInput,
  RecommendationType,
  RecommendationSeverity,
  AutoFixSuggestion,
  TraceRecommendation,
  RecommendationQuery,
  RecommendationResponse,
} from './ai-types';

export { V_MODEL_AXES, CONFIDENCE_SCORE } from './ai-types';

export type {
  TestCaseNexusMetadata,
  GherkinScenario,
  TestCaseType,
  TestCasePriority,
  TestSuite,
  TestDocument,
} from './tests/format';
export type { TestDocumentValidationResult } from './tests/validator';

export type {
  ResultsNexusMetadata,
  ResultsDocument,
  ExecutionStatus,
  ResultsTraceLink,
  ExecutionError,
  ExecutionArtifact,
  TestExecution,
} from './results/format';
export type { ResultsDocumentValidationResult } from './results/validator';

export type { FeatureLoadResult } from './features/format';
export type { ResultsLoadResult } from './results/format';
export type { TestLoadResult } from './tests/format';

export type {
  FeatureNexusMetadata,
  FeatureDocument,
  Feature,
  FeatureStatus,
  UserStory,
  AcceptanceCriterion,
  FeatureTraceLink,
} from './features/format';

// FeatureLoader and related runtime exports omitted — they import Node.js 'fs'
// and are server-only. Import directly from '@nexus-engineering/shared/features'
// in server contexts if needed.