#!/usr/bin/env node
import { promises as fs } from 'fs'
import path from 'path'
import { glob } from 'glob'

const VALID_STATUSES = new Set([
  'Proposed',
  'Accepted',
  'Deprecated',
  'Superseded',
])

const REQUIRED_SECTIONS = ['## Context', '## Decision', '## Consequences']

const ISSUE_REF_PATTERN = /THE-\d+/

async function findAdrFiles(rootDir) {
  const stat = await fs.stat(rootDir)
  if (stat.isFile()) {
    return [rootDir]
  }
  const matches = await glob('**/adr-*.md', {
    cwd: rootDir,
    absolute: true,
    nodir: true,
  })
  return matches.sort().filter((f) => !f.includes('/templates/'))
}

function validateAdrDocument(content, filePath) {
  const errors = []

  if (!content || content.trim() === '') {
    errors.push('File is empty')
    return errors
  }

  const titleMatch = content.match(/^# ADR-\d+:/m)
  if (!titleMatch) {
    errors.push('Missing or invalid title (expected: # ADR-{NUMBER}: {TITLE})')
  }

  const statusMatch = content.match(/^\*\*Status:\*\*\s*(.+)$/m)
  if (!statusMatch) {
    errors.push('Missing Status line')
  } else if (!VALID_STATUSES.has(statusMatch[1].trim())) {
    errors.push(
      `Invalid status "${statusMatch[1].trim()}" — must be one of: ${[...VALID_STATUSES].join(', ')}`,
    )
  }

  if (!content.match(/^\*\*Date:\*\*/m)) {
    errors.push('Missing Date line')
  }

  if (!content.match(/^\*\*Deciders:\*\*/m)) {
    errors.push('Missing Deciders line')
  }

  if (!content.match(/^\*\*Issue:\*\*\s*THE-\d+/m)) {
    errors.push('Missing or invalid Issue reference (expected: **Issue:** THE-{NUMBER})')
  }

  for (const section of REQUIRED_SECTIONS) {
    if (!content.includes(section)) {
      errors.push(`Missing required section: ${section}`)
    }
  }

  return errors
}

async function validateAdrs(rootDir) {
  const filePaths = await findAdrFiles(rootDir)
  const results = []

  for (const filePath of filePaths) {
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      const errors = validateAdrDocument(content, filePath)
      results.push({ filePath, valid: errors.length === 0, errors })
    } catch (err) {
      results.push({ filePath, valid: false, errors: [`Failed to read file: ${err.message}`] })
    }
  }

  results.sort((a, b) => a.filePath.localeCompare(b.filePath))
  return results
}

async function main() {
  const target = process.argv[2]
    ? path.resolve(process.argv[2])
    : path.join(process.cwd(), 'docs/architecture/adr')

  console.log(`Scanning ADRs in: ${target}\n`)

  let results
  try {
    results = await validateAdrs(target)
  } catch (err) {
    console.error(`Fatal error: ${err.message}`)
    process.exitCode = 1
    return
  }

  if (results.length === 0) {
    console.log('No ADR files found.')
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

  console.log(`\nResults: ${failed}/${results.length} ADR(s) failed`)
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
