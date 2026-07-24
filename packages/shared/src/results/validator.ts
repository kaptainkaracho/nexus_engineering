import type { ResultsDocument, TestExecution } from './format';

const VALID_STATUSES = new Set(['passed', 'failed', 'skipped', 'error', 'flaky']);

/**
 * Validates the logical consistency of a TER document beyond structural schema.
 */
export function validateExecutions(doc: ResultsDocument): Map<string, string[]> {
  const errors = new Map<string, string[]>();

  if (!doc.executions || doc.executions.length === 0) return errors;

  const seenIds = new Set<string>();

  for (const exec of doc.executions) {
    const execErrors: string[] = [];

    if (seenIds.has(exec.id)) {
      execErrors.push(`Duplicate execution id '${exec.id}'`);
    }
    seenIds.add(exec.id);

    if (!VALID_STATUSES.has(exec.status)) {
      execErrors.push(`Invalid status '${exec.status}'`);
    }

    if (exec.durationMs !== undefined && (typeof exec.durationMs !== 'number' || exec.durationMs < 0)) {
      execErrors.push('durationMs must be a non-negative number');
    }

    if (exec.retries !== undefined && (!Number.isInteger(exec.retries) || exec.retries < 0)) {
      execErrors.push('retries must be a non-negative integer');
    }

    // Failed/error executions should include error details
    if ((exec.status === 'failed' || exec.status === 'error') && !exec.error?.message) {
      execErrors.push(`Execution '${exec.id}' status is ${exec.status} but has no error.message`);
    }

    // Timestamp sanity check
    if (exec.startedAt && exec.finishedAt) {
      const start = Date.parse(exec.startedAt);
      const end = Date.parse(exec.finishedAt);
      if (!Number.isNaN(start) && !Number.isNaN(end) && end < start) {
        execErrors.push('finishedAt precedes startedAt');
      }
    }

    if (execErrors.length > 0) {
      errors.set(exec.id, execErrors);
    }
  }

  return errors;
}

export interface ResultsDocumentValidationResult {
  valid: boolean;
  errors?: Map<string, string[]>;
}

/**
 * Complete validation pipeline for a Test Execution Results document.
 */
export async function validateResultsDocument(
  doc: ResultsDocument,
): Promise<ResultsDocumentValidationResult> {
  const errors = new Map<string, string[]>();

  try {
    if (!doc.nexus || !doc.executions) {
      return {
        valid: false,
        errors: new Map([['document', ['Invalid results document structure']]]),
      };
    }

    const execErrors = validateExecutions(doc);
    for (const [key, errorList] of execErrors.entries()) {
      errors.set(key, errorList);
    }

    return {
      valid: errors.size === 0,
      ...(errors.size > 0 && { errors }),
    };
  } catch (error) {
    return {
      valid: false,
      errors: new Map([['document', ['Failed to validate results document: ' + (error as Error).message]]]),
    };
  }
}

export type { TestExecution };
