# ADR-002: Architecture as Code (AAC)

**Status:** Accepted
**Date:** 2026-07-18
**Deciders:** CTO, BackendArchitect, CEO
**Issue:** THE-190

---

## Context

Architecture decisions are critical knowledge that frequently gets lost in verbal discussions, chat threads, or outdated wiki pages. Without a documented architectural history, teams lose context on why decisions were made, leading to repeated debates and inconsistent evolution.

Following the "Engineering as Code" mandate from the board, architecture artifacts must be treated as code — version-controlled, reviewable, and traceable to issues.

## Decision

We adopt **Architecture as Code (AAC)** using Markdown-based Architecture Decision Records (ADRs) stored in `/docs/architecture/adr/`.

**Format:** Markdown files with `adr-{NUMBER}-{slug}.md` naming convention.

**Structure (required sections):**
- Title: `# ADR-{NUMBER}: {TITLE}`
- Status, Date, Deciders metadata
- Issue link: `THE-{NUMBER}`
- Context, Decision, Consequences sections
- Optional: Alternatives Considered, Related Decisions, Notes

**Rule: Every ADR MUST link to the Paperclip issue that triggered it.**

**Rule: Architecture changes requiring diagram updates MUST include updated C4/Mermaid diagrams in the same PR.**

**API Endpoints:**
- `GET /api/aac` — List all AAC/ADR documents
- `GET /api/aac/:id` — Get a single ADR document
- `POST /api/aac/validate` — Validate an ADR document structure
- `GET /api/aac/template` — Return the ADR template

**CI Validation:** ADR files are checked for required metadata fields and issue references on PR.

## Consequences

### Positive

- Architectural decisions are permanently recorded and version-controlled
- New team members can understand architectural history
- PR-based review ensures decisions are vetted
- Issue traceability connects decisions to business drivers
- ADR template standardizes format and reduces friction

### Negative

- Requires discipline to create ADRs for every significant decision
- ADRs may become outdated if not updated alongside code changes
- Markdown-only format limits cross-referencing capabilities

### Neutral

- Template at `/docs/architecture/adr/templates/adr-template.md` guides authors
- Existing ADRs demonstrate the format (see sample-adr-001-authentication-strategy.md)

## Alternatives Considered

### Option 1: Wiki-Based Architecture Documentation

**Pros:** Easy to edit, rich formatting
**Cons:** Not version-controlled, no PR review, easily outdated
**Why not chosen:** Violates "Engineering as Code" principle

### Option 2: Structured YAML for ADRs

**Pros:** Machine-validation, structured metadata
**Cons:** Poor human readability, higher barrier to authoring
**Why not chosen:** ADRs are primarily human-readable; markdown strikes the right balance

### Option 3: adr-tools CLI

**Pros:** Automated numbering, template generation
**Cons:** Additional dependency, Python/Node requirement
**Why not chosen:** Manual template copy is simpler initially; tool can be added later

## Related Decisions

- ADR-001: Requirements as Code (RAC)

## Notes

AAC is Tier 2 of the four-tier "Engineering as Code" framework. C4 diagrams for architecture visualization are stored in `/docs/architecture/diagrams/` and use PlantUML or Mermaid format.
