#!/usr/bin/env node
/**
 * CI integration hook: Vitest reporter -> TER (results-doc/v1) YAML.
 *
 * Usage (as a Vitest reporter):
 *   // vitest.config.ts
 *   import { TerReporter } from './scripts/ter-reporter-vitest.mjs'
 *   export default { reporters: ['default', new TerReporter({ outFile: 'results/ter.yaml' })] }
 *
 * Or run standalone on a Vitest JSON output file:
 *   node scripts/ter-reporter-vitest.mjs --input vitest.json --out results/ci.ter.yaml
 */
import * as yaml from 'js-yaml'
import * as fs from 'fs'
import * as path from 'path'

const STATUS_MAP = {
  passed: 'passed',
  failed: 'failed',
  skipped: 'skipped',
  // Vitest uses 'todo'/'only' which we treat as skipped
  todo: 'skipped',
  only: 'skipped',
}

function executionFromTask(task, index, ctx) {
  const status = STATUS_MAP[task.result?.state] || (task.mode === 'skip' ? 'skipped' : 'error')
  const duration = typeof task.result?.duration === 'number' ? task.result.duration : 0
  const err = task.result?.errors?.[0]
  const exec = {
    id: `exec-${task.suite?.name || 'root'}-${index}-${task.name}`.replace(/[^a-zA-Z0-9-]/g, '_'),
    suiteId: task.suite?.name || 'vitest',
    caseId: task.name,
    status,
    durationMs: Math.round(duration),
  }
  if (status === 'failed' || status === 'error') {
    exec.error = {
      message: err?.message || 'Test failed',
      type: err?.type || 'Error',
      stack: err?.stack,
    }
  }
  return exec
}

export class TerReporter {
  constructor(options = {}) {
    this.options = options
  }

  onInit() {}
  onFinished(files = [], errors = []) {
    const executions = []
    let i = 0
    for (const file of files) {
      for (const task of file.tasks || []) {
        executions.push(executionFromTask(task, i++, { file }))
      }
    }

    const doc = {
      nexus: {
        schema: 'results-doc/v1',
        metadata: {
          domain: this.options.domain || 'vitest',
          version: this.options.version || '1.0.0',
          source: 'vitest',
          runId: this.options.runId || new Date().toISOString(),
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
    if (this.options.outFile) {
      fs.mkdirSync(path.dirname(this.options.outFile), { recursive: true })
      fs.writeFileSync(this.options.outFile, yamlStr)
    } else {
      process.stdout.write(yamlStr)
    }
  }
}

// Standalone CLI mode
const isMain = import.meta.url === `file://${process.argv[1]}`
if (isMain) {
  const args = process.argv.slice(2)
  const get = (k) => {
    const idx = args.indexOf(k)
    return idx >= 0 ? args[idx + 1] : undefined
  }
  const input = get('--input')
  const out = get('--out') || 'results/ci.ter.yaml'
  if (!input) {
    console.error('Usage: node ter-reporter-vitest.mjs --input vitest.json [--out results/ci.ter.yaml]')
    process.exit(1)
  }
  const json = JSON.parse(fs.readFileSync(input, 'utf-8'))
  const reporter = new TerReporter({ outFile: out })
  reporter.onFinished(json.files || json.testResults || [], [])
}
