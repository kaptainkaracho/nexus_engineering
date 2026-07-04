# THE-118 CTO Disposition — Fix getExternalArtifactLookup Bug + Schema Validation

**Issue:** THE-118 — [S4-1a] Fix getExternalArtifactLookup Bug + Schema Validation
**Date:** 2026-07-04
**Author:** CTO (f3b65fd2-33db-4538-8cf6-d336adb5ed96)
**Status:** DELEGATED — In progress via child issues

## Executive Summary

THE-118 decomposes into two backend bugs in `packages/shared/src/requirements/loader.ts`, both delegated to BackendArchitect as child issues THE-128 and THE-129. BA is executing THE-128 (single-runner).

## Bug Analysis

### Bug 1: `getExternalArtifactLookup` logic error (`loader.ts:177-189`)

**File:** `packages/shared/src/requirements/loader.ts`

**Root cause:** Two bugs in one method:

1. **Guard clause skips first occurrence** (line 181):
   ```typescript
   if (!docId || !result[docId]) {
     continue;
   }
   ```
   `!result[docId]` is `true` on first encounter (undefined → falsy), so the first document per docId is skipped. Line 186 (`result[docId] = []`) is unreachable for first occurrences.

2. **Never populates requirement IDs** (line 186):
   ```typescript
   result[docId] = [];
   ```
   Sets an empty array but never pushes requirement IDs from `doc.requirements` into it.

**Fix:** Guard on `!docId` only. Initialize `result[docId]` separately. Iterate requirements and push IDs.

### Bug 2: Schema validation not wired (`loader.ts:42-58`)

**File:** `packages/shared/src/requirements/loader.ts`

**Root cause:** The `loadRequirementFile` method has a TODO comment at line 47-51 but never validates the loaded YAML against `reqDocSchema` from `./schema.ts`.

**Fix:** Import `reqDocSchema`, compile with `this.ajv.compile(reqDocSchema)`, and validate the doc. Throw descriptive error on failure.

## Delegation

| Child Issue | Status | Assignee | Description |
|---|---|---|---|
| THE-128 | `in_progress` | BackendArchitect | Fix getExternalArtifactLookup logic bug |
| THE-129 | `todo` | BackendArchitect | Wire up reqDocSchema validation |

## Pipeline State

- **BA:** `running` — executing THE-128
- **FA:** `idle`
- **UX:** `idle`
- **QA:** `idle`
- **Global runner slots:** 1/2 used (BA)

## Verification

When both child issues are complete:
1. `npm run typecheck` passes
2. `getExternalArtifactLookup` correctly indexes all requirement IDs by document
3. `loadRequirementFile` validates docs against `reqDocSchema` and throws on invalid input
