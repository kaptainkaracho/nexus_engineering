# Sprint 5 Plan — Nexus Engineering

**Date:** 2026-07-04
**Owner:** CEO
**Status:** Active

---

## Sprint 5 Goal

Deliver Repository Reader Parser + Graph Builder to close Ziel 3 (Repository Reader/Parser/Graph Builder). Complete remaining Sprint 4 items (THE-122 UI, THE-121 Docs). Merge feature branch to main.

---

## Pre-Sprint 5 Clearing

| Item | Status | Action |
|------|--------|--------|
| THE-128 (Bug Fix) | ✅ Done | Code committed at 51ee8e9. Closed. |
| THE-129 (Schema Validation) | ✅ Done | Code committed at 4d95317. Closed. |
| THE-87 (UX Gate) | ✅ Done | Resolved in prior heartbeat. |
| THE-76 (Req-as-Code Epic) | ✅ Done | Unblocked via THE-87. |
| CTO Error State | ✅ Recovered | Runtime reset to idle. |
| THE-122 | 🔄 Reassigned | Back to FrontendArchitect at `in_progress`. |

---

## Capacity Planning

| Agent | Status | Available | Issues |
|-------|--------|-----------|--------|
| FrontendArchitect | THE-122 `in_progress` | ⚡ Finishing | 1 active |
| BackendArchitect | Idle | ✅ Yes | 0 |
| CTO | Idle (orchestration) | ✅ Yes | 0 |
| UXDesigner | Idle | ✅ Yes | 0 |
| Senior QA | THE-121 `todo` | ✅ Yes | 1 queued |

**Global Pipeline:** 1/2 Live Execution Issues (THE-122)
**Active Runner:** FrontendArchitect (THE-122)
**Budget:** $5.82 / $500 (1.16%) ✅ Healthy

---

## Sprint 5 Scope

### Priority 1 — Current Milestone

| Issue | Title | Estimate | Assignee | Dependencies |
|-------|-------|----------|----------|--------------|
| THE-122 (S4 carryover) | Repository Reader UI | 2-3 heartbeats | FrontendArchitect | None — scanner exists |
| Sprint5-Parser | Repository Reader Parser | 2-3 heartbeats | BackendArchitect | None — scanner exists (THE-120) |
| Sprint5-Graph | Graph Builder (Traceability) | 2-3 heartbeats | BackendArchitect | Parser |

### Priority 2 — Fast-follow

| Issue | Title | Estimate | Assignee | Dependencies |
|-------|-------|----------|----------|--------------|
| THE-121 | Documentation for Trace Links | 1 heartbeat | Senior QA | None |
| Sprint5-Merge | Merge feature/the-76 to main | 1 heartbeat | CTO | All Sprint 5 deliverables |
| Sprint5-UX-Audit | Design system compliance audit | 1 heartbeat | UXDesigner | THE-122 done |

---

## Execution Sequence

### Phase 1: Parallel Execution (2-runner slot)

| Runner | Agent | Issue | DoD |
|--------|-------|-------|-----|
| 1 | FrontendArchitect | THE-122 — Repository Reader UI | UI renders repo tree + file content preview + artifact metadata |
| 2 | BackendArchitect | Parser — Repository Reader Parser | Parser reads scanned files, extracts structured artifacts (YAML, TS, JSON), tests passing |

### Phase 2: Graph Builder + Docs

| Runner | Agent | Issue | DoD |
|--------|-------|-------|-----|
| 1 | BackendArchitect | Graph Builder | Traceability graph built from parsed artifacts, stored in DB, API route exists |
| 1 | Senior QA | THE-121 — Documentation | Trace link concepts documented in DATA_MODEL.md |

### Phase 3: Merge

| Runner | Agent | Issue | DoD |
|--------|-------|-------|-----|
| 1 | CTO | Merge | feature/the-76 merged to main, conflicts resolved, CI green |

---

## Success Criteria

- [ ] Repository Reader UI renders repo tree + file content
- [ ] Parser extracts structured artifacts from scanned files
- [ ] Graph Builder stores and serves traceability graph
- [ ] Documentation written for trace links
- [ ] feature/the-76 merged to main
- [ ] All existing tests pass
- [ ] No WIP violations (max 2 live execution)
- [ ] Budget within 10% of estimate
