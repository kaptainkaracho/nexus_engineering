# THE-97: S3-1a-ROUTES — Wire Up Backend Routes

**Status:** Queued (BackendArchitect — after THE-100, THE-96)
**Priority:** P1
**Sprint:** S3-1a (Requirements Schema Definition — route layer)
**Original plan:** `/docs/SPRINT-3-PLAN.md`

---

## Summary

The four RFC-001 requirements API endpoints exist in `apps/backend/src/routes/requirements.ts` and are registered in `apps/backend/src/index.ts:54`. However, the implementation has a **critical runtime bug** — the path resolution for requirement YAML files points to a nonexistent directory. Routes compile but will return empty/error responses.

---

## Bugs Found

### 1. Critical — Wrong relative path (lines 111, 152, 180)

```typescript
const reqDir = path.join(__dirname, '../../packages/shared/requirements')
```

From `apps/backend/src/routes/`, this resolves to `apps/backend/packages/shared/requirements` — **which does not exist**.

**Fix:** Change to `../../../packages/shared/requirements` to reach the workspace root's `packages/` directory.

Better: Use a configurable approach. See Improvement 4 below.

### 2. Heavy `any` types throughout

`mapArtefacts()` returns `any[]` for all artefact types. Route handlers cast params and body with `as any`. Should use shared types from `@nexus-engineering/shared`:
- `Requirement`, `ArchitectureModel`, `SoftwareComponent`, `TestCase`, `TraceLink` from `packages/shared/src/types.ts`
- Route params should be properly typed

### 3. Inconsistent response format

Artifact API (`artifacts/api.ts`) uses `{ success: true, data: ... }` envelope. Requirements routes return flat objects `{ requirements, total, ... }`. Pick one format and apply everywhere.

### 4. Missing route tests

No tests exist for requirements endpoints. The sprint plan's DoD requires "Unit tests for schema validation."

---

## Files to Modify

| File | Change |
|------|--------|
| `apps/backend/src/routes/requirements.ts` | Fix path resolution, add type safety, standardize response format |
| `apps/backend/src/config.ts` (new) | Add config module for requirements dir path (optional, see Improvement 4) |

---

## Implementation Steps (in order)

### Step 1: Fix path resolution bug

In `requirements.ts`, change every occurrence of:
```typescript
const reqDir = path.join(__dirname, '../../packages/shared/requirements')
```
to:
```typescript
const reqDir = path.resolve(process.cwd(), '../../packages/shared/requirements')
```

Or create a config module at `apps/backend/src/config.ts`:
```typescript
import * as path from 'path'
export const REQUIREMENTS_DIR = path.resolve(process.cwd(), 'packages/shared/requirements')
```

Then import and use in routes:
```typescript
import { REQUIREMENTS_DIR } from '../config'
```

### Step 2: Add type safety

Replace `any` types in `mapArtefacts` and route handlers with types from shared package:
```typescript
import type { Requirement, ArchitectureModel, SoftwareComponent, TestCase, TraceLink } from '@nexus-engineering/shared'
```

### Step 3: Standardize response format

Pick one format (recommended: flat like current requirements routes, not the `{ success, data }` envelope which adds nesting without benefit) and apply consistently.

### Step 4: Add route tests

Create `apps/backend/src/routes/requirements.test.ts` covering:
- `GET /api/requirements` returns artefact structure
- `GET /api/requirements/:id` returns single requirement
- `GET /api/requirements/domain/:domain` filters correctly
- `POST /api/requirements/scan` with valid/invalid paths
- All error cases (404, 500)

### Step 5: Verify end-to-end

```bash
# Start server
cd apps/backend && pnpm dev

# Test endpoints
curl http://localhost:3001/api/requirements
curl http://localhost:3001/api/requirements/REQ-001
curl http://localhost:3001/api/requirements/domain/Sample
curl -X POST http://localhost:3001/api/requirements/scan \
  -H 'Content-Type: application/json' \
  -d '{"repositoryPath": "./packages/shared/requirements"}'
```

---

## Verification

1. `cd apps/backend && pnpm run build` — compiles without errors
2. Server starts on port 3001 without crash
3. `curl localhost:3001/api/requirements` returns non-empty artefact list
4. `curl localhost:3001/api/requirements/REQ-001` returns a requirement (or 404 with proper error shape)
