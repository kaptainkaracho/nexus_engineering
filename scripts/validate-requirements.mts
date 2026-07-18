#!/usr/bin/env node
/**
 * CLI Validation Script for Requirements as Code
 *
 * Validates that all `.req.yaml` files conform to the `req-doc/v1` schema and
 * that trace links are internally consistent.
 *
 * Reuses the shared package's `ValidatedRequirementsLoader` so the heavy
 * lifting (schema + trace-link validation) lives in one place and `ajv` is
 * resolved from the `@nexus-engineering/shared` dependency graph rather than
 * the repo root (where it is not hoisted).
 *
 * Exit codes:
 *   0 - all requirement documents valid
 *   1 - one or more validation errors, or fatal error
 */

import { promises as fs } from 'fs'
import path from 'path'
import {
  ValidatedRequirementsLoader,
  type LoadResult,
} from '../packages/shared/src/requirements/loader.js'

interface FileValidationResult {
  filePath: string
  valid: boolean
  errors: string[]
}

/**
 * Recursively find all `.req.yaml` files in a directory.
 */
export async function findRequirementFiles(dirPath: string): Promise<string[]> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true })
  const results: string[] = []

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)

    if (entry.isDirectory()) {
      const subResults = await findRequirementFiles(fullPath)
      results.push(...subResults)
    } else if (
      entry.isFile() &&
      path.extname(entry.name) === '.yaml' &&
      entry.name.endsWith('.req.yaml')
    ) {
      results.push(fullPath)
    }
  }

  return results.sort()
}

/**
 * Summarize a single LoadResult into a flat list of error strings.
 */
function summarizeErrors(result: LoadResult): string[] {
  const errors: string[] = []

  if (result.errors && result.errors.size > 0) {
    for (const [key, messages] of result.errors.entries()) {
      for (const message of messages) {
        errors.push(`${key}: ${message}`)
      }
    }
  }

  return errors
}

/**
 * Validate every requirement file under `rootDir`.
 */
export async function validateRequirements(
  rootDir: string,
): Promise<FileValidationResult[]> {
  const loader = new ValidatedRequirementsLoader()
  const reqFiles = await findRequirementFiles(rootDir)

  const results: FileValidationResult[] = []

  for (const filePath of reqFiles) {
    try {
      const loadResult = await loader.loadWithTraceValidation(filePath)
      const errors = summarizeErrors(loadResult)
      results.push({
        filePath,
        valid: errors.length === 0,
        errors,
      })
    } catch (error: any) {
      results.push({
        filePath,
        valid: false,
        errors: [`Failed to load or validate: ${error?.message ?? String(error)}`],
      })
    }
  }

  return results
}

export async function main(): Promise<void> {
  const cwd = process.cwd()
  const rootDir = path.join(cwd, 'packages/shared/requirements')

  console.log('🔍 Starting requirements validation...\n')
  console.log(`Working directory: ${cwd}`)
  console.log(`Scanning directory: ${rootDir}\n`)

  let results: FileValidationResult[]
  try {
    results = await validateRequirements(rootDir)
  } catch (error: any) {
    console.error(`❌ Fatal error scanning ${rootDir}:`, error?.message ?? error)
    process.exitCode = 1
    return
  }

  if (results.length === 0) {
    console.log(
      '⚠️  No requirement files found. This may be acceptable for early stages, but requirements will need to be added.',
    )
    return
  }

  console.log(`Found ${results.length} .req.yaml file(s):`)
  results.forEach((r) => console.log(`  - ${path.relative(process.cwd(), r.filePath)}`))
  console.log()

  let failed = 0
  for (const result of results) {
    const relative = path.relative(process.cwd(), result.filePath)
    if (!result.valid) {
      failed++
      console.error(`❌ ${relative}`)
      result.errors.forEach((err) => console.error(`   ${err}`))
      console.error()
    } else {
      console.log(`✅ ${relative}`)
    }
  }

  console.log()
  console.log('='.repeat(60))
  console.log(`📊 Validation Summary: ${failed}/${results.length} file(s) failed`)

  if (failed > 0) {
    console.error('❌ Validation FAILED - Requirements do not conform to standards')
    process.exitCode = 1
    return
  }

  console.log('✅ All requirements are valid!')
}

// Handle ESM import/export — only run when invoked directly.
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error('Fatal error:', err)
    process.exit(1)
  })
}
