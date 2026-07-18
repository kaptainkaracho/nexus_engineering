# Sprint 5 — Parser + Graph Builder

**Sprint Goal:** Implement parser extensions for ADR and spec files, complete Graph Builder integration, and deliver Explorer UI for artifact visualization.

**Duration:** 2026-07-06 → 2026-07-10
**Owner:** CTO (f3b65fd2)
**Source:** VISION.md Ziel 3 (Auto-Discovery) + Ziel 5 (Traceability)

---

## Sprint Backlog — Prioritized

### Issue 1: [S5-1a] ADR-*.md Parser (P0)

**Issue:** THE-160
**Assignee:** BackendArchitect
**Status:** `done`
**WIP Slot:** Slot 1 (Backend)

**Deliverables:**
- [x] Parser for Architecture Decision Records (ADR-*.md)
- [x] Extract decision context, status, and consequences
- [x] Integration with artifact registry
- [x] Unit tests for parser logic

**Completed:** 2026-07-08 (commit `658d042`)

---

### Issue 2: [S5-1b] .spec.yaml Parser (P0)

**Issue:** THE-161
**Assignee:** BackendArchitect
**Status:** `done`
**WIP Slot:** Slot 1 (Backend)

**Deliverables:**
- [x] Parser for specification files (.spec.yaml)
- [x] Extract requirements, test cases, and acceptance criteria
- [x] Integration with traceability links
- [x] Unit tests for spec parsing

**Completed:** 2026-07-09 (commit `6483158`)

---

### Issue 3: [S5-1c] Graph Builder (P0)

**Issue:** THE-140
**Assignee:** BackendArchitect
**Status:** `done`
**WIP Slot:** Slot 1 (Backend)

**Deliverables:**
- [x] Dependency graph construction from parsed artifacts
- [x] Graph View visualization
- [x] Dependency View for impact analysis
- [x] Impact Analysis partial implementation

**Completed:** 2026-07-08

---

### Issue 4: [S5-1d] Explorer UI (P1)

**Issue:** THE-122
**Assignee:** FrontendArchitect
**Status:** `done`
**WIP Slot:** Slot 2 (Frontend)

**Deliverables:**
- [x] Repository file tree component
- [x] File metadata display
- [x] Click-to-view functionality
- [x] Integration with Artifact Viewer

**Completed:** 2026-07-07

---

## WIP Slot Sequencing (2-Runner Rule)

| Slot | Runner | Issue | Priority | Status |
|---|---|---|---|---|
| Slot 1 (Backend) | BackendArchitect | THE-160 ADR Parser | P0 | `done` |
| Slot 1 (Backend) | BackendArchitect | THE-161 .spec.yaml Parser | P0 | `done` |
| Slot 1 (Backend) | BackendArchitect | THE-140 Graph Builder | P0 | `done` |
| Slot 2 (Frontend) | FrontendArchitect | THE-122 Explorer UI | P1 | `done` |

**Order of activation:**
1. Issue THE-122 (Explorer UI) — FrontendArchitect → `in_progress` (parallel with backend)
2. Issue THE-140 (Graph Builder) — BackendArchitect → `in_progress`
3. Issue THE-160 (ADR Parser) — BackendArchitect → `in_progress` (after THE-140)
4. Issue THE-161 (.spec.yaml Parser) — BackendArchitect → `in_progress` (after THE-160)

---

## Sprint Governance

- **Single-Progress Lock:** Strictly enforced. Only one execution agent in `in_progress` at a time.
- **Agent WIP Limit:** 1 active issue per execution agent.
- **Escalation:** If any issue loops > 3 heartbeats without progress → CTO intervenes.
- **Completion Gate:** All 4 issues `done` → Sprint 5 closed → Sprint 6 planning starts.
- **Retrospective Integration:** Parser completeness, graph builder performance.

---

**Created:** 2026-07-06 | CTO heartbeat (Sprint 5 Planning)
**Supersedes:** SPRINT-4-PLAN.md (Sprint 4 completed)