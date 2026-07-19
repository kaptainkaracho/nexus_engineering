/**
 * Metadata for Nexus Test Execution Results documents
 */
export interface ResultsNexusMetadata {
  schema: 'results-doc/v1';
  metadata: {
    domain: string;
    version: string;
    source: string;
    runId?: string;
    ci?: {
      provider?: string;
      pipelineId?: string;
      jobId?: string;
      commit?: string;
      branch?: string;
    };
  };
}

/**
 * Allowed execution outcome statuses
 */
export type ExecutionStatus = 'passed' | 'failed' | 'skipped' | 'error' | 'flaky';

/**
 * A link from an execution back to the requirement/test definition it verifies
 */
export interface ResultsTraceLink {
  type: 'verifies' | 'satisfies' | 'dependsOn' | 'tracesTo' | 'refines' | 'conflictsWith';
  target: { id: string; documentId: string };
  confidence?: 'high' | 'medium' | 'low';
  description?: string;
}

/**
 * An error captured for a failed/error execution
 */
export interface ExecutionError {
  message: string;
  type?: string;
  stack?: string;
}

/**
 * An artifact (screenshot, trace, log) produced by an execution
 */
export interface ExecutionArtifact {
  type: string;
  path?: string;
  url?: string;
}

/**
 * A single test execution result
 */
export interface TestExecution {
  id: string;
  suiteId: string;
  caseId: string;
  status: ExecutionStatus;
  durationMs?: number;
  startedAt?: string;
  finishedAt?: string;
  retries?: number;
  error?: ExecutionError;
  artifacts?: ExecutionArtifact[];
  traceLinks?: ResultsTraceLink[];
}

/**
 * Complete Nexus Test Execution Results document structure
 */
export interface ResultsDocument {
  nexus: ResultsNexusMetadata;
  executions: TestExecution[];
}
