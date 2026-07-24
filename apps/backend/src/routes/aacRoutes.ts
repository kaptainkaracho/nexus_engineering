import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import * as path from 'path'
import * as fs from 'fs'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'
import { AppError } from '../lib/errorHandler'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const AAC_DIR = path.resolve(__dirname, '../../../../docs/architecture/adr')

interface AdrDocument {
  id: string
  filePath: string
  title: string
  status: string
  date: string
  deciders: string[]
  issue: string
  content: string
}

function parseAdrMetadata(filePath: string, content: string): AdrDocument {
  const fileName = path.basename(filePath, '.md')
  const idMatch = fileName.match(/^adr-(\d+)/i)
  const id = idMatch ? `ADR-${idMatch[1]}` : fileName

  const titleMatch = content.match(/^#\s+ADR-\d+:\s+(.+)$/m)
  const title = titleMatch ? titleMatch[1].trim() : fileName

  const statusMatch = content.match(/\*\*Status:\*\*\s*(.+?)(?:\n|$)/)
  const status = statusMatch ? statusMatch[1].trim() : 'Unknown'

  const dateMatch = content.match(/\*\*Date:\*\*\s*(.+?)(?:\n|$)/)
  const date = dateMatch ? dateMatch[1].trim() : ''

  const decidersMatch = content.match(/\*\*Deciders:\*\*\s*(.+?)(?:\n|$)/)
  const deciders = decidersMatch ? decidersMatch[1].split(',').map((d: string) => d.trim()) : []

  const issueMatch = content.match(/\*\*Issue:\*\*\s*(.+?)(?:\n|$)/)
  const issue = issueMatch ? issueMatch[1].trim() : ''

  return { id, filePath, title, status, date, deciders, issue, content }
}

export async function listAacDocuments(_: FastifyRequest, reply: FastifyReply) {
  const adrDir = AAC_DIR
  let files: string[]
  try {
    files = fs.readdirSync(adrDir)
      .filter(f => f.endsWith('.md'))
      .filter(f => !f.startsWith('template'))
      .map(f => path.join(adrDir, f))
  } catch {
    return reply.send({ data: [], total: 0 })
  }

  const documents = []
  for (const fp of files) {
    try {
      const content = fs.readFileSync(fp, 'utf-8')
      const parsed = parseAdrMetadata(fp, content)
      documents.push({
        id: parsed.id,
        filePath: parsed.filePath,
        title: parsed.title,
        status: parsed.status,
        date: parsed.date,
        deciders: parsed.deciders,
        issue: parsed.issue,
        summary: content.split('\n').slice(0, 30).join('\n'),
      })
    } catch {
      // skip unreadable files
    }
  }

  return reply.send({ data: documents, total: documents.length })
}

export async function getAacDocument(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }

  if (!id) {
    throw new AppError(400, 'Document ID is required', { param: 'id' })
  }

  const adrDir = AAC_DIR
  const normalizedId = id.toUpperCase().replace(/^ADR-?/, '').padStart(3, '0')

  let files: string[]
  try {
    files = fs.readdirSync(adrDir).filter(f => f.endsWith('.md'))
  } catch {
    throw new AppError(404, `AAC document '${id}' not found`, { resourceId: id })
  }

  for (const f of files) {
    const fp = path.join(adrDir, f)
    const content = fs.readFileSync(fp, 'utf-8')
    const parsed = parseAdrMetadata(fp, content)
    const searchId = id.toUpperCase()
    if (parsed.id === searchId || f.includes(normalizedId) || content.includes(`ADR-${normalizedId}:`)) {
      return reply.send({ data: parsed })
    }
  }

  throw new AppError(404, `AAC document '${id}' not found`, { resourceId: id })
}

export async function validateAacDocument(request: FastifyRequest, reply: FastifyReply) {
  const { document } = request.body as { document: { content: string } }

  if (!document?.content) {
    throw new AppError(400, 'document.content is required in request body', { param: 'document.content' })
  }

  const errors: Array<{ path: string; message: string }> = []
  const content = document.content

  if (!content.match(/^#\s+ADR-\d+:/m)) {
    errors.push({ path: '/title', message: 'Missing ADR title (format: "# ADR-{NUMBER}: {TITLE}")' })
  }
  if (!content.includes('**Status:**')) {
    errors.push({ path: '/status', message: 'Missing Status field' })
  }
  if (!content.includes('**Date:**')) {
    errors.push({ path: '/date', message: 'Missing Date field' })
  }
  if (!content.includes('**Deciders:**')) {
    errors.push({ path: '/deciders', message: 'Missing Deciders field' })
  }
  if (!content.includes('## Context')) {
    errors.push({ path: '/context', message: 'Missing Context section' })
  }
  if (!content.includes('## Decision')) {
    errors.push({ path: '/decision', message: 'Missing Decision section' })
  }
  if (!content.includes('## Consequences')) {
    errors.push({ path: '/consequences', message: 'Missing Consequences section' })
  }

  return reply.send({ valid: errors.length === 0, errors })
}

export async function getAacTemplate(_: FastifyRequest, reply: FastifyReply) {
  const templatePath = path.join(AAC_DIR, 'templates', 'adr-template.md')
  try {
    const content = fs.readFileSync(templatePath, 'utf-8')
    return reply.send({ data: { template: content, format: 'markdown' } })
  } catch {
    throw new AppError(404, 'ADR template not found')
  }
}

export async function aacRoutes(server: FastifyInstance) {
  server.get('/api/aac', listAacDocuments)
  server.get('/api/aac/:id', getAacDocument)
  server.post('/api/aac/validate', validateAacDocument)
  server.get('/api/aac/template', getAacTemplate)
}
