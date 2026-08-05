import { TraceLink } from '@nexus-engineering/shared'
import { getTraceLinkDatabase } from './database'

let storeInstance: TraceLinkStore | null = null

export interface TraceLinkStore {
  findById(id: string): TraceLink | undefined
  findAll(): TraceLink[]
  findBySource(sourceType: string, sourceId: string): TraceLink[]
  findByTarget(targetType: string, targetId: string): TraceLink[]
  insert(traceLink: TraceLink): TraceLink
  update(id: string, updates: Partial<TraceLink>): TraceLink | undefined
  delete(id: string): boolean
  clear(): void
}

class SQLiteTraceLinkStore implements TraceLinkStore {
  private database: ReturnType<typeof getTraceLinkDatabase>

  constructor(databasePath?: string) {
    this.database = getTraceLinkDatabase(databasePath)
  }

  findById(id: string): TraceLink | undefined {
    return this.database.findById(id)
  }

  findAll(): TraceLink[] {
    return this.database.findAll()
  }

  findBySource(sourceType: string, sourceId: string): TraceLink[] {
    return this.database.findBySource(sourceType, sourceId)
  }

  findByTarget(targetType: string, targetId: string): TraceLink[] {
    return this.database.findByTarget(targetType, targetId)
  }

  insert(traceLink: TraceLink): TraceLink {
    return this.database.insert(traceLink)
  }

  update(id: string, updates: Partial<TraceLink>): TraceLink | undefined {
    return this.database.update(id, updates)
  }

  delete(id: string): boolean {
    return this.database.delete(id)
  }

  clear(): void {
    getTraceLinkDatabase().clear()
  }
}

export function getTraceLinkStore(databasePath?: string): TraceLinkStore {
  if (!storeInstance) {
    storeInstance = new SQLiteTraceLinkStore(databasePath)
  }
  return storeInstance
}
