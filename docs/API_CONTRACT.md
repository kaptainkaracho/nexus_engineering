# API Contract — Nexus Repository Tree Integration

**Issue:** THE-144
**Status:** Draft
**Author:** CTO
**Date:** 2026-07-05

---

## Purpose

Define the API contract between the frontend RepositoryTree component and the backend scanner endpoints. Both sides must align to these shapes for end-to-end integration.

---

## Endpoints

### 1. POST /api/scan

Trigger a repository scan and return a hierarchical tree structure.

**Request:**

```json
{
  "repositoryPath": "."
}
```

**Success Response (200):**

```json
{
  "files": [
    {
      "path": "/abs/path/to/file.ts",
      "relativePath": "relative/path/to/file.ts",
      "contentType": "text"
    }
  ],
  "tree": [
    {
      "id": "unique-node-id",
      "name": "src",
      "type": "folder",
      "path": "/abs/path/to/src",
      "children": [
        {
          "id": "unique-file-id",
          "name": "index.ts",
          "type": "file",
          "path": "/abs/path/to/src/index.ts",
          "language": "typescript",
          "fileSize": 1234,
          "lastModified": "2026-07-05T10:00:00.000Z"
        }
      ]
    }
  ],
  "warnings": []
}
```

**Error Response (400/500):**

```json
{
  "error": "Scan failed: <reason>"
}
```

### 2. GET /api/scan/file?path=<encoded-path>

Return file content for a specific absolute path.

**Success Response (200):**

```json
{
  "path": "/abs/path/to/file.ts",
  "content": "file contents here...",
  "extension": "ts",
  "language": "typescript",
  "fileSize": 1234
}
```

**Error Response (404/500):**

```json
{
  "error": "File not found: <path>"
}
```

---

## Types (Shared Contract)

### TreeNode

```ts
interface TreeNode {
  id: string;
  name: string;
  type: 'folder' | 'file';
  path: string;
  language?: string;
  fileSize?: number;
  lastModified?: string;
  children?: TreeNode[];
}
```

### FileEntry (Scan Result)

```ts
interface FileEntry {
  path: string;
  relativePath: string;
  contentType: 'text' | 'binary';
}
```

### FileDetail (File Content)

```ts
interface FileDetail {
  path: string;
  content: string;
  extension: string;
  language?: string;
  fileSize?: number;
}
```

---

## Required Changes

### Backend (THE-145)

1. **Fix import in `apps/backend/src/index.ts`**: Change `import { scanner }` to `import { repositoryScanner as scanner }` (named export mismatch)
2. **Rewrite `POST /scan` handler** to:
   - Accept `{ repositoryPath }` body
   - Call `repositoryScanner.scan(repositoryPath)` (returns `{ fileMetadata, report }`)
   - Convert flat `FileMetadata[]` into hierarchical `TreeNode[]` tree
   - Return the tree + flat files list structure defined above
3. **Add `GET /api/scan/file?path=<path>` endpoint** that reads file content from disk and returns `FileDetail`
4. **Add CORS** for frontend dev origin (`http://localhost:5173` or `http://localhost:3000`)
5. **Add shared types** `TreeNode`, `FileDetail` to `packages/shared/src/types.ts` or keep local to the scan module

### Frontend

1. Remove local `ScanResult`, `TreeNode`, `FileEntry`, `FileDetail` type definitions from `apps/frontend/src/api/client.ts` — import from shared package instead (after backend publishes them)
2. Remove `FALLBACK_DATA` and `scanRequirements()` legacy method once integration is verified

---

## Verification

1. `POST /api/scan` returns valid tree — verify with curl or browser
2. `GET /api/scan/file?path=...` returns file content
3. RepositoryTree component renders tree and loads file content on click
4. No console errors in frontend
