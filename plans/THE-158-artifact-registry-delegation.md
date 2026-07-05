# THE-158: Artifact Registry — Central artifact storage with lifecycle tracking

## Objective
Extend the existing artifact storage into a full registry with lifecycle states, status tracking, and re-parse capability.

## Current State
- `apps/backend/src/artifacts/repository.ts` — In-memory `Map` based artifact store
- `apps/backend/src/artifacts/api.ts` — Basic CRUD endpoints under `/api/v1/artifacts/*`
- `apps/backend/src/scanners/repositoryScanner.ts` — Scanner exists (THE-156 done)
- `apps/backend/src/routes/scanRoutes.ts` — Scanner API endpoints
- Scanner already stores artifacts: `index.ts` creates `artifactsRepository.setArtifacts()` on scan

## What's Missing

### 1. Artifact Lifecycle States
Add lifecycle tracking to the artifact model:
- `discovered` — File found by scanner
- `parsed` — File content parsed successfully
- `indexed` — Parsed data added to graph
- `related` — Relationships to other artifacts established
- `error` — Parse failure with error details

### 2. Status Tracking
Per-artifact tracking:
- Parse status (discovered/parsed/indexed/related/error)
- Error messages and timestamps
- Re-parse count
- Last modified timestamp

### 3. New API Endpoints
Add endpoints matching the spec:
- `GET /artifacts/:type` — Get artifacts by type (req, arch, adr, spec)
- `PATCH /artifacts/:id` — Update artifact lifecycle/status/metadata
- `POST /artifacts/:id/reparse` — Trigger re-parse of an artifact

### 4. Wire Scanner → Registry
Scanner already stores results in artifact repository. Ensure:
- Scanner results flow through lifecycle states (discovered → parsed)
- Parse errors are captured and stored
- Registry exposes aggregate data (count by type, by status)

## Implementation Plan

### Phase 1: Extend Artifact Model
Refactor `apps/backend/src/artifacts/repository.ts`:
```typescript
interface Artifact {
  id: string
  type: 'requirement' | 'architecture' | 'adr' | 'spec' | 'unknown'
  filePath: string
  repositoryPath: string
  lifecycle: 'discovered' | 'parsed' | 'indexed' | 'related' | 'error'
  metadata: Record<string, unknown>
  errors: { message: string; timestamp: string }[]
  reparseCount: number
  createdAt: string
  updatedAt: string
  lastParsedAt?: string
}

class ArtifactRegistry {
  getArtifactsByType(type: string): Artifact[]
  getArtifact(id: string): Artifact | undefined
  updateArtifact(id: string, update: Partial<Artifact>): Artifact
  createArtifact(artifact: Omit<Artifact, 'id'>): Artifact
  deleteArtifact(id: string): void
}
```

### Phase 2: Add Lifecycle Management
Extend the registry with lifecycle transitions:
- `discovered → parsed` — After successful parse
- `discovered → error` — On parse failure with error detail
- `parsed → indexed` — After graph indexing
- `indexed → related` — After relationship detection

### Phase 3: API Endpoints
Add to `apps/backend/src/artifacts/api.ts` or create `apps/backend/src/routes/artifactRegistryRoutes.ts`:
- `GET /api/v1/artifacts/type/:type` — Filter by type
- `PATCH /api/v1/artifacts/:id` — Update lifecycle/status
- `POST /api/v1/artifacts/:id/reparse` — Trigger re-parse

### Phase 4: Wire Scanner Integration
In `index.ts`, update the scan handler to:
1. Create artifacts with lifecycle: 'discovered'
2. After parsing: update to 'parsed' (or 'error')
3. Return enriched registry response

## Acceptance Criteria
- [ ] Artifact lifecycle states functional (discovered → parsed → indexed → related → error)
- [ ] `GET /artifacts/:type` returns filtered artifacts
- [ ] `PATCH /artifacts/:id` updates artifact status
- [ ] `POST /artifacts/:id/reparse` triggers re-parse
- [ ] Scanner results flow through lifecycle correctly
- [ ] Parse errors captured and stored
- [ ] `pnpm build` passes

## Dependencies
- THE-156 (Scanner) ✅ DONE
- Existing artifact CRUD already in place

## Timebox
- Max 12 tool calls
- If blocked >3 iterations, escalate to CTO
