import type { RequirementTraceLink } from '../types';

export interface TestCaseNexusMetadata {
  schema: 'test-doc/v1';
  metadata: {
    domain: string;
    version: string;
    source: string;
  };
}

export interface GherkinScenario {
  given: string;
  when: string;
  then: string;
}

export type TestCaseType = 'unit' | 'integration' | 'e2e' | 'performance' | 'security' | 'usability';
export type TestCasePriority = 'low' | 'medium' | 'high' | 'critical';

export interface TestCase {
  id: string;
  title: string;
  type: TestCaseType;
  priority: TestCasePriority;
  description?: string;
  traceLinks?: RequirementTraceLink[];
  scenario?: GherkinScenario;
  acceptanceCriteria?: string[];
  tags?: string[];
  automated?: boolean;
  steps?: string[];
  expectedResult?: string;
}

export interface TestSuite {
  id: string;
  name: string;
  description?: string;
  domain?: string;
  cases: TestCase[];
}

export interface TestDocument {
  nexus: TestCaseNexusMetadata;
  suites: TestSuite[];
}
