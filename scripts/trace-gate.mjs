#!/usr/bin/env node
// Trace Gate CLI — runs the traceability gate in CI against a running backend.
//
// Fails the CI job (exit 1) ONLY when the gate verdict is `fail` AND mode is
// `block`. In `warn` mode (the default) a failing verdict only annotates and
// the process exits 0. Network/API failures are treated fail-safe (exit 0 with
// a warning) so the gate is strictly additive and never breaks existing
// pipelines on its own.

import { readFileSync, existsSync } from 'fs'

const DEFAULT_API_URL = process.env.NEXUS_API_URL || 'http://localhost:3000'

function parseArgs(argv) {
  const opts = {
    apiUrl: DEFAULT_API_URL,
    warnOnly: false,
    config: undefined,
    timeout: 15000,
    coverageThreshold: undefined,
    maxGaps: undefined,
    requireTypes: undefined,
    mode: undefined,
  }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    switch (a) {
      case '--api-url': opts.apiUrl = argv[++i]; break
      case '--warn-only': opts.warnOnly = true; break
      case '--config': opts.config = argv[++i]; break
      case '--timeout': opts.timeout = Number(argv[++i]) || opts.timeout; break
      case '--coverage-threshold': opts.coverageThreshold = Number(argv[++i]); break
      case '--max-gaps': opts.maxGaps = Number(argv[++i]); break
      case '--require-types': opts.requireTypes = argv[++i]; break
      case '--mode': opts.mode = argv[++i]; break
      case '-h': case '--help':
        printHelp()
        process.exit(0)
      default:
        // ignore unknown flags
        break
    }
  }
  return opts
}

function printHelp() {
  console.log(`Trace Gate CLI

Usage: node scripts/trace-gate.mjs [options]

Options:
  --api-url <url>            Backend base URL (default $NEXUS_API_URL or http://localhost:3000)
  --warn-only                Force warn mode (never exit non-zero)
  --config <path>            Offline policy override (.nexus/trace-gate.json)
  --timeout <ms>             Request timeout (default 15000)
  --coverage-threshold <n>   Override coverage threshold
  --max-gaps <n>             Override max gaps
  --require-types <csv>      Override required types (comma-separated)
  --mode <block|warn>        Override mode
  -h, --help                 Show this help
`)
}

function loadConfigPolicy(configPath) {
  if (!configPath) return {}
  if (!existsSync(configPath)) {
    console.warn(`[trace-gate] config file not found: ${configPath} (ignoring)`)
    return {}
  }
  try {
    const raw = JSON.parse(readFileSync(configPath, 'utf-8'))
    return raw && typeof raw === 'object' ? raw : {}
  } catch (err) {
    console.warn(`[trace-gate] failed to parse config ${configPath}: ${err.message} (ignoring)`)
    return {}
  }
}

function buildQuery(opts, policy) {
  const params = new URLSearchParams()
  const coverage = opts.coverageThreshold ?? policy.coverageThreshold
  const maxGaps = opts.maxGaps ?? policy.maxGaps
  const requireTypes = opts.requireTypes ?? (Array.isArray(policy.requireTypes) ? policy.requireTypes.join(',') : undefined)
  let mode = opts.mode ?? policy.mode
  if (opts.warnOnly) mode = 'warn'

  if (coverage !== undefined && coverage !== null && coverage !== '') params.set('coverageThreshold', String(coverage))
  if (maxGaps !== undefined && maxGaps !== null && maxGaps !== '') params.set('maxGaps', String(maxGaps))
  if (requireTypes !== undefined && requireTypes !== null && requireTypes !== '') params.set('requireTypes', String(requireTypes))
  if (mode === 'block' || mode === 'warn') params.set('mode', mode)
  return params
}

function formatResult(result) {
  const lines = []
  lines.push('')
  lines.push('── Trace Gate ─────────────────────────────')
  lines.push(`  Mode        : ${result.mode}`)
  lines.push(`  Coverage    : ${result.metrics.coveragePercent}%`)
  lines.push(`  Gaps        : ${result.metrics.gapCount}`)
  if (result.metrics.missingTypes.length) {
    lines.push(`  Missing     : ${result.metrics.missingTypes.join(', ')}`)
  }
  if (result.violations.length) {
    lines.push('  Violations  :')
    for (const v of result.violations) lines.push(`    - ${v.message}`)
  }
  lines.push(`  Verdict     : ${result.pass ? 'PASS' : 'FAIL'}`)
  lines.push('───────────────────────────────────────────')
  return lines.join('\n')
}

async function main() {
  const opts = parseArgs(process.argv.slice(2))
  const policy = loadConfigPolicy(opts.config)
  const params = buildQuery(opts, policy)
  const url = `${opts.apiUrl.replace(/\/$/, '')}/api/traceability/gate${params.toString() ? `?${params.toString()}` : ''}`

  console.log(`[trace-gate] evaluating against ${opts.apiUrl} (mode=${opts.warnOnly ? 'warn(forced)' : (policy.mode || 'warn')})`)

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), opts.timeout)
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { accept: 'application/json' } })
    if (!res.ok) {
      console.warn(`[trace-gate] backend returned ${res.status}; skipping gate (fail-safe, non-blocking)`)
      return 0
    }
    const result = await res.json()
    if (!result || typeof result.pass !== 'boolean') {
      console.warn('[trace-gate] unexpected response shape; skipping gate (fail-safe, non-blocking)')
      return 0
    }

    console.log(formatResult(result))

    if (result.pass) {
      console.log('[trace-gate] gate passed ✓')
      return 0
    }

    if (opts.warnOnly) {
      console.warn('[trace-gate] gate FAILED but --warn-only is set — annotating only (non-blocking).')
      return 0
    }

    if (result.mode === 'block') {
      console.error('[trace-gate] gate FAILED in block mode — failing CI job.')
      return 1
    }

    console.warn('[trace-gate] gate FAILED but mode=warn — annotating only (non-blocking).')
    return 0
  } catch (err) {
    if (err.name === 'AbortError') {
      console.warn(`[trace-gate] request timed out after ${opts.timeout}ms; skipping gate (fail-safe, non-blocking)`)
    } else {
      console.warn(`[trace-gate] could not reach backend (${err.message}); skipping gate (fail-safe, non-blocking)`)
    }
    return 0
  } finally {
    clearTimeout(timer)
  }
}

main().then(code => process.exit(code))
