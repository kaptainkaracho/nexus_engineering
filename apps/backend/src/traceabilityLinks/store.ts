import type { TraceLink } from '@nexus-engineering/shared'
import * as fs from 'fs'
import * as path from 'path'

interface StoredTraceLink {
  id: string
  version: string
  createdAt: string
  updatedAt: string
  source: string
  sourceId: string
  sourceType: string
  targetId: string
  targetType: string
  relationshipType: string
  confidence: string
  description?: string | null
}

class TraceLinkStore {
  private dbPath: string
  private lock = false

  constructor(dbPath?: string) {
    this.dbPath = dbPath || path.join(process.cwd(), 'data', 'trace_links.json')
  }

  private ensureFile() {
    const dir = path.dirname(this.dbPath)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    if (!fs.existsSync(this.dbPath)) fs.writeFileSync(this.dbPath, JSON.stringify([]), 'utf-8')
  }

  private load(): StoredTraceLink[] {
    this.ensureFile()
    const raw = fs.readFileSync(this.dbPath, 'utf-8')
    return JSON.parse(raw) as StoredTraceLink[]
  }

  private save(links: StoredTraceLink[]) {
    this.ensureFile()
    fs.writeFileSync(this.dbPath, JSON.stringify(links, null, 2), 'utf-8')
  }

  insert(traceLink: TraceLink): TraceLink {
    const links = this.load()
    if (links.find(l => l.id === traceLink.id)) throw new Error(`Trace link with id '${traceLink.id}' already exists`)
    
    const stored: StoredTraceLink = {
      ...traceLink,
      createdAt: traceLink.createdAt instanceof Date ? traceLink.createdAt.toISOString() : String(traceLink.createdAt),
      updatedAt: traceLink.updatedAt instanceof Date ? traceLink.updatedAt.toISOString() : String(traceLink.updatedAt)
    }
    
    links.push(stored)
    this.save(links)
    return traceLink
  }

  findById(id: string): TraceLink | undefined {
    const links = this.load()
    const found = links.find(l => l.id === id)
    if (!found) return undefined
    return this.mapToTraceLink(found)
  }

  findAll(): TraceLink[] {
    const links = this.load().sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    return links.map(l => this.mapToTraceLink(l))
  }

  findBySource(sourceType: string, sourceId: string): TraceLink[] {
    const links = this.load().sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    return links
      .filter(l => l.sourceType === sourceType && l.sourceId === sourceId)
      .map(l => this.mapToTraceLink(l))
  }

  findByTarget(targetType: string, targetId: string): TraceLink[] {
    const links = this.load().sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    return links
      .filter(l => l.targetType === targetType && l.targetId === targetId)
      .map(l => this.mapToTraceLink(l))
  }

  update(id: string, updates: Partial<TraceLink>): TraceLink | undefined {
    const links = this.load()
    const idx = links.findIndex(l => l.id === id)
    if (idx === -1) return undefined

    const existing = links[idx]
    const merged = {
      ...existing,
      ...updates as StoredTraceLink,
      updatedAt: new Date().toISOString(),
      version: (existing.version as string) || '1.0'
    }
    
    // increment version suffix
    const verParts = (merged.version as string).split('.')
    merged.version = `${verParts[0]}.${Number(verParts[1]) + 1}`

    links[idx] = merged
    this.save(links)

    return { ...existing, ...updates, updatedAt: new Date() }
  }

  delete(id: string): boolean {
    const links = this.load()
    const filtered = links.filter(l => l.id !== id)
    if (filtered.length === links.length) return false
    this.save(filtered)
    return true
  }

  clear(): void {
    this.save([])
  }

  private mapToTraceLink(s: StoredTraceLink): TraceLink {
    return {
      ...s,
      createdAt: new Date(s.createdAt),
      updatedAt: new Date(s.updatedAt)
    } as TraceLink
  }
}

let storeInstance: TraceLinkStore | null = null

export function getTraceLinkStore(pathOverride?: string): TraceLinkStore {
  if (!storeInstance) storeInstance = new TraceLinkStore(pathOverride)
  return storeInstance
}
