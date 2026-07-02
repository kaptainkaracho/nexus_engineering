# RFC-001: Requirements as Code — File Format & API Contract

**Status:** Draft  
**Author:** CTO  
**Date:** 2026-07-02  
**Issue:** THE-76 (Phase 1 of "As Code" approach)

---

## 1. Summary

Define a YAML-based file format for requirements that can be stored in a repository alongside source code. Phase 1 covers: format spec, file-system loader, validation, and a read-only API.

---

## 2. File Format

Requirements live as `.req.yaml` files in any directory. Each file is a document set of one or more requirements with shared metadata.

### 2.1 Document Structure

```yaml
# /path/to/requirements/authentication.req.yaml
nexus:
  schema: req-doc/v1
  metadata:
    domain: Authentication
    version: 1.0.0
    source: docs/requirements/authentication.req.yaml

requirements:
  - id: REQ-AUTH-001
    type: functional
    title: User Login with Email
    description: The system MUST allow a user to log in using their email and password.
    priority: high
    status: approved
    tags:
      - auth
      - security

  - id: REQ-AUTH-002
    type: non-functional
    title: Session Timeout
    description: Sessions MUST expire after 30 minutes of inactivity.
    priority: medium
    status: proposed
    tags:
      - auth
```

### 2.2 Schema Rules

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `nexus.schema` | string | yes | Must be `req-doc/v1` |
| `nexus.metadata.domain` | string | yes | Domain grouping |
| `nexus.metadata.version` | string | yes | semver |
| `nexus.metadata.source` | string | yes | Relative repo path |
| `requirements[].id` | string | yes | Uppercase prefix + numeric, e.g. `REQ-AUTH-001` |
| `requirements[].type` | enum | yes | `functional`, `non-functional`, `system`, `user` |
| `requirements[].title` | string | yes | Max 120 chars |
| `requirements[].description` | string | yes | Markdown-supported |
| `requirements[].priority` | enum | yes | `low`, `medium`, `high`, `critical` |
| `requirements[].status` | enum | yes | `proposed`, `approved`, `rejected`, `implemented`, `verified` |
| `requirements[].tags` | string[] | no | Keywords for filtering |

---

## 3. Package: `packages/shared/src/requirements/`

### 3.1 `schema.ts` — JSON Schema for validation

Export the `reqDocSchema` JSON Schema (draft-07) that validates the YAML file structure. Reuse `RequirementSchema` from `packages/shared/src/types.ts` for individual requirement objects.

Implementation by BackendArchitect:
- Import `RequirementSchema` from `../types`
- Build parent `reqDocSchema` wrapping an array of requirements with `nexus` metadata block
- Export both schemas as typed constants
- Add `yaml` handling: YAML frontmatter support is deferred (Phase 2), YAML files are parsed as whole documents

### 3.2 `format.ts` — TypeScript interfaces for req-doc

Export the NexusDocument wrapper type:

```typescript
interface NexusMetadata {
  schema: 'req-doc/v1';
  domain: string;
  version: string;
  source: string;
}

interface NexusDocument {
  nexus: NexusMetadata;
  requirements: Requirement[];
}
```

Implementation: Import `Requirement` from `../types`, define the two interfaces above, export them.

### 3.3 `loader.ts` — File system loader

Read `.req.yaml` files from a given directory path, parse them, validate, and return structured results.

```typescript
interface LoadResult {
  documents: NexusDocument[];
  errors: LoadError[];
}

interface LoadError {
  filePath: string;
  message: string;
}
```

Implementation by BackendArchitect:
- Use `fs.readdirSync` + recursive walk or glob pattern `**/*.req.yaml`
- Parse each file with `js-yaml`
- Validate with `ajv` against `reqDocSchema`
- Collect errors per file (don't abort on first error)
- Return `LoadResult`

---

## 4. API Endpoints

All endpoints under `/api/requirements`:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/requirements` | List all loaded requirement documents |
| GET | `/api/requirements/:id` | Get single requirement by ID |
| GET | `/api/requirements/domain/:domain` | Filter by domain |
| POST | `/api/requirements/scan` | Trigger rescan of repository path (returns `LoadResult`) |

Add to `apps/backend/src/routes/requirements.ts`.

---

## 5. Trace Link Integration (Post-Phase 1)

Phase 2 will add `traceLinks` to the requirement document format:

```yaml
requirements:
  - id: REQ-AUTH-001
    # ... existing fields ...
    traceLinks:
      - targetId: TC-AUTH-001
        targetType: testCase
        relationshipType: verifies
        confidence: high
```

This is deferred — Phase 1 is read-only discovery only.

---

## 6. Implementation Order (for BackendArchitect)

1. **`packages/shared/src/requirements/schema.ts`** — Export `reqDocSchema` JSON Schema
2. **`packages/shared/src/requirements/format.ts`** — Export `NexusMetadata`, `NexusDocument`
3. **`packages/shared/src/requirements/loader.ts`** — Export `loadRequirements()`, `LoadResult`, `LoadError`
4. **`apps/backend/src/routes/requirements.ts`** — Register Fastify routes
5. **Integration test** — Add `.req.yaml` fixture, verify round-trip

---

## 7. Sample Fixture

A sample file `packages/shared/requirements/sample.req.yaml` should be created for testing:

```yaml
nexus:
  schema: req-doc/v1
  metadata:
    domain: Sample
    version: 1.0.0
    source: packages/shared/requirements/sample.req.yaml

requirements:
  - id: REQ-SAMPLE-001
    type: functional
    title: Sample Requirement
    description: This is a test requirement for validation.
    priority: low
    status: proposed
    tags:
      - sample
```

---

## 8. Dependencies

- `js-yaml` — Add to `apps/backend/package.json` and `packages/shared/package.json` (if separate)
- `ajv` — Already available in workspace; add explicit dep in backend if needed
