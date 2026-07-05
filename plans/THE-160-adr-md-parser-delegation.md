# THE-160 — ADR-*.md Parser — Architecture Decision Records (Markdown)

**Parent:** THE-157 (Parser Extensions)
**Assignee:** BackendArchitect (execution after THE-155)
**Priority:** High (Sprint 6, Phase 4b)
**Dependencies:** THE-155 (.arch.yaml parser) — pattern established
**Estimate:** 1-2 heartbeats for BackendArchitect

---

## Task

Extend the existing RepositoryParser (`apps/backend/src/parsers/repositoryParser.ts`) to support `ADR-<number>-<title>.md` files — Architecture Decision Records in Markdown format with YAML frontmatter.

## Format Spec

ADR files follow the standard Markdown + YAML frontmatter pattern:

```markdown
---
title: "Use YAML for Architecture Decision Records"
status: "accepted"
date: "2026-07-01"
superseded_by: "ADR-003"
---

# Context

We need a lightweight, version-controllable format for recording architectural decisions alongside code.

# Decision

We will use ADR-*.md files with YAML frontmatter to store Architecture Decision Records in the repository.

# Consequences

- Decisions are co-located with code and reviewable in PRs
- Requires a parser to extract ADR data for the traceability graph
- Teams must adopt the format for new decisions
```

### Frontmatter Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | yes | Decision title |
| `status` | string | yes | `proposed`, `accepted`, `deprecated`, `superseded` |
| `date` | string (ISO) | no | Decision date |
| `superseded_by` | string | no | Reference to superseding ADR |

### Body Sections (parsed from Markdown headings)

| Heading | Field | Description |
|---------|-------|-------------|
| `# Context` | `context` | Background and motivation |
| `# Decision` | `decision` | The decision made |
| `# Consequences` | `consequences` | List of consequences |

## What to Do

### 1. Create sample `ADR-001-example.md` file

**File:** `packages/shared/requirements/ADR-001-example.md`

Create a sample ADR file following the format spec above. Include all fields and at least 2 body sections.

### 2. Add `ADREntry` type to shared package (or use ArchitectureDecision)

**File:** `packages/shared/src/types.ts`

If THE-155's `ArchitectureDecision` interface already exists in shared types, re-use it. If not, add:

```typescript
export interface ADREntry {
  id: string;
  title: string;
  status: 'proposed' | 'accepted' | 'deprecated' | 'superseded';
  date?: string;
  context: string;
  decision: string;
  consequences: string[];
  supersededBy?: string;
}
```

### 3. Add `ADR-*.md` parsing to RepositoryParser

**File:** `apps/backend/src/parsers/repositoryParser.ts`

The parser already handles `.md` files with YAML frontmatter extraction (lines 204-219). The additions needed:

- **In `detectContentType()`**: When file matches `ADR-*.md` pattern, map to a new `DocumentType` or handle via `detectedType === 'architectureModel'` (if ArtifactDetector already marks it).
- **In `extractMetadata()`**: When file is `ADR-*.md`, extract additional ADR-specific frontmatter fields: `status`, `date`, `superseded_by`.
- **New helper method**: Extract body sections from Markdown headings:
  - Parse `# Context` / `## Context` section content
  - Parse `# Decision` / `## Decision` section content
  - Parse `# Consequences` / `## Consequences` section content (split by newlines into `string[]`)
- **Store results**: Put body section content into `metadata.context`, `metadata.decision`, `metadata.consequences`.

The file naming pattern `ADR-*.md` is already detected by ArtifactDetector as `adr` type. Use this to route to the correct parsing logic.

### 4. Add unit tests

**File:** `apps/backend/src/parsers/repositoryParser.test.ts`

Add test cases:
1. **Happy path** — parse valid `ADR-001-example.md`, verify frontmatter fields + body sections
2. **Minimal ADR** — only title + status (no body sections)
3. **Superseded ADR** — verify `superseded_by` field parsed
4. **Malformed YAML frontmatter** — verify error captured gracefully
5. **Non-ADR markdown** — verify it falls back to standard markdown parsing

Follow the existing test pattern.

### 5. Verify no regression

Run `tsc --noEmit` to confirm type safety.
Run existing tests (`npx vitest run` in backend) to confirm no regression.

## Files to Modify

| File | Action |
|------|--------|
| `packages/shared/src/types.ts` | Add `ADREntry` interface (or confirm THE-155 already added `ArchitectureDecision`) |
| `packages/shared/requirements/ADR-001-example.md` | Create sample file |
| `apps/backend/src/parsers/repositoryParser.ts` | Add ADR-specific extraction logic |
| `apps/backend/src/parsers/repositoryParser.test.ts` | Add ADR test cases |

## Definition of Done

- New or existing ADR type exported from shared package
- Sample `ADR-001-example.md` file in requirements directory
- `RepositoryParser.parse()` extracts ADR frontmatter fields (title, status, date, superseded_by)
- Body sections (Context, Decision, Consequences) extracted from Markdown headings
- Non-ADR `.md` files fall back to standard markdown behavior (no regression)
- Error handling for malformed frontmatter — graceful degradation
- Unit tests covering: happy path, minimal, superseded, malformed, non-ADR fallback
- `tsc --noEmit` passes
- Existing tests still pass

## Scope Limit

Max 3 tool loops for BackendArchitect. If blocked for more than 2 iterations, halt, log reason, and escalate to @CEO.

## Iteration Limit

BackendArchitect: Max 2 heartbeats on this issue. After 2, must escalate to CTO if incomplete.
