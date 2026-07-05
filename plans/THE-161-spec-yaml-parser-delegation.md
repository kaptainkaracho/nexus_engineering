# THE-161 — .spec.yaml Parser — Specification Documents

**Parent:** THE-157 (Parser Extensions)
**Assignee:** BackendArchitect (execution after THE-160)
**Priority:** High (Sprint 6, Phase 4c)
**Dependencies:** THE-155 (.arch.yaml parser) — pattern established
**Estimate:** 1-2 heartbeats for BackendArchitect

---

## Task

Extend the existing RepositoryParser (`apps/backend/src/parsers/repositoryParser.ts`) to support `.spec.yaml` files — Specification Documents that describe system specifications with requirement references.

## Format Spec

Specification documents use the following YAML structure:

```yaml
id: spec-001
title: "User Authentication Specification"
version: "1.0.0"
status: draft  # draft | review | approved | deprecated
domain: security

overview: |
  This specification defines the user authentication system requirements.

requirements:
  - id: REQ-AUTH-001
    description: System shall support email/password authentication
    priority: critical
  - id: REQ-AUTH-002
    description: Passwords must be stored using bcrypt hashing
    priority: critical

interfaces:
  - name: POST /api/auth/login
    description: Authenticate user credentials
    request: |
      { "email": string, "password": string }
    response: |
      { "token": string, "expiresIn": number }

dependencies:
  - spec-002  # User Profile Specification
  - REQ-DB-001  # Database Requirements

traceLinks:
  - sourceId: spec-001
    targetId: REQ-AUTH-001
    type: satisfies
```

### Top-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | yes | Unique spec identifier |
| `title` | string | yes | Specification title |
| `version` | string | no | Semver version |
| `status` | string | no | `draft`, `review`, `approved`, `deprecated` |
| `domain` | string | no | Domain category |
| `overview` | string | no | Markdown description |
| `requirements` | array | no | Embedded requirement references |
| `interfaces` | array | no | API/service interface definitions |
| `dependencies` | array | no | Dependent spec/requirement IDs |
| `traceLinks` | array | no | Trace links to requirements |

### Requirements Entry (`requirements[]`)

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Requirement identifier |
| `description` | string | Requirement text |
| `priority` | string | `low`, `medium`, `high`, `critical` |

### Interface Entry (`interfaces[]`)

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Interface name or endpoint path |
| `description` | string | Interface purpose |
| `request` | string | Request format description |
| `response` | string | Response format description |

## What to Do

### 1. Create sample `.spec.yaml` file

**File:** `packages/shared/requirements/sample.spec.yaml`

Create a sample specification file following the format spec above. Include at least 2 requirements and 1 interface.

### 2. Add `SpecDocument` type to shared package

**File:** `packages/shared/src/types.ts`

```typescript
export interface SpecDocument {
  id: string;
  title: string;
  version?: string;
  status?: 'draft' | 'review' | 'approved' | 'deprecated';
  domain?: string;
  overview?: string;
  requirements?: SpecRequirement[];
  interfaces?: SpecInterface[];
  dependencies?: string[];
  traceLinks?: SpecTraceLink[];
}

export interface SpecRequirement {
  id: string;
  description: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

export interface SpecInterface {
  name: string;
  description?: string;
  request?: string;
  response?: string;
}

export interface SpecTraceLink {
  sourceId: string;
  targetId: string;
  type: string;
}
```

### 3. Add `.spec.yaml` parsing to RepositoryParser

**File:** `apps/backend/src/parsers/repositoryParser.ts`

The existing `.yaml` parsing via `js-yaml` handles the file content. The additions needed:

- **In `detectContentType()`**: When file has `.spec.yaml` suffix, map to document type appropriate for spec (likely a new handling in the detectedType flow, or map to one of the existing DocumentTypes).
- **In `extractMetadata()`**: When content is `.spec.yaml`, extract `id`, `title`, `version`, `status`, `domain`, `overview` into metadata.
- **In `extractTraceLinks()`**: When file is `.spec.yaml`, extract the `traceLinks` array from the spec document body (similar to the existing `.req.yaml` trace link extraction pattern).
- **Store interfaces/requirements**: Store `requirements` and `interfaces` arrays in `metadata.requirements` and `metadata.interfaces`.

The parser already handles YAML files via `parseContent()`. The key is adding `.spec.yaml` routing in the type detection and metadata extraction steps.

### 4. Add unit tests

**File:** `apps/backend/src/parsers/repositoryParser.test.ts`

Add test cases:
1. **Happy path** — parse valid `.spec.yaml` with all fields, verify metadata extraction
2. **Minimal spec** — only id + title (no optional fields)
3. **Trace links** — verify trace links extracted from spec body
4. **Malformed YAML** — verify error captured gracefully in errors array
5. **No trace links** — verify empty trace links array

### 5. Verify no regression

Run `tsc --noEmit` to confirm type safety.
Run existing tests (`npx vitest run` in backend) to confirm no regression.

## Files to Modify

| File | Action |
|------|--------|
| `packages/shared/src/types.ts` | Add `SpecDocument`, `SpecRequirement`, `SpecInterface`, `SpecTraceLink` interfaces |
| `packages/shared/src/index.ts` | Export new types |
| `packages/shared/requirements/sample.spec.yaml` | Create sample file |
| `apps/backend/src/parsers/repositoryParser.ts` | Add `.spec.yaml` routing + field extraction |
| `apps/backend/src/parsers/repositoryParser.test.ts` | Add `.spec.yaml` test cases |

## Definition of Done

- New types exported from shared package
- Sample `.spec.yaml` file in requirements directory with all field types
- `RepositoryParser.parse()` handles `.spec.yaml` files — extracts id, title, version, status, domain, overview
- Requirements and interfaces stored in document metadata
- Trace links extracted from spec body (not just metadata)
- Non-`.spec.yaml` YAML files unaffected (no regression)
- Error handling for malformed YAML — graceful degradation
- Unit tests covering: happy path, minimal, trace links, malformed, no trace links
- `tsc --noEmit` passes
- Existing tests still pass

## Scope Limit

Max 3 tool loops for BackendArchitect. If blocked for more than 2 iterations, halt, log reason, and escalate to @CEO.

## Iteration Limit

BackendArchitect: Max 2 heartbeats on this issue. After 2, must escalate to CTO if incomplete.
