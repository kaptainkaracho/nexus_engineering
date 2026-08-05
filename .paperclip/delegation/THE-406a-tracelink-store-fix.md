# THE-406a: Fix TraceLinkStore Test Interface Mismatches

**Parent:** THE-406 — Sprint 26 W4: Sprint 26 E2E Verification
**Delegate:** BackendArchitect
**Priority:** high
**Status:** queued (awaiting agent slot)

## Summary

`apps/backend/src/traceabilityLinks/store.test.ts` has 17 TypeScript errors due to interface mismatches between the test code and the actual implementation. The test was written against an older or assumed API signature that doesn't match the current `store.ts` and `BaseEntity` type definitions.

## Errors to Fix

### Error 1: `insert()` return type (store.ts:11,41)
- **Current:** `insert(traceLink: TraceLink): void`
- **Fix:** Change to `insert(traceLink: TraceLink): TraceLink`, return `this.database.insert(traceLink)`
- The underlying `database.ts:57` already returns `TraceLink`

### Error 2: `getTraceLinkStore()` parameter (store.ts:57)
- **Current:** `getTraceLinkStore(): TraceLinkStore` (0 args)
- **Fix:** Add `databasePath?: string` parameter, thread through to `getTraceLinkDatabase(databasePath)`
- Also inject path into `SQLiteTraceLinkStore` constructor
- **Singleton caveat:** `getTraceLinkDatabase()` is a singleton. For test isolation, add `resetForTest()` method

### Error 3: Date → IsoDateString (15+ locations in store.test.ts)
- **Root:** `BaseEntity.createdAt`/`updatedAt` are `IsoDateString` (string), tests pass `Date` objects
- **Fix:** Replace all `new Date()` with `new Date().toISOString()` in TraceLink literals

### Error 4: Undefined `store` variable (store.test.ts:299)
- **Fix:** Add `const { getTraceLinkStore } = await import(...)` + `const store = getTraceLinkStore(TEST_DB_PATH)` preamble

### Error 5: Dead constructor access (store.test.ts:268)
- **Fix:** Remove `new (...).constructor()` line, use `getTraceLinkStore(TEST_DB_PATH)` instead

### Error 6: Validation expectation mismatch (store.test.ts:299-308)
- Test expects "Missing required field" error, but no validation layer exists
- **Option A:** Add validation guard in `TraceLinkDatabase.insert()`
- **Option B:** Update test assertion to match SQLite constraint error

## Artifact Storage Test Failures (separate issue)

6 test files fail with `EACCES: permission denied, mkdir '/data'` because `ArtifactStorage` defaults to an absolute `/data` path. This is tracked separately as THE-406b.

## Success Criteria

- `pnpm typecheck` passes with 0 errors
- `pnpm test` passes for all traceabilityLinks tests
- No breaking changes to the store API
