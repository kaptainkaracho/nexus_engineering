import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import type { 
  RepositoryDocumentOperation, 
  Document, 
  DocumentType, 
} from '@nexus-engineering/shared'

export interface ScanResult {
  documents: Document[]
  report: ScanReport
}

export interface ScanReport {
  documentsFound: number
  repositoriesScanned: number
  errors: Array<{ repository: string; error: Error }>
}

export class RepositoryScanner {
  async scan(repositoryPath: string): Promise<ScanResult> {
    const report: ScanReport = { documentsFound: 0, repositoriesScanned: 1, errors: [] }
    const documents: Document[] = []

    try {
      const scannedDocs = await this.scanDirectory(repositoryPath, ['.git', 'node_modules', '.next', 'dist', 'coverage'], report)
      documents.push(...scannedDocs)
      report.documentsFound = documents.length
    } catch (error) {
      report.errors.push({ repository: repositoryPath, error: error as Error })
    }

    return { documents, report }
  }

  private async scanDirectory(
    directory: string,
    ignorePatterns: string[],
    report: ScanReport
  ): Promise<Document[]> {
    const documents: Document[] = []

    try {
      const entries = await fs.promises.readdir(directory, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = path.join(directory, entry.name)

        if (ignorePatterns.includes(entry.name)) {
            continue
          }

        if (entry.isDirectory()) {
          const subdirDocuments = await this.scanDirectory(fullPath, ignorePatterns, report)
          documents.push(...subdirDocuments)
        } else if (entry.isFile() && !entry.name.startsWith('.')) {
          const document = await this.createDocumentFromFile(directory, fullPath)
          if (document) {
            documents.push(document)
            report.documentsFound++
          }
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${directory}:`, error)
      throw error
    }

    return documents
  }

  private async createDocumentFromFile(
    basePath: string,
    filePath: string
  ): Promise<Document | null> {
    const relativePath = path.relative(basePath, filePath)
    const extension = path.extname(filePath).toLowerCase()
    
    let documentType: DocumentType = 'Txt'

    if (extension === '.json') {
      documentType = 'Json'
    } else if (extension === '.xml' || filePath.endsWith('.xsd')) {
      documentType = 'Xml'
    } else if (extension === '.html' || extension === '.htm') {
      documentType = 'Html'
    } else if (extension === '.md') {
      documentType = 'Md'
    }

    // Try to read file content
    let content: string | Record<string, unknown> = ''
    try {
      const stats = await fs.promises.stat(filePath)
      
      if (stats.size > 10 * 1024 * 1024) { // Limit to 10MB
        content = `[${documentType} document too large for storage]`
      } else {
        const rawContent = await fs.promises.readFile(filePath, 'utf-8')
        
        if (documentType === 'Json') {
          try {
            content = JSON.parse(rawContent)
          } catch {
            // If not valid JSON, treat as text
            content = rawContent
          }
        } else if (documentType === 'Md') {
          content = this.parseMarkdown(rawContent)
        } else {
          content = rawContent
        }
      }
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error)
      return null
    }

    return {
      id: randomUUID(),
      version: '1.0.0',
      createdAt: new Date(),
      updatedAt: new Date(),
      source: filePath,
      path: relativePath,
      content,
      type: documentType,
    }
  }

  private parseMarkdown(rawContent: string): Record<string, unknown> {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/
    const match = rawContent.match(frontmatterRegex)

    if (!match) {
      return { content: rawContent, frontmatter: null }
    }

    const [, frontmatterStr, body] = match
    const frontmatter: Record<string, unknown> = {}

    // Parse YAML-like frontmatter (simple key: value pairs)
    for (const line of frontmatterStr.split('\n')) {
      const colonIndex = line.indexOf(':')
      if (colonIndex > 0) {
        const key = line.slice(0, colonIndex).trim()
        const value = line.slice(colonIndex + 1).trim()
        frontmatter[key] = value
      }
    }

    return { content: body.trim(), frontmatter }
  }
}

// Singleton instance for convenience
export const scanner = new RepositoryScanner()