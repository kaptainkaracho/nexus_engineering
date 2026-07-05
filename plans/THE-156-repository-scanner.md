# THE-156: Repository Scanner — Auto-discover engineering artifacts

## Objective
Build artifact detection capabilities into the repository scanner to automatically discover engineering artifacts by file pattern.

## Current State
- `apps/backend/src/scanners/repositoryScanner.ts` exists - scans directories and returns file metadata
- `apps/backend/src/scanners/repositoryScanner.test.ts` - basic smoke test only
- `apps/backend/src/scanners/repositoryReaderUnitTests.ts` - comprehensive tests but expects different API shape
- `apps/backend/src/routes/scanRoutes.ts` - existing scan endpoints (GET-based)

## What's Missing

### 1. Artifact Detectors (Core Feature)
Create pattern-based detection for these artifact types:
- `.req.yaml` - Requirements files
- `.arch.yaml` - Architecture files  
- `ADR-*.md` - Architecture Decision Records
- `.spec.yaml` - Specification files

### 2. Scan Metadata Tracking
Track scan sessions:
- When scan was run
- Files found vs files skipped
- Errors encountered
- Persist scan history (in-memory or SQLite)

### 3. API Endpoints
Refactor existing endpoints to match THE-156 spec:
- `POST /scan` - Trigger a scan (not GET)
- `GET /scan/:id` - Get scan status by ID
- `GET /artifacts` - List discovered artifacts

### 4. Unit Tests
Proper test suite for:
- Artifact detector pattern matching
- Scanner integration with detectors
- API endpoint responses

## Implementation Plan

### Phase 1: Artifact Detector Service
Create `apps/backend/src/scanners/artifactDetector.ts`:
```typescript
export interface ArtifactType {
  type: 'requirement' | 'architecture' | 'adr' | 'spec'
  pattern: RegExp | string
  name: string
}

export interface DetectedArtifact {
  filePath: string
  artifactType: ArtifactType['type']
  metadata: Record<string, unknown>
}

export class ArtifactDetector {
  detectArtifacts(files: FileMetadata[]): DetectedArtifact[]
}
```

### Phase 2: Scan Metadata Store
Create `apps/backend/src/scanners/scanMetadata.ts`:
```typescript
export interface ScanSession {
  id: string
  startedAt: Date
  completedAt?: Date
  repositoryPath: string
  filesFound: number
  filesSkipped: number
  artifactsDetected: number
  errors: Error[]
}

export class ScanMetadataStore {
  createScan(session: ScanSession): string
  getScan(id: string): ScanSession | undefined
  listScans(): ScanSession[]
}
```

### Phase 3: Integrate Detectors into Scanner
Modify `repositoryScanner.ts` to:
1. Run artifact detection after file scan
2. Store scan metadata
3. Return artifacts in scan result

### Phase 4: Update API Endpoints
Update `scanRoutes.ts`:
- Change POST /scan to trigger scan and return scan ID
- Add GET /scan/:id for status
- Ensure GET /artifacts returns detected artifacts

### Phase 5: Unit Tests
Create comprehensive tests in `repositoryScanner.test.ts`:
- Test artifact detection for each pattern
- Test scan metadata persistence
- Test API endpoint responses

## Acceptance Criteria
- [ ] Artifact detector correctly identifies all 4 artifact types
- [ ] Scan metadata persisted and retrievable
- [ ] POST /scan triggers scan and returns scan ID
- [ ] GET /scan/:id returns scan status
- [ ] GET /artifacts lists detected artifacts
- [ ] Unit tests pass
- [ ] `pnpm build` succeeds

## Dependencies
- None (standalone feature)

## Timebox
- Max 12 tool calls
- If blocked >3 iterations, escalate to CEO
