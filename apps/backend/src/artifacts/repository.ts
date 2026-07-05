export interface ArtifactError {
  message: string
  timestamp: string
  context?: Record<string, unknown>
}

export type LifecycleState = 'discovered' | 'parsed' | 'indexed' | 'related' | 'error'
export type ArtifactType = 'requirement' | 'architecture' | 'adr' | 'spec' | 'unknown'

interface DetectedArtifact {
  artifactType: Exclude<ArtifactType, 'unknown'>
  filePath: string
  relativePath: string
  fileName: string
  detectedAt: string
}

export interface Artifact {
  id: string
  type: ArtifactType
  filePath: string
  repositoryPath: string
  lifecycle: LifecycleState
  metadata: Record<string, unknown>
  errors: ArtifactError[]
  reparseCount: number
  createdAt: string
  updatedAt: string
  lastParsedAt?: string
}

export type PatchArtifactInput = Pick<Artifact, 'lifecycle'> & {
  metadata?: Record<string, unknown>
}

function now(): string {
  return new Date().toISOString()
}

export { now }

let idCounter = 0
const nextId = (): string => `art-${++idCounter}`

export class ArtifactRegistry {
  private store = new Map<string, Artifact>()

  create(artifact: Omit<Artifact, 'id' | 'createdAt' | 'updatedAt'>): Artifact {
    const item: Artifact = {
      ...artifact,
      id: nextId(),
      createdAt: now(),
      updatedAt: now(),
    }
    this.store.set(item.id, item)
    return item
  }

  createFromDetected(detected: DetectedArtifact, repositoryPath: string): Artifact {
    return this.create({
      type: detected.artifactType as Exclude<ArtifactType, 'unknown'>,
      filePath: detected.filePath,
      repositoryPath,
      lifecycle: 'discovered',
      metadata: {},
      errors: [],
      reparseCount: 0,
    })
  }

  get(id: string): Artifact | undefined {
    return this.store.get(id)
  }

  getByType(type: ArtifactType): Artifact[] {
    const artifacts = Array.from(this.store.values())
    if (type === 'unknown') {
      return artifacts.filter((a) => a.type === 'unknown' || !Object.prototype.hasOwnProperty.call(a, 'type'))
    }
    return artifacts.filter((a) => a.type === type)
  }

  getAll(): Artifact[] {
    return Array.from(this.store.values())
  }

  update(id: string, partial: PatchArtifactInput): Artifact | null {
    const existing = this.store.get(id)
    if (!existing) return null

    const updated: Artifact = {
      ...existing,
      lifecycle: partial.lifecycle ?? existing.lifecycle,
      metadata: partial.metadata !== undefined ? partial.metadata : existing.metadata,
      updatedAt: now(),
    }

    if (partial.lifecycle === 'parsed') {
      updated.lastParsedAt = now()
    }

    this.store.set(id, updated)
    return updated
  }

  recordError(id: string, message: string, context?: Record<string, unknown>): Artifact | null {
    const existing = this.store.get(id)
    if (!existing) return null

    const error: ArtifactError = { message, timestamp: now(), context }
    const updated: Artifact = {
      ...existing,
      lifecycle: 'error',
      errors: [...existing.errors, error],
      updatedAt: now(),
    }

    this.store.set(id, updated)
    return updated
  }

  incrementReparseCount(id: string): Artifact | null {
    const existing = this.store.get(id)
    if (!existing) return null

    const updated: Artifact = {
      ...existing,
      reparseCount: existing.reparseCount + 1,
      lifecycle: 'discovered',
      updatedAt: now(),
    }

    this.store.set(id, updated)
    return updated
  }

  delete(id: string): boolean {
    return this.store.delete(id)
  }

  getSummary(): { total: number; byType: Record<ArtifactType, number>; byLifecycle: Record<LifecycleState, number> } {
    const artifacts = this.getAll()
    const byType: Record<ArtifactType, number> = {
      requirement: 0,
      architecture: 0,
      adr: 0,
      spec: 0,
      unknown: 0,
    }
    const byLifecycle: Record<LifecycleState, number> = {
      discovered: 0,
      parsed: 0,
      indexed: 0,
      related: 0,
      error: 0,
    }

    for (const a of artifacts) {
      if (Object.prototype.hasOwnProperty.call(byType, a.type)) byType[a.type]++
      if (Object.prototype.hasOwnProperty.call(byLifecycle, a.lifecycle)) byLifecycle[a.lifecycle]++
    }

    return { total: artifacts.length, byType, byLifecycle }
  }
}


