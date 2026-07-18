# THE-158: Remaining Structural Gaps — BackendArchitect Action Items

## Gap 1: Missing `artifactRegistry` Singleton Export

**File:** `apps/backend/src/artifacts/repository.ts`

The `ArtifactRegistry` class exists but there is no singleton export. The following files try to import `artifactRegistry` and fail:

- `apps/backend/src/routes/artifactRegistryRoutes.ts:2` — `import { artifactRegistry, now } from './repository'`

**Fix:** Add to bottom of `repository.ts`:
```typescript
export const artifactRegistry = new ArtifactRegistry()
```

## Gap 2: Wrong Import Path in `artifactRegistryRoutes.ts`

**File:** `apps/backend/src/routes/artifactRegistryRoutes.ts:2`

Import reads `'./repository'` but should read `'../artifacts/repository'`.

**Fix:** Change line 2 from:
```typescript
import { LifecycleState, artifactRegistry, now } from './repository'
```
to:
```typescript
import { LifecycleState, artifactRegistry, now } from '../artifacts/repository'
```

And line 3:
```typescript
import type { ArtifactType } from './repository'
```
to:
```typescript
import type { ArtifactType } from '../artifacts/repository'
```

## Gap 3: `api.ts` Uses Deleted API Surface

**File:** `apps/backend/src/artifacts/api.ts`

The old `ArtifactRepository` API (`listRepositories()`, `getArtifacts()`, `setArtifacts()`, `clearAll()`) no longer exists. `ArtifactRegistry` has:

| Old Call | Replacement |
|----------|-------------|
| `artifactsRepository.listRepositories()` | No equivalent — `ArtifactRegistry` is in-memory flat map, not per-repo. Need to add a `repositoryPath` filter or keep separate registries per path. |
| `artifactsRepository.getArtifacts(repo)` | `artifactRegistry.getAll()` + filter by `repositoryPath` |
| `artifactsRepository.setArtifacts(repo, docs)` | `artifactRegistry.create()` per artifact |
| `artifactsRepository.clearAll()` | Not available — add `clear()` method or iterate delete |

**Decision required:** Should `api.ts` be refactored to use `ArtifactRegistry`, or deprecated entirely in favor of `artifactRegistryRoutes.ts`?

## Gap 4: `index.ts` Scan Handler References Broken APIs

**File:** `apps/backend/src/index.ts`

Three issues:

4a. **Line 3:** `import { artifactsRepository } from './artifacts/repository'` fails — not exported.

4b. **Line 22:** `const { documents, report } = await scanner.scan(repositoryPath)` — `scanner.scan()` returns `{ scanId, fileMetadata, scanReport, artifacts }`. `documents` is undefined; `report` should be `scanReport`.

4c. **Lines 25-28:** Calls `artifactsRepository.setArtifacts()` — needs replacement with `artifactRegistry.createFromDetected()` for each detected artifact.

## Gap 5: Scan → Registry Wiring Missing

**File:** `apps/backend/src/index.ts` (scan handler at lines 14-35)

The scan handler should:
1. Call `scanner.scan()` which already integrates `ArtifactDetector`
2. For each detected artifact in `scanResult.artifacts`, call `artifactRegistry.createFromDetected()`
3. Return scan results with registry enrichment

## Acceptance Criteria for Gap Fix

- [ ] Gap 1: `artifactRegistry` singleton exported from `repository.ts`
- [ ] Gap 2: Import paths corrected in `artifactRegistryRoutes.ts`
- [ ] Gap 3: `api.ts` either refactored or deprecated with clear note
- [ ] Gap 4: `index.ts` no longer references non-existent exports or return values
- [ ] Gap 5: Scan handler creates artifacts through `ArtifactRegistry`
- [ ] `tsc --noEmit` passes
- [ ] `pnpm dev` starts without import errors

## Timebox

Max 1 heartbeat for all 5 gaps. If blocked > 2 iterations, escalate to CTO.
