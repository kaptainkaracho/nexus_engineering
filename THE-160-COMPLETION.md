# THE-160 Completion Report

## Issue
THE-160 — Implement ADR-*.md Parser — Architecture Decision Records

## Summary
`RepositoryParser` now parses `ADR-*.md` files (Markdown + YAML frontmatter) into
structured `ArchitectureDecision` objects. Committed in `658d042` (ADR-*.md parser)
plus `fb8c938` (null-guard type fix in the parser test file). The feature is
verified stable: `adrMarkdown.test.ts` 6/6, sibling parser tests 9/9,
`repositoryParser.ts` tsc-clean for the ADR code path.

## Deliverables
### Parser (`apps/backend/src/parsers/repositoryParser.ts`)
- `isAdrMarkdownFile()` detects `ADR-*.md` (case-insensitive, requires `.md`).
- `splitAdrMarkdown()` extracts YAML frontmatter; malformed YAML is caught,
  `console.warn`-logged, and degraded to `{}` so the Markdown body still parses.
- `parseAdrMarkdownBody()` captures `## Context` / `## Decision` / `## Consequences`
  (case-insensitive) and falls back to the `#` H1 heading as the title when no
  frontmatter title exists.
- `buildAdrMarkdownDecision()` returns a full `ArchitectureDecision`
  (id, title, date, status, deciders, context, decision, consequences, supersededBy).
- `coerceArchitectureDecisionStatus()` validates/normalizes status with a safe default.

### Types (`packages/shared/src/types.ts`)
- `FileMetadata.detectedType` union includes `'adr'`.
- `ArchitectureDecision` (types.ts:164) carries every field the parser emits.

### Tests (`apps/backend/src/parsers/adrMarkdown.test.ts`) — 6/6 pass
- happy path (frontmatter + body sections),
- missing frontmatter (title from `#` heading, body still parsed),
- malformed YAML (graceful degradation + warning),
- empty file (no parse error),
- no `.md` extension (not treated as ADR markdown),
- regression: `.arch.yaml` and `.req.yaml` still parse correctly.

## Verification
```
cd apps/backend && pnpm vitest run src/parsers/adrMarkdown.test.ts   # PASS 6
cd apps/backend && pnpm vitest run src/parsers/adrParser.test.ts src/parsers/repositoryParser.test.ts  # PASS 9
tsc --noEmit -p tsconfig.json  # repositoryParser.ts: 0 errors
```

## WIP / Dispatch note (CTO advisory)
THE-160 was completed and marked done in the prior run. The subsequent re-dispatch
was a board-side action, not parallel self-assigned work. With THE-109 also done,
there are zero active issues on BackendArchitect — no WIP-limit violation is live.
Recommend the board keep completed issues closed; if re-opened only for
verification, treat as a quick confirm rather than a new in-progress cycle.

## Quality Checklist
- [x] Input validation: frontmatter parsed via `js-yaml`; malformed YAML degrades gracefully (no crash/injection surface)
- [x] Error handling + logging: `console.warn` on missing title / malformed frontmatter
- [x] Reuses shared types (no duplicated schema); no N+1 / no DB
- [x] Tests pass (6/6 ADR + 9/9 siblings)
- [x] No secrets, reversible, no migration required

## Git
- `658d042` feat(parser): implement ADR-*.md parser with YAML frontmatter (THE-160)
- `fb8c938` fix(parser): null-guard in repositoryParser JSON test (THE-160 tsc clean)
