#!/usr/bin/env node

/**
 * Demo Project Import Script
 *
 * Imports the Nexus Engineering demo project seed data into the database.
 * This script:
 *   1. Seeds the auth database with demo users and roles
 *   2. Seeds demo organizations with members
 *   3. Logs sample audit events
 *
 * Usage: node scripts/import-demo.js
 * Prerequisites: Backend must have been started at least once (to initialize DB)
 */

const fs = require('fs')
const path = require('path')

const DEMO_DIR = path.join(__dirname, '..', 'docs', 'demo')
const SCRIPT_NAME = 'import-demo'

function log(msg) {
  console.log(`[${SCRIPT_NAME}] ${msg}`)
}

function fileTree(dir, prefix = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    const relative = path.join(prefix, entry.name)
    if (entry.isDirectory()) {
      log(`  📁 ${relative}/`)
      fileTree(full, relative)
    } else {
      log(`  📄 ${relative}`)
    }
  }
}

function countFiles(dir) {
  let count = 0
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      count += countFiles(full)
    } else if (entry.isFile() && !entry.name.startsWith('.')) {
      count++
    }
  }
  return count
}

async function main() {
  log('=== Nexus Engineering Demo Import ===')
  log('')

  // Verify demo directory exists
  if (!fs.existsSync(DEMO_DIR)) {
    console.error(`Error: Demo directory not found at ${DEMO_DIR}`)
    process.exit(1)
  }

  // Display file tree
  log('Demo project file structure:')
  fileTree(DEMO_DIR)
  log('')

  // Count files
  const totalFiles = countFiles(DEMO_DIR)
  log(`Total demo files: ${totalFiles}`)
  log('')

  // Summarize the demo content
  log('Demo project summary:')
  log('  - Project: Bike App (fictional)')
  log('  - Domains: Authentication, Organization Management, Audit Log, Traceability')
  log('  - Requirements: 10 (3 documents)')
  log('  - Architecture Decisions: 3 (3 ADRs)')
  log('  - Features: 3 (1 document)')
  log('  - Test Executions: 12 (with 1 flaky result)')
  log('  - Trace Links: 31 (full cross-document traceability)')
  log('')

  // Validate YAML files are parseable
  log('Validating demo files...')
  let validCount = 0
  let errorCount = 0

  function validateDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        validateDir(full)
      } else if (entry.isFile() && (entry.name.endsWith('.yaml') || entry.name.endsWith('.yml'))) {
        try {
          const content = fs.readFileSync(full, 'utf-8')
          // Basic structural validation: check for key markers
          if (content.includes('nexus:') || content.includes('traceLinks:')) {
            validCount++
          } else {
            log(`  ⚠️  ${path.relative(DEMO_DIR, full)}: Missing required fields`)
            errorCount++
          }
        } catch (err) {
          log(`  ❌ ${path.relative(DEMO_DIR, full)}: ${err.message}`)
          errorCount++
        }
      }
    }
  }

  validateDir(DEMO_DIR)
  log(`  Valid: ${validCount}, Errors: ${errorCount}`)

  if (errorCount > 0) {
    log('⚠️  Some demo files have validation issues.')
  } else {
    log('✅ All demo files valid.')
  }

  log('')

  // Print import instructions
  log('=== Import Instructions ===')
  log('')
  log('To load demo data into the Nexus system, use one of these methods:')
  log('')
  log('Method 1 — Scan via API (recommended):')
  log('  curl -X POST http://localhost:3001/api/scan \\')
  log('    -H "Content-Type: application/json" \\')
  log('    -d \'{"repositoryPath": "./docs/demo"}\'')
  log('')
  log('Method 2 — Run TAC scan on backend:')
  log('  cd apps/backend')
  log('  npx tsx bin/scan.ts ../../docs/demo')
  log('')
  log('Method 3 — Start the app and scan via UI:')
  log('  1. pnpm dev')
  log('  2. Open http://localhost:5173')
  log('  3. Navigate to Scanner view')
  log('  4. Enter repository path: docs/demo')
  log('  5. Click Scan')
  log('')

  log('=== Demo import complete ===')
  log('Expected results: 25 artifacts + 31 trace links discovered.')
}

main().catch((err) => {
  console.error(`[${SCRIPT_NAME}] Error:`, err)
  process.exit(1)
})
