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
} from './ai-types';

export type {
  TestCaseNexusMetadata,
  GherkinScenario,
  TestCaseType,
  TestCasePriority,
  TestSuite,
  TestDocument,
  TestDocumentValidationResult,
} from './tests';

export type {
  ResultsNexusMetadata,
  ResultsDocument,
  ExecutionStatus,
  ResultsTraceLink,
  ExecutionError,
  ExecutionArtifact,
  TestExecution,
  ResultsLoadResult,
  ResultsDocumentValidationResult,
} from './results';

export type {
  FeatureNexusMetadata,
  FeatureDocument,
  Feature,
  FeatureStatus,
  UserStory,
  AcceptanceCriterion,
  FeatureTraceLink,
  FeatureLoadResult,
  FeatureDocumentValidationResult,
} from './features';

export {
  featureDocSchema,
  FeatureLoader,
  ValidatedFeatureLoader,
  featureLoader,
  validatedFeatureLoader,
  validateFeatures,
  validateFeatureDocument,
} from './features';