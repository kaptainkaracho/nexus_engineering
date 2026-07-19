/**
 * JSON Schema for validating Test Execution Results documents (.ter.yaml files).
 *
 * TER (Test Execution Results as Code) records the outcome of running test
 * cases/suites. Unlike `test-doc/v1` (definitions), this schema captures the
 * *execution* evidence: pass/fail, duration, retries, errors and artifacts.
 */
export const resultsDocSchema: any = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  properties: {
    nexus: {
      type: 'object',
      properties: {
        schema: {
          type: 'string',
          enum: ['results-doc/v1'],
        },
        metadata: {
          type: 'object',
          properties: {
            domain: { type: 'string' },
            version: { type: 'string' },
            source: { type: 'string' },
            runId: { type: 'string' },
            ci: {
              type: 'object',
              properties: {
                provider: { type: 'string' },
                pipelineId: { type: 'string' },
                jobId: { type: 'string' },
                commit: { type: 'string' },
                branch: { type: 'string' },
              },
            },
          },
          required: ['domain', 'version', 'source'],
        },
      },
      required: ['schema', 'metadata'],
    },
    executions: {
      type: 'array',
      items: {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          id: { type: 'string' },
          suiteId: { type: 'string' },
          caseId: { type: 'string' },
          status: {
            type: 'string',
            enum: ['passed', 'failed', 'skipped', 'error', 'flaky'],
          },
          durationMs: { type: 'number', minimum: 0 },
          startedAt: { type: 'string' },
          finishedAt: { type: 'string' },
          retries: { type: 'integer', minimum: 0 },
          error: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              type: { type: 'string' },
              stack: { type: 'string' },
            },
          },
          artifacts: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                path: { type: 'string' },
                url: { type: 'string' },
              },
              required: ['type'],
            },
          },
          traceLinks: {
            type: 'array',
            items: {
              $schema: 'http://json-schema.org/draft-07/schema#',
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  enum: ['verifies', 'satisfies', 'dependsOn', 'tracesTo', 'refines', 'conflictsWith'],
                },
                target: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    documentId: { type: 'string' },
                  },
                  required: ['id', 'documentId'],
                },
                confidence: {
                  type: 'string',
                  enum: ['high', 'medium', 'low'],
                },
                description: { type: 'string' },
              },
              required: ['type', 'target'],
            },
          },
        },
        required: ['id', 'suiteId', 'caseId', 'status'],
      },
    },
  },
  required: ['nexus', 'executions'],
};

/**
 * Re-export the individual results schema type for reuse
 */
export type { ResultsDocument } from './format';
