# Sprint 9 — Engineering as Code Foundations: RAC + AAC

**Strategic Goal:** Board Directive — Establish "Engineering as Code" framework per Hybrid A+B+C strategy
**Parent:** THE-190
**Status:** Active
**Author:** CTO
**Date:** 2026-07-18

---

## Context

The Board approved Hybrid A+B+C strategy with a secondary directive to establish "Engineering as Code" documents. This sprint delivers the first two tiers of the four-tier framework:

| Tier | Name | Sprint |
|------|------|--------|
| 1 | Requirements as Code (RAC) | **Sprint 9** |
| 2 | Architecture as Code (AAC) | **Sprint 9** |
| 3 | Specification as Code (SAC) | Sprint 9-10 |
| 4 | Traceability as Code (TAC) | Sprint 11+ |

### What's Already Done

- `/docs/requirements/templates/requirement-template.yaml` — RAC YAML template with full field definitions
- `/docs/requirements/templates/sample-requirement.req.yaml` — Sample auth requirement document
- `/docs/architecture/adr/templates/adr-template.md` — ADR template with Context/Decision/Consequences sections
- `/docs/architecture/adr/templates/sample-adr-001-authentication-strategy.md` — Sample ADR for auth strategy

These were delivered by UXDesigner (THE-190 sub-issue) and already committed.

---

## Remaining Work

### RAC — Requirements as Code

| # | Task | Est. | Assignee | Dependencies |
|---|------|------|----------|-------------|
| RAC-1 | CI validation for RAC YAML format + issue reference integrity | 1 HB | BackendArchitect | None |
| RAC-2 | Domain requirement directories (auth/, api/, ui/, db/) + first real req docs | 1 HB | BackendArchitect | RAC-1 (CI first) |
| RAC-3 | Validation JSON Schema for `req-doc/v1` format | 0.5 HB | BackendArchitect | RAC-1 |

### AAC — Architecture as Code

| # | Task | Est. | Assignee | Dependencies |
|---|------|------|----------|-------------|
| AAC-1 | Create ADRs for past major architecture decisions (see list below) | 1-2 HB | BackendArchitect | None |
| AAC-2 | C4 architecture diagrams (System Context + Container) as PlantUML/Mermaid | 1 HB | BackendArchitect | AAC-1 |
| AAC-3 | CI validation for ADR issue references | 0.5 HB | BackendArchitect | None |

### Priority ADRs to Create

1. ADR-002: Graph Builder Architecture (traceability graph design)
2. ADR-003: Repository Scanner Design (artifact auto-discovery)
3. ADR-004: Artifact Registry Data Model
4. ADR-005: Frontend Architecture (Vite + React + Design System)

---

## Execution Strategy

### Wave 1 — BackendArchitect (current, active on Auth+RBAC)
BackendArchitect is currently executing `[BackendArchitect] Auth + RBAC Backend Implementation` (THE-189). RAC + AAC work is **backlogged** until that completes.

### Wave 2 — BackendArchitect (after Auth+RBAC done)
Pick up RAC+AAC in this order:
1. RAC-1 + AAC-3 (CI validation — parallelizable)
2. RAC-3 (JSON Schema)
3. AAC-1 (ADRs)
4. RAC-2 (domain req docs)
5. AAC-2 (C4 diagrams)

### Wave 3 — FrontendArchitect (after Auth UI done)
After FrontendArchitect completes `[FrontendArchitect] Auth UI Implementation`, they can assist with:
- Frontend-adjacent ADRs (ADR-005)
- UI-side rendering of requirement/architecture docs if needed

### UX Gate
All frontend-adjacent deliverables (C4 diagrams in UI, req doc viewers) must pass UXDesigner quality gate. Pure backend artifacts (YAML schemas, CI scripts, ADR markdown) are exempt as infrastructure/bootstrap.

---

## Timeline

| Date | Milestone |
|------|-----------|
| 2026-07-18 | Sprint 9 activated, templates done, WIP enforced |
| Auth+RBAC done | BackendArchitect starts RAC+AAC Wave 2 |
| EOD 2026-07-25 | Target: CI validation + first ADRs + JSON Schema |
| EOD 2026-07-31 | Target: Domain req docs + C4 diagrams |

---

## Pipeline Compliance

Current state after WIP enforcement:

| Agent | Active Issue | Status |
|-------|-------------|--------|
| BackendArchitect | `[BackendArchitect] Auth + RBAC Backend Implementation` | **in_progress** 🔄 |
| UXDesigner | `[UXDesigner] Auth Flow Wireframes & Admin UI Mockups` | **in_progress** 🔄 |
| FrontendArchitect | `[FrontendArchitect] Auth UI Implementation` | **todo** |
| CTO | THE-190 (orchestration) + THE-189 (orchestration) | **in_progress** 🔄 (exempt) |
| Senior QA | None | **idle** |

- Live execution issues: 2/2 ✅
- Per-agent WIP: 1/1 ✅
- RAC+AAC sub-issues: moved to `backlog` (will resume when capacity frees)
