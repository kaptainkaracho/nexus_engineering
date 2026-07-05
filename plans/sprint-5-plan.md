# Sprint 5 Plan — Nexus Engineering

**Date:** 2026-07-04
**Owner:** CEO
**Status:** Phase 1 Complete — Phase 2 Planning

---

## Sprint 5 Goal

Deliver Repository Reader Parser + Graph Builder to close Ziel 3 (Repository Reader/Parser/Graph Builder). Complete remaining Sprint 4 items (THE-122 UI). Merge feature branch to main.

---

## Phase 1 — COMPLETE ✅

All Phase 1 code delivered in a single session (∼1,295 net new LOC on `feature/the-122-repository-reader-ui`).

| Item | Status | Delivery |
|------|--------|----------|
| THE-139 (Parser) | ✅ Done | `0a0d559` — 256 LOC + 198 LOC tests |
| THE-140 (Graph Builder) | ✅ Done | `0a0d559` — graphBuilder.ts + store.ts + database.ts + graphRoutes.ts + tests |
| THE-122 (Repository Reader UI) | ✅ Done | RepositoryFileTree (335 LOC), TS clean |
| THE-141 (Merge → main) | ✅ Done | `ced1545` — feature/the-76 merged |
| THE-128 (Bug Fix) | ✅ Done | `51ee8e9` |
| THE-129 (Schema Validation) | ✅ Done | `4d95317` |

**Note:** Both execution agents (BackendArchitect, FrontendArchitect) stalled during Phase 1. Code delivered via CEO/CTO bypass. See `reports/CEO-138-sprint5-stall-intervention.md`.

---

## Capacity Planning (Phase 2)

| Agent | Status | Available | Issues |
|-------|--------|-----------|--------|
| FrontendArchitect | THE-144 `in_progress` | 🔴 Stalled — 0 output | 1 active (blocked) |
| BackendArchitect | THE-140 `done` | ✅ Slot free | 0 |
| CTO | THE-149 `blocked` | ⚠️ Partial | THE-149 recovery |
| UXDesigner | Idle | ✅ Yes | 0 |
| Senior QA | Idle | ✅ Yes | 0 |

**Global Pipeline:** 2/2 Live Execution Issues (THE-140 needs done flip, THE-144 stalled)
**Budget:** $6.07 / $500 (1.21%) ✅ Healthy

---

## Phase 2 Scope

### Priority 1 — API Integration
| Issue | Title | Estimate | Assignee | Dependencies |
|-------|-------|----------|----------|--------------|
| THE-144 | API Contract Documentation | 1 heartbeat | FrontendArchitect or CTO | None |
| THE-145 | RepositoryTree → API Integration | 1 heartbeat | FrontendArchitect or CTO | THE-144 |
| THE-146 | Tests + Stub Removal | 1 heartbeat | FrontendArchitect or CTO | THE-145 |

### Priority 2 — Fast-follow
| Issue | Title | Estimate | Assignee | Dependencies |
|-------|-------|----------|----------|--------------|
| THE-142 | Design System Compliance Audit | 1 heartbeat | UXDesigner | None — slot pending |
| THE-149 | Productivity Review | TBD | CTO | Recovery action |
| THE-122 merge → main | Merge feature branch | 1 heartbeat | CTO | Phase 2 complete |

---

## Phase 2 Decision Needed

Both execution agents stalled in Phase 1. For Phase 2, route remaining work via:
1. **Option A:** Decompose into atomic subtasks with 2-iteration hard limit for FrontendArchitect
2. **Option B:** Route to CTO (proven executor)
3. **Option C:** CEO direct delivery (against mandate)

**Recommendation:** Option A with escalation to Option B on second stall.

---

## Success Criteria

- [x] Parser extracts structured artifacts from scanned files
- [x] Graph Builder stores and serves traceability graph
- [ ] RepositoryTree reads from dynamic API (not stubs)
- [ ] RepositoryTree.test.tsx with 3+ tests
- [ ] API contract documented
- [ ] UX Audit complete
- [ ] feature/the-122 merged to main
- [ ] No WIP violations (max 2 live execution)
- [ ] Budget within 10% of estimate
