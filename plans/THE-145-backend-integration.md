# THE-145 — Backend API Integration

**Assignee:** BackendArchitect
**Priority:** High
**Estimate:** 1 heartbeat
**Dependencies:** None (API contract defined in docs/API_CONTRACT.md)

---

## Task

Integrate the backend `/scan` and `/scan/file` endpoints to serve the RepositoryTree frontend component.

## What to Do

### 1. Fix import in `apps/backend/src/index.ts`

```ts
// Current (broken):
import { scanner } from './scanners/repositoryScanner'

// Fix:
import { repositoryScanner as scanner } from './scanners/repositoryScanner'
```

### 2. Rewrite `POST /scan` handler

The current handler at `apps/backend/src/index.ts:13-34` is broken — it destructures `{ documents, report }` but `RepositoryScanner.scan()` returns `{ fileMetadata, report }`.

Rewrite to:
1. Call `repositoryScanner.scan(repositoryPath)` → `{ fileMetadata, report }`
2. Convert flat `FileMetadata[]` into hierarchical `TreeNode[]` tree (structure defined in `docs/API_CONTRACT.md`)
3. Build a flat `FileEntry[]` list from the metadata
4. Collect any warnings from `report.errors`
5. Return `{ files: FileEntry[], tree: TreeNode[], warnings: string[] }`

### 3. Add `GET /api/scan/file?path=<encoded-path>` endpoint

- Read file content from disk using `fs.readFile(path, 'utf-8')`
- Detect extension/language from the filename
- Return `{ path, content, extension, language, fileSize }`

### 4. Add CORS

Add Fastify `@fastify/cors` plugin, allowing `http://localhost:5173` and `http://localhost:3000`.

## Files to Modify

- `apps/backend/src/index.ts` — fix import, rewrite POST /scan, add GET /scan/file
- `apps/backend/package.json` — add `@fastify/cors` dependency if needed

## Verification

```bash
curl -X POST http://localhost:3001/scan -H 'Content-Type: application/json' -d '{"repositoryPath":"."}' | jq '.tree | length'
# Should return > 0

curl 'http://localhost:3001/scan/file?path=$(pwd)/package.json' | jq '.content'
# Should return file contents
```

## Success Criteria

- [ ] `POST /scan` returns `{ files: [], tree: [], warnings: [] }` with real data
- [ ] `GET /scan/file?path=` returns file content
- [ ] CORS allows frontend dev server origin
- [ ] No TypeScript or runtime errors
