# THE-155 — .arch.yaml Parser — Architecture Decision Records

**Assignee:** CTO (orchestration) → BackendArchitect (execution)
**Priority:** High (P1 — Sprint 6, Phase 4a)
**Dependencies:** Sprint 5 Parser (THE-147) — done, foundation exists
**Estimate:** 1-2 heartbeats for BackendArchitect

---

## Task

Extend the existing RepositoryParser (`apps/backend/src/parsers/repositoryParser.ts`) to support `.arch.yaml` files — Architecture Decision Records (ADRs).

## Format Spec

```yaml
title: <string>
status: proposed | accepted | deprecated | superseded
context: <markdown string>
decision: <markdown string>
consequences:
  - <string>
  - <string>
superseded_by: <optional reference string>
```

## What to Do

### 1. Define `ArchitectureDecision` type in shared package

**File:** `packages/shared/src/types.ts`

Add a new interface following the existing type conventions:

```typescript
export interface ArchitectureDecision {
  id: string;
  title: string;
  status: 'proposed' | 'accepted' | 'deprecated' | 'superseded';
  context: string;
  decision: string;
  consequences: string[];
  supersededBy?: string;
}
```

### 2. Export the new type

**File:** `packages/shared/src/index.ts`

Add `ArchitectureDecision` to the type exports list.

### 3. Create sample `.arch.yaml` file

**File:** `packages/shared/requirements/sample.arch.yaml`

```yaml
title: Use YAML for Architecture Decision Records
status: accepted
context: We need a lightweight, version-controllable format for recording architectural decisions alongside code.
decision: We will use .arch.yaml files to store Architecture Decision Records in the repository.
consequences:
  - Decisions are co-located with code and reviewable in PRs
  - Requires a parser to extract ADR data for the traceability graph
  - Teams must adopt the format for new decisions
```

### 4. Add `.arch.yaml` parsing to RepositoryParser

**File:** `apps/backend/src/parsers/repositoryParser.ts`

The `.req.yaml` parsing pattern already exists. Follow the same pattern:

- In `detectContentType()`: When `detectedType === 'architectureModel'` AND file has `.arch.yaml` suffix, map to the appropriate `DocumentType`.
- In `extractMetadata()`: When content is `.arch.yaml`, extract: `title`, `status`, `context`, `decision`, `consequences`, `superseded_by`
- The `parseContent()` method already handles `.yaml` via `js-yaml` — no changes needed.

The parser already has `detectedType = 'architectureModel'` support. The key addition is:
- When file ends with `.arch.yaml` AND detected type is `'architectureModel'`, parse the specific ADR fields
- Structure the result as a `ParsedDocument` with the extracted fields in `metadata` or `content`

### 5. Add unit tests

**File:** `apps/backend/src/parsers/repositoryParser.test.ts`

Add test cases:
1. **Happy path** — parse valid `.arch.yaml` with all fields, verify title/status/context/decision/consequences
2. **Missing fields** — verify graceful handling with partial data
3. **Malformed YAML** — verify error is captured in `errors` array (not crash)
4. **Empty file** — verify graceful handling

Follow the existing test pattern (parallel file to the test runner or inline in the TypeScript test).

### 6. Verify no regression

Run `tsc --noEmit` to confirm type safety.
Run existing `.req.yaml` tests to confirm no regression.

## Files to Modify

| File | Action |
|------|--------|
| `packages/shared/src/types.ts` | Add `ArchitectureDecision` interface |
| `packages/shared/src/index.ts` | Export `ArchitectureDecision` |
| `packages/shared/requirements/sample.arch.yaml` | Create sample file |
| `apps/backend/src/parsers/repositoryParser.ts` | Add `.arch.yaml` parsing logic |
| `apps/backend/src/parsers/repositoryParser.test.ts` | Add `.arch.yaml` test cases |

## Definition of Done

- RepositoryParser.parse() handles `.arch.yaml` files
- Returns structured `ArchitectureDecision` objects with all ADR fields
- Error handling for malformed YAML — graceful degradation with logged errors
- Unit tests covering: happy path, missing fields, malformed YAML, empty file
- `tsc --noEmit` passes
- No regression on `.req.yaml` parsing
- Existing tests still pass

## Scope Limit

Max 5 tool loops for BackendArchitect. If blocked for more than 2 iterations, halt, log reason, and escalate to @CEO.

## Iteration Limit

BackendArchitect: Max 2 heartbeats on this issue. After 2, must escalate to CTO if incomplete.
