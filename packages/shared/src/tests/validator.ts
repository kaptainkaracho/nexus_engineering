import type { TestDocument, TestCase } from './format';

export function validateTestTraceLinks(testDoc: TestDocument): Map<string, string[]> {
  const errors = new Map<string, string[]>();

  if (!testDoc.suites || testDoc.suites.length === 0) return errors;

  const allCaseIds = new Set<string>();
  for (const suite of testDoc.suites) {
    for (const tc of suite.cases) {
      if (tc.id) {
        allCaseIds.add(tc.id);
      }
    }
  }

  for (const suite of testDoc.suites) {
    for (const tc of suite.cases) {
      const caseErrors: string[] = [];

      if (tc.traceLinks && Array.isArray(tc.traceLinks)) {
        for (let i = 0; i < tc.traceLinks.length; i++) {
          const link = tc.traceLinks[i];

          if (!link.type || !link.target?.id) {
            caseErrors.push(`traceLinks[${i}]: Invalid trace link format`);
            continue;
          }

          if (!link.target.documentId) {
            caseErrors.push(`traceLinks[${i}]: Missing documentId in target reference`);
          }
        }
      }

      if (caseErrors.length > 0) {
        errors.set(tc.id, caseErrors);
      }
    }
  }

  return errors;
}

export interface TestDocumentValidationResult {
  valid: boolean;
  errors?: Map<string, string[]>;
}

export async function validateTestDocument(
  testDoc: TestDocument,
  allTestDocs?: TestDocument[],
): Promise<TestDocumentValidationResult> {
  const errors = new Map<string, string[]>();

  try {
    if (!testDoc.nexus || !testDoc.suites) {
      return {
        valid: false,
        errors: new Map([['document', ['Invalid test document structure']]]),
      };
    }

    if (testDoc.nexus.schema !== 'test-doc/v1') {
      errors.set(
        'document',
        [`Unknown schema version: ${testDoc.nexus.schema}. Expected: test-doc/v1`],
      );
    }

    for (const suite of testDoc.suites) {
      if (!suite.id || !suite.name || !suite.cases) {
        errors.set(suite.id || 'unknown', ['Test suite missing required fields (id, name, cases)']);
        continue;
      }

      for (const tc of suite.cases) {
        if (!tc.id || !tc.title || !tc.type || !tc.priority) {
          errors.set(tc.id || 'unknown', ['Test case missing required fields (id, title, type, priority)']);
        }
      }
    }

    const traceLinkErrors = validateTestTraceLinks(testDoc);
    for (const [key, errorList] of traceLinkErrors.entries()) {
      const existing = errors.get(key) || [];
      errors.set(key, [...existing, ...errorList]);
    }

    return {
      valid: errors.size === 0,
      ...(errors.size > 0 && { errors }),
    };
  } catch (error) {
    return {
      valid: false,
      errors: new Map([['document', [(error as Error).message]]]),
    };
  }
}
