#!/usr/bin/env node
/**
 * CLI Validation Script for Requirements as Code
 * Validates that all .req.yaml files conform to schema and trace links are consistent
 */

import { promises as fs } from 'fs'
import path from 'path'
import { reqDocSchema } from '../packages/shared/src/requirements/schema.js'
import Ajv, { JSONSchemaType } from 'ajv'
import * as yaml from 'js-yaml'

interface ValidationResult {
  valid: boolean
  errors: string[]
  filePath: string
}

/**
 * Find all .req.yaml files in a directory recursively
 */
async function findRequirementFiles(dirPath: string): Promise<string[]> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true })
  const results: string[] = []
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)
    
    if (entry.isDirectory()) {
      // Recursively search subdirectories
      const subResults = await findRequirementFiles(fullPath)
      results.push(...subResults)
    } else if (entry.isFile() && path.extname(entry.name) === '.yaml' && 
               entry.name.endsWith('.req.yaml')) {
      results.push(fullPath)
    }
  }
  
  return results.sort()
}

/**
 * Validate a single requirement document against schema
 */
async function validateDocumentSchema(ajv: Ajv, filePath: string): Promise<ValidationResult> {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    filePath
  }
  
  try {
    const fileContents = await fs.readFile(filePath, 'utf-8')
    const doc = yaml.load(fileContents) as any
    
    // Validate against JSON schema
    const validate = ajv.compile(reqDocSchema)
    
    if (!validate(doc)) {
      result.valid = false
      result.errors.push(`Schema validation failed:`)
      validate.errors?.forEach((error, i) => {
        let msg = `  Error ${i + 1}: ${error.instancePath} - ${error.message}`
        if (error.params && error.params.missingProperty) {
          msg += ` (missing property: ${error.params.missingProperty})`
        }
        result.errors.push(msg)
      })
    }
    
  } catch (error: any) {
    result.valid = false
    result.errors.push(`Failed to parse or validate ${filePath}: ${error.message}`)
    if (error.stack) {
      result.errors.push(error.stack)
    }
  }
  
  return result
}

/**
 * Validate trace links with basic consistency checks
 */
async function validateTraceLinks(filePath: string, allDocs: any[], filesFound: string[]): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    filePath
  }
  
  try {
    const fileContents = await fs.readFile(filePath, 'utf-8')
    const doc = yaml.load(fileContents) as any
    
    // Check for required nexus metadata block
    if (!doc.nexus || !doc.nexus.metadata) {
      result.errors.push('Missing or invalid nexus metadata block')
      return result
    }
    
    const docId = doc.nexus.metadata.documentId || `req-${path.basename(filePath, '.yaml')}`
    
    // Build lookup of all requirements by document ID and requirement ID
    const reqByDoc = new Map<string, Map<string, any>>()
    for (const fileContent of allDocs) {
      try {
        const content = typeof fileContent === 'string' 
          ? yaml.load(await fs.readFile(fileContent, 'utf-8')) 
          : fileContent
        
        let currentDocId: string = 'unknown'
        if (content.nexus && content.nexus.metadata) {
          currentDocId = content.nexus.metadata.documentId || 
                         path.basename(fileContent, '.req.yaml')
        }
        
        const reqMap = new Map<string, any>()
        if (content.requirements) {
          for (const req of content.requirements) {
            if (req.id) {
              reqMap.set(req.id, req)
            }
          }
        }
        
        reqByDoc.set(currentDocId, reqMap)
      } catch (e) {
        console.warn('Warning: Could not parse document for trace validation:', filePath, e)
      }
    }
    
    // Check trace links
    if (doc.requirements && Array.isArray(doc.requirements)) {
      doc.requirements.forEach((req: any, reqIdx: number) => {
        if (!req.traceLinks || !Array.isArray(req.traceLinks)) return
        
        req.traceLinks.forEach((link: any, linkIdx: number) => {
          const targetId = link.target?.id
          const targetDocId = link.target?.documentId || docId
          
          // Check if target document exists
          if (targetDocId && !reqByDoc.has(targetDocId)) {
            result.errors.push(`Requirement ${req.id}: trace link ${linkIdx + 1} targets document '${targetDocId}' which was not found`)
            return
          }
          
          // Check if target requirement exists in that document
          if (targetDocId && reqByDoc.has(targetDocId)) {
            const targetReqMap = reqByDoc.get(targetDocId)
            if (targetReqMap && !targetReqMap.has(targetId)) {
              result.errors.push(`Requirement ${req.id}: trace link ${linkIdx + 1} targets requirement '${targetId}' which was not found in document '${targetDocId}'`)
            }
          }
        })
      })
    }
    
    if (result.errors.length > 0) {
      result.valid = false
    }
    
  } catch (error: any) {
    result.valid = false
    result.errors.push(`Failed to validate trace links in ${filePath}: ${error.message}`)
    if (error.stack) {
      result.errors.push(error.stack)
    }
  }
  
  return result
}

