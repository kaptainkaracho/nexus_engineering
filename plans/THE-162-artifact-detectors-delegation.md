# THE-162 — Artifact Detectors + Scan Metadata

**Parent:** Sprint 6, Wave 2 (Phase 1c)
**Assignee:** CTO (may sub-delegate to BackendArchitect)
**Priority:** High (Sprint 6)
**Dependencies:** THE-158 (Artifact Registry — DONE ✅)
**Estimate:** 1 heartbeat

---

## Task

Wire existing ArtifactDetector patterns into the now-complete ArtifactRegistry so that scan results are persisted with lifecycle tracking and metadata. Also ensure scan sessions produce metadata (timestamps, files found, skipped, errors).

## Context

Phase 1 (THE-156) built the Scanner service with pattern-based ArtifactDetectors. Phase 2 (THE-158) built the ArtifactRegistry with lifecycle states and CRUD endpoints. THE-162 bridges them: detectors register artifacts into the registry during scans.

The ArtifactDetector already exists at `apps/backend/src/scanner/detectors/` (THE-156 delivered this). The ArtifactRegistry is at `apps/backend/src/artifacts/` (THE-158 delivered this, verified complete). The scanner entrypoint is `apps/backend/src/scanner/index.ts`.

## Implementation Steps

### 1. Verify THE-158 Registry exports are importable

Confirm the singleton export from `apps/backend/src/artifacts/repository.ts` resolves:
```typescript
import { artifactRegistry } from '../artifacts/repository';
```

### 2. Wire detectors into scanner flow

In `apps/backend/src/scanner/index.ts`, after artifact detection:
- For each detected artifact, call `artifactRegistry.registerArtifact(type, path, metadata)`
- Set initial lifecycle state to `discovered`
- Attach scan session ID for traceability

### 3. Add scan metadata tracking

- Create a `ScanSession` type or extend existing scan state with:
  - `sessionId: string`
  - `startedAt: Date`
  - `completedAt?: Date`
  - `filesFound: number`
  - `filesSkipped: number`
  - `errors: ScanError[]`
- Store session in registry or a dedicated in-memory/DB store
- Expose via `GET /scan/:id` (if endpoint exists from THE-156) or add new route

### 4. Verify end-to-end

- Run `tsc --noEmit` to confirm type safety
- Trigger a scan, verify artifacts appear in registry with correct lifecycle state

## Files to Modify

| File | Action |
|------|--------|
| `apps/backend/src/scanner/index.ts` | Wire ArtifactDetector results into ArtifactRegistry |
| `apps/backend/src/artifacts/repository.ts` | Verify singleton exports match scanner import paths |
| Possibly new: scan session module | If metadata store doesn't exist |

## Definition of Done

- ArtifactDetectors register discovered artifacts into ArtifactRegistry during scan
- Each artifact has lifecycle state `discovered` and associated scan session ID
- Scan metadata tracked (timestamps, counts, errors)
- `tsc --noEmit` passes
- Existing tests pass (THE-156 + THE-158 regression-free)

## Scope Limit

Max 3 tool loops. If blocked for more than 2 iterations, halt, log reason, and escalate to @CEO.

## Iteration Limit

Max 1 heartbeat. If incomplete after 1, escalate to CEO with status report.
