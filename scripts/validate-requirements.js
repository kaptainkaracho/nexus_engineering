#!/usr/bin/env node
/**
 * CLI Validation Script for Requirements as Code (THE-109 / THE-88 backend part)
 *
 * Validates that every `.req.yaml` file conforms to the `req-doc/v1` format
 * (ratified by ADR-012 / RFC-001) and that trace links are not orphaned —
 * every trace target requirement id MUST exist in a `.req.yaml` file on the
 * filesystem.
 *
 * Self-contained (no project build step required): uses `js-yaml` for parsing
 * and `glob` for file discovery, both declared in the repo root devDependencies.
 *
 * Usage:
 *   node scripts/validate-requirements.js [path]
 *     path  directory or .req.yaml file to validate (default: packages/shared/requirements)
 *
 * Exit codes:
 *   0 - all requirement documents valid
 *   1 - one or more validation errors, or fatal error
 */

import { promises as fs } from 'fs'
import path from 'path'
import yaml from 'js-yaml'
import { glob } from 'glob'

const SCHEMA = 'req-doc/v1'

const REQUIREMENT_TYPES = new Set([
  'functional',
  'non-functional',
  'system',
  'user',
])

const PRIORITIES = new Set(['low', 'medium', 'high', 'critical'])

const STATUSES = new Set([
  'proposed',
  'approved',
  'rejected',
  'implemented',
  'verified',
])

const TRACE_LINK_TYPES = new Set([
  'verifies',
  'satisfies',
  'dependsOn',
  'tracesTo',
  'refines',
  'conflictsWith',
])

// Uppercase prefix (letters/digits), optional segments, ending in -<digits>.
const REQUIREMENT_ID_PATTERN = /^[A-Z][A-Z0-9]*(-\w+)*-\d+$/

/**
 * Find all `.req.yaml` files under `rootDir` (or return the single file if a
 * `.req.yaml` file path is given).
 * @param {string} rootDir
 * @returns {Promise<string[]>}
 */
export async function findRequirementFiles(rootDir) {
  const stat = await fs.stat(rootDir)
  if (stat.isFile()) {
    return [rootDir]
  }
  const matches = await glob('**/*.req.yaml', {
    cwd: rootDir,
    absolute: true,
    nodir: true,
  })
  return matches.sort()
}

/**
 * Validate a parsed requirement document against the `req-doc/v1` format.
 * @param {any} doc
 * @param {string} filePath
 * @returns {string[]} error messages (empty when valid)
 */
