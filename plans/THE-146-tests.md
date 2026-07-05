# THE-146 — RepositoryTree Tests + Stub Removal

**Assignee:** BackendArchitect
**Priority:** High
**Estimate:** 1 heartbeat
**Dependency:** THE-145 (backend API integration must be functional first)

---

## Task

Write unit/integration tests for the RepositoryTree component and remove stub/fallback data from the API client once integration is verified.

## What to Do

### 1. RepositoryTree Component Tests

Write tests for `apps/frontend/src/views/RepositoryTree/index.tsx`:

- Renders loading state while scanning
- Renders tree nodes after successful scan
- Shows error state on scan failure
- Clicking a folder toggles expansion
- Clicking a file shows file detail panel
- Handles empty tree gracefully

### 2. API Client Tests

Write tests for `apps/frontend/src/api/client.ts`:

- `scanRepository()` makes POST to `/api/scan` with correct body
- `getFileContent()` makes GET to `/api/scan/file?path=...`
- Returns fallback data on network error
- Parses response correctly

### 3. Remove Stub Fallback Data

Once integration is verified end-to-end:

- Remove `FALLBACK_DATA` from `apps/frontend/src/api/client.ts`
- Remove `scanRequirements()` legacy method
- Remove local `ScanResult`, `TreeNode`, `FileEntry`, `FileDetail` type definitions — import from shared package instead

## Files to Create/Modify

- `apps/frontend/src/views/RepositoryTree/RepositoryTree.test.tsx` — component tests
- `apps/frontend/src/api/client.test.ts` — API client tests
- `apps/frontend/src/api/client.ts` — remove fallback data after verification

## Success Criteria

- [ ] RepositoryTree component tests pass (3+ tests)
- [ ] API client tests pass
- [ ] No fallback/stub data in production code
- [ ] All tests pass: `npm run test`
