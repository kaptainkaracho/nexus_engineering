import type { TraceLink } from '@nexus-engineering/shared'
import { getTraceLinkStore } from './store'
import { customAlphabet } from 'nanoid'

const nanoid = customAlphabet('1234567890abcdef', 10)

export class TraceLinkRepository {
  private store = getTraceLinkStore()

  async getTraceLink(id: string): Promise<TraceLink | undefined> {
    return this.store.findById(id)
  }

  async listTraceLinks(): Promise<TraceLink[]> {
    return this.store.findAll()
  }
    
  async getTraceLinksBySource(sourceType: string, sourceId: string): Promise<TraceLink[]> {
    return this.store.findBySource(sourceType, sourceId)
  }

  async getTraceLinksByTarget(targetType: string, targetId: string): Promise<TraceLink[]> {
    return this.store.findByTarget(targetType, targetId)
  }
    
  async createTraceLink(traceLink: TraceLink): Promise<TraceLink> {
    const newLink = {
      ...traceLink,
      id: nanoid() + '-trace',
      version: '1.0',
      createdAt: traceLink.createdAt instanceof Date ? traceLink.createdAt : new Date(traceLink.createdAt),
      updatedAt: traceLink.updatedAt instanceof Date ? traceLink.updatedAt : new Date(traceLink.updatedAt),
      source: traceLink.source || 'API'
    }
    
    this.store.insert(newLink)
    return newLink
  }
    
  async updateTraceLink(id: string, updates: Partial<TraceLink>): Promise<TraceLink | undefined> {
    const updated = this.store.update(id, updates)
    if (!updated) return undefined
    ;(updated as any).updatedAt = new Date()
    return updated
  }
    
  async deleteTraceLink(id: string): Promise<boolean> {
    return this.store.delete(id)
  }
    
  async clearAll(): Promise<void> {
    this.store.clear()
  }

  static generateId(): string {
    return nanoid() + '-trace'
  }
}

// Singleton for easy access
export const traceLinkRepository = new TraceLinkRepository()