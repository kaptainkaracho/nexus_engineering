#!/usr/bin/env node
import { promises as fs } from 'fs'
import path from 'path'
import { glob } from 'glob'
import yaml from 'js-yaml'

const VALID_TYPES = new Set(['functional', 'non-functional', 'system', 'user'])
const VALID_PRIORITIES = new Set(['low', 'medium', 'high', 'critical'])
const VALID_STATUSES = new Set(['proposed', 'approved', 'rejected', 'implemented', 'verified'])
const ISSUE_REF_PATTERN = /^THE-\d+$/
const REQ_ID_PATTERN = /^REQ-[A-Z]{3,5}-\d{3}$/

const SCHEMA_REQUIRED_FIELDS = ['id', 'type', 'title', 'description', 'priority', 'status']
const DOC_REQUIRED_FIELDS = ['nexus.schema', 'nexus.metadata.domain', 'nexus.metadata.version', 'requirements']

async function findReqFiles(rootDir) {
  const matches = await glob('**/*.req.yaml', {
    cwd: rootDir,
    absolute: true,
    nodir: true,
  })
  return matches.sort().filter((f) => !f.includes('/templates/'))
}

function validateRequirement(req, filePath, index) {
  const errors = []
  const prefix = `requirement[${index}] (${req.id || 'no-id'})`

  for (const field of SCHEMA_REQUIRED_FIELDS) {
    if (req[field] === undefined || req[field] === null || req[field] === '') {
      errors.push(`${prefix}: Missing required field "${field}"`)
    }
  }

  if (req.id && !REQ_ID_PATTERN.test(req.id)) {
    errors.push(`${prefix}: Invalid ID format "${req.id}" — expected REQ-{DOMAIN}-{NUMBER} (e.g., REQ-AUTH-001)`)
  }

  if (req.type && !VALID_TYPES.has(req.type)) {
    errors.push(`${prefix}: Invalid type "${req.type}" — must be one of: ${[...VALID_TYPES].join(', ')}`)
  }

  if (req.priority && !VALID_PRIORITIES.has(req.priority)) {
    errors.push(`${prefix}: Invalid priority "${req.priority}" — must be one of: ${[...VALID_PRIORITIES].join(', ')}`)
  }

  if (req.status && !VALID_STATUSES.has(req.status)) {
    errors.push(`${prefix}: Invalid status "${req.status}" — must be one of: ${[...VALID_STATUSES].join(', ')}`)
  }

  if (req.relatedIssues && Array.isArray(req.relatedIssues)) {
    for (const issue of req.relatedIssues) {
      if (!ISSUE_REF_PATTERN.test(issue)) {
        errors.push(`${prefix}: Invalid issue reference "${issue}" — expected THE-{NUMBER}`)
      }
    }
  }

  if (req.dependencies && Array.isArray(req.dependencies)) {
    for (const dep of req.dependencies) {
      if (!REQ_ID_PATTERN.test(dep)) {
        errors.push(`${prefix}: Invalid dependency "${dep}" — expected REQ-{DOMAIN}-{NUMBER}`)
      }
    }
  }

  return errors
}

async function validateRequirements(rootDir) {
  const filePaths = await findReqFiles(rootDir)
  const results = []

  for (const filePath of filePaths) {
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      const doc = yaml.load(content)
      const errors = []

      if (!doc || typeof doc !== 'object') {
        results.push({ filePath, valid: false, errors: ['File does not contain valid YAML'] })
        continue
      }

      if (!doc.nexus) {
        errors.push('Missing "nexus" block')
      }
      if (!doc.nexus?.schema) {
        errors.push('Missing nexus.schema (expected: req-doc/v1)')
      }
      if (!doc.nexus?.metadata?.domain) {
        errors.push('Missing nexus.metadata.domain')
      }
      if (!doc.nexus?.metadata?.version) {
        errors.push('Missing nexus.metadata.version')
      }

      if (!doc.requirements || !Array.isArray(doc.requirements)) {
        errors.push('Missing or invalid "requirements" array')
      } else if (doc.requirements.length === 0) {
        errors.push('Requirements array is empty — must have at least one requirement')
      } else {
        const ids = new Set()
        for (let i = 0; i < doc.requirements.length; i++) {
          const reqErrors = validateRequirement(doc.requirements[i], filePath, i)
          errors.push(...reqErrors)

          if (doc.requirements[i].id) {
            if (ids.has(doc.requirements[i].id)) {
              errors.push(`Duplicate requirement ID: ${doc.requirements[i].id}`)
            }
            ids.add(doc.requirements[i].id)
          }
        }
      }

      results.push({ filePath, valid: errors.length === 0, errors })
    } catch (err) {
      results.push({ filePath, valid: false, errors: [`Failed to parse file: ${err.message}`] })
    }
  }

  results.sort((a, b) => a.filePath.localeCompare(b.filePath))
  return results
}

async function main() {
  const target = process.argv[2]
    ? path.resolve(process.argv[2])
    : path.join(process.cwd(), 'docs/requirements')

  console.log(`Scanning requirement files in: ${target}\n`)

  let results
  try {
    results = await validateRequirements(target)
  } catch (err) {
    console.error(`Fatal error: ${err.message}`)
    process.exitCode = 1
    return
  }

  if (results.length === 0) {
    console.log('No requirement files found.')
    return
  }

  let failed = 0
  for (const result of results) {
    const rel = path.relative(process.cwd(), result.filePath)
    if (!result.valid) {
      failed++
      console.error(`FAIL  ${rel}`)
      result.errors.forEach((e) => console.error(`       ${e}`))
    } else {
      console.log(`PASS  ${rel}`)
    }
  }

  console.log(`\nResults: ${failed}/${results.length} requirement file(s) failed`)
  if (failed > 0) {
    process.exitCode = 1
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error('Fatal error:', err)
    process.exit(1)
  })
}