export function validateDocumentSchema(doc, filePath) {
  const errors = []

  if (!doc || typeof doc !== 'object') {
    errors.push('Document is not a YAML object/mapping')
    return errors
  }

  if (!doc.nexus || typeof doc.nexus !== 'object') {
    errors.push('Missing required `nexus` metadata block')
  } else {
    if (doc.nexus.schema !== SCHEMA) {
      errors.push(
        `nexus.schema must be "${SCHEMA}" (found: ${JSON.stringify(doc.nexus.schema)})`,
      )
    }
    const meta = doc.nexus.metadata
    if (!meta || typeof meta !== 'object') {
      errors.push('Missing required `nexus.metadata` block')
    } else {
      for (const field of ['domain', 'version', 'source']) {
        if (typeof meta[field] !== 'string' || meta[field].trim() === '') {
          errors.push(`nexus.metadata.${field} is required and must be a non-empty string`)
        }
      }
    }
  }

  if (!Array.isArray(doc.requirements)) {
    errors.push('Missing required `requirements` array')
    return errors
  }

  doc.requirements.forEach((req, idx) => {
    const where = `requirements[${idx}]`
    if (!req || typeof req !== 'object') {
      errors.push(`${where}: requirement must be an object`)
      return
    }

    if (typeof req.id !== 'string' || req.id.trim() === '') {
      errors.push(`${where}: \`id\` is required and must be a non-empty string`)
    } else if (!REQUIREMENT_ID_PATTERN.test(req.id)) {
      errors.push(
        `${where}: \`id\` "${req.id}" does not match expected format (e.g. REQ-AUTH-001)`,
      )
    }

    if (!REQUIREMENT_TYPES.has(req.type)) {
      errors.push(
        `${where}: \`type\` must be one of ${[...REQUIREMENT_TYPES].join(', ')} (found: ${JSON.stringify(req.type)})`,
      )
    }

    if (typeof req.title !== 'string' || req.title.trim() === '') {
      errors.push(`${where}: \`title\` is required and must be a non-empty string`)
    } else if (req.title.length > 120) {
      errors.push(`${where}: \`title\` must be 120 characters or fewer`)
    }

    if (typeof req.description !== 'string' || req.description.trim() === '') {
      errors.push(`${where}: \`description\` is required and must be a non-empty string`)
    }

    if (!PRIORITIES.has(req.priority)) {
      errors.push(
        `${where}: \`priority\` must be one of ${[...PRIORITIES].join(', ')} (found: ${JSON.stringify(req.priority)})`,
      )
    }

    if (!STATUSES.has(req.status)) {
      errors.push(
        `${where}: \`status\` must be one of ${[...STATUSES].join(', ')} (found: ${JSON.stringify(req.status)})`,
      )
    }

    if (req.tags !== undefined && (!Array.isArray(req.tags) || req.tags.some((t) => typeof t !== 'string'))) {
      errors.push(`${where}: \`tags\` must be an array of strings when present`)
    }

    if (req.traceLinks !== undefined) {
      if (!Array.isArray(req.traceLinks)) {
        errors.push(`${where}: \`traceLinks\` must be an array when present`)
      } else {
        req.traceLinks.forEach((link, li) => {
          const lw = `${where}.traceLinks[${li}]`
          if (!link || typeof link !== 'object') {
            errors.push(`${lw}: trace link must be an object`)
            return
          }
          if (!TRACE_LINK_TYPES.has(link.type)) {
            errors.push(
              `${lw}: \`type\` must be one of ${[...TRACE_LINK_TYPES].join(', ')} (found: ${JSON.stringify(link.type)})`,
            )
          }
          const target = link.target
          if (!target || typeof target !== 'object') {
            errors.push(`${lw}: \`target\` is required and must be an object`)
            return
          }
          if (typeof target.id !== 'string' || target.id.trim() === '') {
            errors.push(`${lw}.target.id is required and must be a non-empty string`)
          }
          if (typeof target.documentId !== 'string' || target.documentId.trim() === '') {
            errors.push(`${lw}.target.documentId is required and must be a non-empty string`)
          }
        })
      }
    }
  })

  return errors
}

/**
 * Build a registry of every requirement id found across all parsed documents,
 * keyed by id -> source file path. Also maps documentId -> file path.
 * @param {Array<{ filePath: string, doc: any }>} parsed
 */
function buildRequirementRegistry(parsed) {
  const ids = new Map() // requirementId -> filePath
  const docIds = new Map() // documentId -> filePath

  for (const { filePath, doc } of parsed) {
    const declaredDocId = doc.nexus?.metadata?.documentId
    if (typeof declaredDocId === 'string' && declaredDocId.trim() !== '') {
      docIds.set(declaredDocId, filePath)
    }
    if (Array.isArray(doc.requirements)) {
      for (const req of doc.requirements) {
        if (req && typeof req.id === 'string') {
          ids.set(req.id, filePath)
        }
      }
    }
  }

  return { ids, docIds }
}

/**
 * Detect orphaned trace links: every trace target requirement id must exist in
 * a `.req.yaml` file on the filesystem.
 * @param {any} doc
 * @param {{ ids: Map<string,string>, docIds: Map<string,string> }} registry
 * @returns {string[]}
 */