export async function main() {
  const cwd = process.cwd()
  const rootDir = path.join(cwd, 'packages/shared/requirements')
  
  console.log('🔍 Starting requirements validation...\n')
  console.log(`Working directory: ${cwd}`)
  console.log(`Scanning directory: ${rootDir}\n`)
  
  const ajv = new Ajv()
  const allErrors: ValidationResult[] = []
  
  try {
    // Find all requirement files
    console.log('📁 Finding .req.yaml files...')
    let reqFiles: string[] = []
    try {
      reqFiles = await findRequirementFiles(rootDir)
    } catch (error) {
      console.error(`❌ Error reading directory ${rootDir}:`, error)
      process.exit(1)
    }
    
    if (reqFiles.length === 0) {
      console.log('⚠️  No requirement files found. This may be acceptable for early stages, but requirements will need to be added.')
      process.exit(0)
    }
    
    console.log(`Found ${reqFiles.length} .req.yaml file(s):`)
    reqFiles.forEach(file => console.log(`  - ${path.relative(process.cwd(), file)}`))
    console.log()
    
    // Validate schema
    console.log('📋 Validating schema...\n')
    for (const filePath of reqFiles) {
      const result = await validateDocumentSchema(ajv, filePath)
      allErrors.push(result)
      
      if (!result.valid) {
        console.error(`❌ ${path.relative(process.cwd(), filePath)}`)
        result.errors.forEach(err => console.error(`   ${err}`))
        console.error()
      } else {
        console.log(`✅ ${path.relative(process.cwd(), filePath)}`)
      }
    }
    
    // Validate trace links across all documents
    console.log('🔗 Validating trace links...\n')
    for (const filePath of reqFiles) {
      const result = await validateTraceLinks(filePath, reqFiles, reqFiles)
      allErrors.push(result)
      
      if (!result.valid && Array.isArray(result.errors)) {
        console.error(`❌ Trace links in ${path.relative(process.cwd(), filePath)}`)
        result.errors.forEach(err => console.error(`   ${err}`))
        console.error()
      } else {
        console.log(`✅ Trace links in ${path.relative(process.cwd(), filePath)}`)
      }
    }
    
    // Summary
    const failedValidations = allErrors.filter(e => !e.valid).length
    console.log()
    console.log('='.repeat(60))
    console.log(`📊 Validation Summary: ${failedValidations}/${allErrors.length} checks failed`)
    
    if (failedValidations > 0) {
      console.error('❌ Validation FAILED - Requirements do not conform to standards')
      process.exit(1)
      return
    } else {
      console.log('✅ All requirements are valid!')
      process.exit(0)
    }
    
  } catch (error: any) {
    console.error('❌ Unexpected error during validation:', error.message)
    if (error.stack) {
      console.log(error.stack)
    }
    process.exit(1)
  }
}

// Handle ESM import/export
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(err => {
    console.error('Fatal error:', err)
    process.exit(1)
  })
}

export { findRequirementFiles, validateDocumentSchema, validateTraceLinks }
