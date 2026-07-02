#!/usr/bin/env tsx

import { scanner } from '../src/scanners/repositoryScanner'
import { artifactsRepository } from '../src/artifacts/repository'

async function main() {
  const repositoryPath = process.argv[2] || process.cwd()
  
  console.log(`Scanning repository: ${repositoryPath}`)
  
  const { documents, report } = await scanner.scan(repositoryPath)
  
  // Store results
  artifactsRepository.setArtifacts(repositoryPath, documents.map(doc => ({
    repositoryPath,
    documents: [doc],
  })))
  
  console.log('\nScan Report:')
  console.log(`  Repositories scanned: ${report.repositoriesScanned}`)
  console.log(`  Documents found: ${report.documentsFound}`)
  console.log(`  Errors: ${report.errors.length}`)
  
  if (report.errors.length > 0) {
    console.log('\nErrors:')
    for (const err of report.errors) {
      console.log(`  - ${err.repository}: ${err.error.message}`)
    }
  }
  
  console.log('\nDocument types:')
  const typeCounts = documents.reduce((acc, doc) => {
    acc[doc.type] = (acc[doc.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  for (const [type, count] of Object.entries(typeCounts)) {
    console.log(`  ${type}: ${count}`)
  }
}

main().catch(console.error)