function detectOrphanedTraces(doc, registry) {
  const errors = []
  if (!Array.isArray(doc.requirements)) return errors

  for (const req of doc.requirements) {
    if (!req || !Array.isArray(req.traceLinks)) continue
    for (let i = 0; i < req.traceLinks.length; i++) {
      const link = req.traceLinks[i]
      const target = link?.target
      if (!target || typeof target.id !== 'string') continue

      const targetDocId = typeof target.documentId === 'string' ? target.documentId : undefined

      if (targetDocId && registry.docIds.has(targetDocId)) {
        // Document is known on disk — target id must live inside that document.
        const targetFilePath = registry.docIds.get(targetDocId)
        if (!registry.ids.has(target.id)) {
          errors.push(
            `${req.id}: traceLinks[${i}] -> "${target.id}" not found in any .req.yaml file (orphaned)`,
          )
        } else if (registry.ids.get(target.id) !== targetFilePath) {
          errors.push(
            `${req.id}: traceLinks[${i}] -> "${target.id}" resolves to a different document than "${targetDocId}" (orphaned)`,
          )
        }
      } else {
        // Document id not on disk (external reference) — fall back to global id
        // existence check so true orphans are still caught.
        if (!registry.ids.has(target.id)) {
          errors.push(
            `${req.id}: traceLinks[${i}] -> "${target.id}" not found on the filesystem (orphaned)`,
          )
        }
      }
    }
  }

  return errors
}

/**
 * Validate every requirement file under `rootDir`.
 * @param {string} rootDir
 * @returns {Promise<Array<{ filePath: string, valid: boolean, errors: string[] }>>}
 */
export async function validateRequirements(rootDir) {
  const filePaths = await findRequirementFiles(rootDir)
  const parsed = []
  const loadErrors = new Map()

  for (const filePath of filePaths) {
    try {
      const raw = await fs.readFile(filePath, 'utf-8')
      const doc = yaml.load(raw)
      parsed.push({ filePath, doc })
    } catch (err) {
      loadErrors.set(filePath, [`Failed to parse YAML: ${err.message}`])
    }
  }

  const registry = buildRequirementRegistry(parsed)
  const results = []

  for (const { filePath, doc } of parsed) {
    const errors = validateDocumentSchema(doc, filePath)
    errors.push(...detectOrphanedTraces(doc, registry))
    results.push({ filePath, valid: errors.length === 0, errors })
  }

  for (const [filePath, errors] of loadErrors.entries()) {
    results.push({ filePath, valid: false, errors })
  }

  results.sort((a, b) => a.filePath.localeCompare(b.filePath))
  return results
}

export async function main() {
  const target = process.argv[2]
    ? path.resolve(process.argv[2])
    : path.join(process.cwd(), 'packages/shared/requirements')

  console.log('🔍 Starting requirements validation...\n')
  console.log(`Scanning: ${target}\n`)

  let results
  try {
    results = await validateRequirements(target)
  } catch (err) {
    console.error(`❌ Fatal error: ${err.message}`)
    process.exitCode = 1
    return
  }

  if (results.length === 0) {
    console.log('⚠️  No .req.yaml files found.')
    return
  }

  console.log(`Found ${results.length} .req.yaml file(s):`)
  results.forEach((r) => console.log(`  - ${path.relative(process.cwd(), r.filePath)}`))
  console.log()

  let failed = 0
  for (const result of results) {
    const rel = path.relative(process.cwd(), result.filePath)
    if (!result.valid) {
      failed++
      console.error(`❌ ${rel}`)
      result.errors.forEach((e) => console.error(`   ${e}`))
      console.error()
    } else {
      console.log(`✅ ${rel}`)
    }
  }

  console.log('='.repeat(60))
  console.log(`📊 Validation Summary: ${failed}/${results.length} file(s) failed`)

  if (failed > 0) {
    console.error('❌ Validation FAILED — requirements do not conform to standards')
    process.exitCode = 1
    return
  }
  console.log('✅ All requirements are valid!')
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error('Fatal error:', err)
    process.exit(1)
  })
}
