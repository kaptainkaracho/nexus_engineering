#!/usr/bin/env node
/**
 * CI integration hook: Playwright JSON report -> TER (results-doc/v1) YAML.
 *
 * Playwright can emit a JSON report with:
 *   npx playwright test --reporter=json --output=playwright-report
 * (or configure in playwright.config.ts). Then convert:
 *   node scripts/ter-from-playwright.mjs --input playwright-report/results.json --out results/e2e.ter.yaml
 */
import * as yaml from 'js-yaml'
import * as fs from 'fs'
import * as path from 'path'

const STATUS_MAP = {
  passed: 'passed',
  failed: 'failed',
  skipped: 'skipped',
  flaky: 'flaky',
  timedOut: 'error',
}

function buildExecutions(suites, acc = []) {
  for (const suite of suites || []) {
    for (const spec of suite.specs || []) {
      for (const test of spec.tests || []) {
        const execResult = test.results?.[test.results.length - 1]
        const outcome = execResult?.status || 'skipped'
        const status = STATUS_MAP[outcome] || 'error'
        const durationMs = execResult?.duration ?? 0
        const exec = {
          id: `exec-${(suite.title || 'e2e')}-${spec.title}`.replace(/[^a-zA-Z0-9-]/g, '_'),
          suiteId: suite.title || 'playwright',
          caseId: spec.title,
          status,
          durationMs: Math.round(durationMs),
          retries: (test.results?.length || 1) - 1,
        }
        if (status === 'failed' || status === 'error') {
          const err = execResult?.error
          exec.error = {
            message: err?.message || 'Playwright test failed',
            stack: err?.stack,
          }
          if (execResult?.attachments?.length) {
            exec.artifacts = execResult.attachments.map((a) => ({ type: a.name || 'attachment', path: a.path }))
          }
        }
        acc.push(exec)
      }
    }
    if (suite.suites) buildExecutions(suite.suites, acc)
  }
  return acc
}

function main() {
  const args = process.argv.slice(2)
  const get = (k) => {
    const idx = args.indexOf(k)
    return idx >= 0 ? args[idx + 1] : undefined
  }
  const input = get('--input')
  const out = get('--out') || 'results/e2e.ter.yaml'
  if (!input) {
    console.error('Usage: node ter-from-playwright.mjs --input results.json [--out results/e2e.ter.yaml]')
    process.exit(1)
  }

  const json = JSON.parse(fs.readFileSync(input, 'utf-8'))
  const executions = buildExecutions(json.suites || [])

  const doc = {
    nexus: {
      schema: 'results-doc/v1',
      metadata: {
        domain: 'e2e',
        version: '1.0.0',
        source: 'playwright',
        runId: json.config?.metadata?.runId || new Date().toISOString(),
        ...(process.env.GITHUB_RUN_ID
          ? {
              ci: {
                provider: 'github-actions',
                pipelineId: process.env.GITHUB_RUN_ID,
                commit: process.env.GITHUB_SHA,
                branch: process.env.GITHUB_REF_NAME,
              },
            }
          : {}),
      },
    },
    executions,
  }

  const yamlStr = yaml.dump(doc, { lineWidth: 120 })
  fs.mkdirSync(path.dirname(out), { recursive: true })
  fs.writeFileSync(out, yamlStr)
  console.log(`Wrote ${executions.length} executions to ${out}`)
}

const isMain = import.meta.url === `file://${process.argv[1]}`
if (isMain) main()

export { buildExecutions }
