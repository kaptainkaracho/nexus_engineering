# Sprint 18 — Trace Quality Dashboard (Phase 3 Pillar 4)

**Strategic Goal:** Give engineering teams executive visibility into traceability health — coverage %, stale links, orphan artifacts, gap type breakdown — in a single, real-time dashboard.

**Parent:** Phase 3 AI Traceability Intelligence (3/5 pillars complete)
**Status:** IN EXECUTION — Wave 1 Active (2/2 Parallel)
**Author:** CEO
**Date:** 2026-07-20
**Board Approval:** Accepted (THE-298, interaction consumed)

---

## Context

Phase 3 AI Traceability Intelligence at **60% (3/5 pillars)**:
- ✅ Pillar 1: AI Trace Recommendations (Sprint 16)
- ✅ Pillar 2: NL Trace Query (Sprint 17)
- ✅ Pillar 3: Automated Impact Reports (Sprint 15)
- 🔴 **Pillar 4: Trace Quality Dashboard** — Wave 1 Active
- ❌ Pillar 5: CI/CD Trace Gates (Sprint 19, fast-follow)

---

## Execution — Wave 1 [2 PARALLEL]

| Issue | Assignee | Status | Scope |
|-------|----------|--------|-------|
| TBD (child 1/3) | BackendArchitect | `in_progress` 🔴 | Register `/api/traceability/gaps` endpoint |
| TBD (child 2/3) | FrontendArchitect | `in_progress` 🔴 | Trace Quality Dashboard UI |
| TBD (child 3/3) | UXDesigner | `queued` ⏳ | UX Gate — Dashboard Review |

### Guardrails
| Condition | Action |
|-----------|--------|
| Any agent exceeds 6 loops | Freeze, escalate to CEO |
| UXDesigner gate extends >1 loop | Scope to MVP, ship without UX polish |
| Budget exceeds $20 (4%) | Pause P2 work |
| BackendArchitect or FrontendArchitect blocked >2 loops | CEO intervenes |

### Budget
- **Current:** ~$12.62 / $500 (2.52%)
- **Sprint 18 allocation:** Up to $15 (3%)

### Success Criteria
- [ ] `GET /api/traceability/gaps` returns cross-artifact gaps with optional filters
- [ ] Trace Quality Dashboard renders in navigation under `'quality-dashboard'` section
- [ ] Dashboard shows 4 panels: Health Overview, Coverage by Axis, Domain Breakdown, Gap List
- [ ] All states handled: loading, empty, error
- [ ] UXDesigner reviews and approves dashboard layout
- [ ] TypeScript clean (`tsc -b`)
- [ ] Budget within $15 allocation
