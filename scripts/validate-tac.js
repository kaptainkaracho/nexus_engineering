#!/usr/bin/env node
import { promises as fs } from 'fs';
import path from 'path';
import { glob } from 'glob';
import yaml from 'js-yaml';

const VALID_TYPES = new Set(['unit', 'integration', 'e2e', 'performance', 'security', 'usability']);
const VALID_PRIORITIES = new Set(['low', 'medium', 'high', 'critical']);
const VALID_TRACE_LINK_TYPES = new Set(['verifies', 'satisfies', 'dependsOn', 'tracesTo', 'refines', 'conflictsWith']);
const VALID_CONFIDENCES = new Set(['high', 'medium', 'low']);
const REQ_ID_PATTERN = /^REQ-[A-Z]{3,5}-\d{3}$/;
const TC_ID_PATTERN = /^[A-Z]{2,5}-\d{3}$/;
const SUITE_ID_PATTERN = /^[a-z]+(?:-[a-z]+)*$/;

const CASE_REQUIRED = ['id', 'title', 'type', 'priority'];
const SUITE_REQUIRED = ['id', 'name', 'cases'];

async function findTestFiles(rootDir) {
  const matches = await glob('**/*.test.yaml', {
    cwd: rootDir,
    absolute: true,
    nodir: true,
  });
  return matches.sort().filter((f) => !f.includes('/templates/'));
}

function validateTestCase(tc, suiteId, filePath, index) {
  const errors = [];
  const prefix = `suite[${suiteId}].cases[${index}] (${tc.id || 'no-id'})`;

  for (const field of CASE_REQUIRED) {
    if (tc[field] === undefined || tc[field] === null || tc[field] === '') {
      errors.push(`${prefix}: Missing required field "${field}"`);
    }
  }

  if (tc.id && !TC_ID_PATTERN.test(tc.id)) {
    errors.push(`${prefix}: Invalid ID format "${tc.id}" — expected {PREFIX}-{NUMBER} (e.g., REG-001, LOG-001)`);
  }

  if (tc.type && !VALID_TYPES.has(tc.type)) {
    errors.push(`${prefix}: Invalid type "${tc.type}" — must be one of: ${[...VALID_TYPES].join(', ')}`);
  }

  if (tc.priority && !VALID_PRIORITIES.has(tc.priority)) {
    errors.push(`${prefix}: Invalid priority "${tc.priority}" — must be one of: ${[...VALID_PRIORITIES].join(', ')}`);
  }

  if (tc.traceLinks && Array.isArray(tc.traceLinks)) {
    for (let li = 0; li < tc.traceLinks.length; li++) {
      const link = tc.traceLinks[li];

      if (!link.type || !VALID_TRACE_LINK_TYPES.has(link.type)) {
        errors.push(`${prefix}.traceLinks[${li}]: Invalid type "${link.type}"`);
      }

      if (!link.target || !link.target.id) {
        errors.push(`${prefix}.traceLinks[${li}]: Missing target.id`);
      } else if (!REQ_ID_PATTERN.test(link.target.id) && !TC_ID_PATTERN.test(link.target.id)) {
        errors.push(`${prefix}.traceLinks[${li}]: Invalid target.id "${link.target.id}"`);
      }

      if (!link.target.documentId) {
        errors.push(`${prefix}.traceLinks[${li}]: Missing target.documentId`);
      }

      if (link.confidence && !VALID_CONFIDENCES.has(link.confidence)) {
        errors.push(`${prefix}.traceLinks[${li}]: Invalid confidence "${link.confidence}"`);
      }
    }
  }

  if (tc.scenario) {
    if (!tc.scenario.given || !tc.scenario.when || !tc.scenario.then) {
      errors.push(`${prefix}: scenario missing required fields (given, when, then)`);
    }
  }

  return errors;
}

function validateTestSuite(suite, filePath, index) {
  const errors = [];
  const prefix = `suite[${index}] (${suite.id || 'no-id'})`;

  for (const field of SUITE_REQUIRED) {
    if (suite[field] === undefined || suite[field] === null) {
      errors.push(`${prefix}: Missing required field "${field}"`);
    }
  }

  if (suite.cases && Array.isArray(suite.cases)) {
    for (let ci = 0; ci < suite.cases.length; ci++) {
      const caseErrors = validateTestCase(suite.cases[ci], suite.id || `index-${index}`, filePath, ci);
      errors.push(...caseErrors);
    }
  } else {
    errors.push(`${prefix}: "cases" must be a non-empty array`);
  }

  return errors;
}

async function validateTestFile(filePath) {
  const errors = [];
  let doc;

  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    doc = yaml.load(raw);
  } catch (e) {
    return [`${filePath}: Failed to parse YAML — ${e.message}`];
  }

  if (!doc || typeof doc !== 'object') {
    return [`${filePath}: Document is empty or invalid`];
  }

  if (!doc.nexus || !doc.nexus.schema) {
    errors.push(`${filePath}: Missing nexus.schema field`);
  } else if (doc.nexus.schema !== 'test-doc/v1') {
    errors.push(`${filePath}: Invalid schema "${doc.nexus.schema}" — expected "test-doc/v1"`);
  }

  if (!doc.nexus?.metadata?.domain) {
    errors.push(`${filePath}: Missing nexus.metadata.domain`);
  }

  if (!doc.nexus?.metadata?.version) {
    errors.push(`${filePath}: Missing nexus.metadata.version`);
  }

  if (!doc.suites) {
    errors.push(`${filePath}: Missing "suites" field`);
  } else if (!Array.isArray(doc.suites) || doc.suites.length === 0) {
    errors.push(`${filePath}: "suites" must be a non-empty array`);
  } else {
    for (let si = 0; si < doc.suites.length; si++) {
      const suiteErrors = validateTestSuite(doc.suites[si], filePath, si);
      errors.push(...suiteErrors);
    }
  }

  const fileErrors = errors.map((e) => `${filePath}: ${e}`);
  return fileErrors;
}

async function main() {
  const repoRoot = process.argv[2] || process.cwd();
  const testFiles = await findTestFiles(repoRoot);

  if (testFiles.length === 0) {
    console.log('No .test.yaml files found.');
    process.exit(0);
  }

  console.log(`Found ${testFiles.length} TAC document(s)`);

  const allErrors = [];

  for (const filePath of testFiles) {
    const errors = await validateTestFile(filePath);
    allErrors.push(...errors);

    if (errors.length > 0) {
      console.log(`\n${filePath}: ${errors.length} error(s)`);
      for (const err of errors) {
        console.log(`  ${err}`);
      }
    }
  }

  if (allErrors.length > 0) {
    console.log(`\nTAC validation FAILED with ${allErrors.length} error(s)`);
    process.exit(1);
  }

  console.log('\nTAC validation PASSED');
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal TAC validation error:', err.message);
  process.exit(1);
});
