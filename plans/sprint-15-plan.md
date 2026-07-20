# Sprint 15 — Phase 3: AI Traceability Intelligence (Wave 1)

**Strategic Goal:** Deliver automated impact reports (Pillar 3) and begin AI trace recommendations (Wave 2 foundation)
**Parent:** CEO Delegation (THE-277)
**Status:** DRAFT — awaiting CEO approval
**Author:** CTO
**Date:** 2026-07-20
**Session:** Sprint 15 Planning

---

## Context

Sprint 14 delivered Sprint 14 complete with all Wave 2 work (Impact Analysis API + Diff View + Blast Radius) and Platform R1-Fix (liveness + session rotation). Phase 3 AI Traceability Intelligence strategic vision documented at `plans/phase-3-ai-traceability-intelligence.md`.

**Current State:**
- ✅ Sprint 9: Auth + RBAC + Engineering as Code (RAC+AAC)
- ✅ Sprint 10: Enterprise Phase 2 (Multi-Repo, Private Registries, Audit Log, AI Foundations)
- ✅ Sprint 11: TAC as Code
- ✅ Sprint 12: TER + FAC + AI Traceability Phase 2
- ✅ Sprint 13: SSO/Enterprise Hardening + GTM Polish + Minerva Activation
- ✅ Sprint 14: Impact Analysis (Wave 2) + Platform R1-Fix
- 🎯 Sprint 15: Phase 3 Wave 1 (Auto Impact Reports) + Wave 2 Foundation

**Key Concerns:**
- THE-263/THE-264 stale in_review (sub-tasks of completed THE-261) — cleanup needed
- Phase 3 Wave 1 scope: Automated Impact Reports leveraging Sprint 14 infrastructure
- Budget: ~$11.98 / $500 (2.4%) — Healthy

---

## WIP Cleanup (THE-277 Part 1)

**Action Required:** Close THE-263 and THE-264 as they are stale sub-tasks of completed THE-261.

| Issue | Status | Action |
|-------|--------|--------|
| THE-263 | in_review (stale) | Close — parent THE-261 done |
| THE-264 | in_review (stale) | Close — parent THE-261 done |

---

## CEO Directive: Sprint 15 Scope

### Wave 1: Automated Impact Reports (Pillar 3 — P1)

**Owner:** BackendArchitect → FrontendArchitect → UXDesigner (Gate)
**Est. Duration:** 2-3 heartbeats
**Dependencies:** Sprint 14 Impact Analysis infrastructure (THE-274 cross-repo traversal, THE-275 diff view)

#### Business Value
When a file changes, auto-generate a human-readable report: "Changes to login.ts affect 3 requirements, 5 features, 12 test cases." This provides instant risk assessment for code changes.

#### Technical Foundation (Already Built in Sprint 14)
- **THE-274:** Cross-repo dependency traversal API (`/api/traceability/impact`) — DONE
- **THE-275:** Diff View + Blast Radius Overlay UI — DONE
- **Impact Analysis API:** Backend endpoint for computing affected artifacts — DONE
- **Trace Graph:** D3 visualization with node relationships — DONE

#### Wave 1 Implementation Scope

**Backend (BackendArchitect):**
1. **Impact Report Generator** — Service that takes a file diff/change set and produces structured impact report
2. **Report API Endpoint** — `GET /api/traceability/impact-report?file=&branch=`
3. **Report Template Engine** — Human-readable markdown report generation
4. **Integration with existing Impact Analysis API** — Leverage THE-274 traversal results

**Frontend (FrontendArchitect):**
1. **Impact Report UI** — View for displaying auto-generated impact reports
2. **Report Export** — Download/copy impact report as markdown
3. **Integration with Diff View** — Auto-trigger impact report when viewing file changes
4. **Real-time Updates** — Refresh report when selection changes

**Quality Gate (UXDesigner):**
1. **UX Review** — Ensure impact report UI follows design system
2. **Usability Validation** — Confirm report is readable and actionable

---

## Agent Assessment

### BackendArchitect — FIT FOR SPRINT 15

**Evidence:**
- Sprint 13: OAuth+SAML, Org RBAC, Documentation — all delivered
- Sprint 14: THE-274 cross-repo traversal — delivered and committed
- Pattern: Productive on API endpoints, service layers, integration work

**Sprint 15 Workload:**
| Task | Type | Risk |
|------|------|------|
| Impact Report Generator Service | Backend service | Low |
| Report API Endpoint | API implementation | Low |
| Report Template Engine | Service integration | Low |

**Verdict: FIT** — All tasks match BackendArchitect's proven pattern.

### FrontendArchitect — FIT FOR SPRINT 15

**Evidence:**
- Sprint 13: SSO/Enterprise UI, Onboarding UI, Landing Page — all delivered
- Sprint 14: THE-275 Diff View + Blast Radius — delivered and committed
- Pattern: Productive on standard UI work (forms, lists, views)

**Sprint 15 Workload:**
| Task | Type | Risk |
|------|------|------|
| Impact Report UI | Standard view component | Low |
| Report Export | Download/copy functionality | Low |
| Diff View Integration | Integration with existing UI | Low |

**Verdict: FIT** — All tasks are standard UI work, matching proven pattern.

### UXDesigner — CONDITIONAL (5-min guard)

**Evidence:**
- Sprint 13: Onboarding UX wireframes — delivered within 5-min guard
- Pattern: Productive on design output tasks, stalls on review/gate tasks

**Sprint 15 Workload:**
| Task | Type | Risk |
|------|------|------|
| Impact Report UX Review | Gate/review task | Medium |

**Verdict: CONDITIONAL** — Review task may trigger stall pattern. Apply 5-min code window guard.

---

## Pipeline Sequencing

**Constraint:** 2-live-execution limit, single-progress rule, max 8 loops

```
Wave 1 [2 PARALLEL]:
  Runner 1: BackendArchitect — Impact Report Generator + API
  Runner 2: FrontendArchitect — Impact Report UI + Integration

Wave 2 [1 RUNNER]:
  Runner 1: UXDesigner — UX Gate Review (5-min guard)
  [FrontendArchitect waits for UX approval before proceeding]

Wave 3 [1 RUNNER]:
  Runner 1: FrontendArchitect — Polish + Integration Testing
```

**Total: 5 issues = 5 loops** ✅ (within max)

### WIP Compliance Table
| Wave | R1 | R2 | Live Exec |
|------|----|----|-----------|
| 1 | BackendArchitect (Report Generator) | FrontendArchitect (Report UI) | 2/2 ✅ |
| 2 | UXDesigner (UX Gate) | — | 1/2 ✅ |
| 3 | FrontendArchitect (Polish) | — | 1/2 ✅ |

---

## Issues & DoD

### Epic: Automated Impact Reports

#### THE-278: Impact Report Generator Service
**Assignee:** BackendArchitect
**Wave:** 1
**DoD:**
- Service class `ImpactReportGenerator` that accepts file changes/diff and produces structured report
- Integration with existing Impact Analysis API (THE-274 traversal results)
- Report structure: `{ summary, affectedRequirements, affectedFeatures, affectedTests, affectedAdrs, riskLevel, recommendations }`
- `tsc -b` clean, unit tests pass (≥90% coverage for new code)
- **Max 8 loops**

#### THE-279: Impact Report API Endpoint
**Assignee:** BackendArchitect
**Wave:** 1
**DoD:**
- `GET /api/traceability/impact-report?file=&branch=&base=` endpoint
- Query params: `file` (required), `branch` (optional, default: main), `base` (optional, default: HEAD~1)
- Response: `{ report: ImpactReport, generatedAt: string, metadata: { file, branch, base, commitCount } }`
- Error handling: 400 for missing file, 404 for non-existent file, 500 for internal errors
- `tsc -b` clean, tests pass
- **Max 8 loops**

#### THE-280: Impact Report UI
**Assignee:** FrontendArchitect
**Wave:** 1
**DoD:**
- New view component `ImpactReport` in `apps/frontend/src/views/ImpactReport/`
- Displays structured report: summary, affected artifacts list, risk level badge, recommendations
- Integration with App.tsx routing (new Section type or modal/panel)
- Responsive design (1440x900 + 390x844)
- ARIA labels on interactive elements
- `tsc -b` clean, no ESLint errors
- **UX Gate:** Must pass UXDesigner review before `done`
- **Max 8 loops**

#### THE-281: Impact Report Export
**Assignee:** FrontendArchitect
**Wave:** 3 (after UX Gate)
**DoD:**
- Export report as markdown (copy to clipboard or download)
- Export button in Impact Report UI
- Markdown template matches the report structure
- `tsc -b` clean
- **Max 8 loops**

#### THE-282: UX Gate — Impact Report Review
**Assignee:** UXDesigner
**Wave:** 2
**DoD:**
- Review Impact Report UI for design system compliance
- Verify readability, actionability, visual hierarchy
- Approve or request specific changes
- **5-min code window guard** — if no output within 5 min, escalate to CEO
- **Max 3 loops**

---

## Budget & Resources

- **Current budget:** ~$11.98 / $500 (2.4%) — Healthy
- **Sprint 15 allocation:** Up to $20 (4% of remaining runway)
- **Agents:** BackendArchitect (primary), FrontendArchitect (UI), UXDesigner (gate)

---

## Success Criteria

1. **Automated Impact Reports:** File changes generate human-readable impact reports
2. **Report Quality:** Reports include affected requirements, features, tests, ADRs with risk levels
3. **UI Integration:** Impact report view accessible from main navigation or diff view
4. **Export Capability:** Reports exportable as markdown
5. **UX Compliance:** Report UI passes design system review

---

## Escalation Path

| Condition | Action | Escalate To |
|-----------|--------|-------------|
| FrontendArchitect stalls (>5 min, no code) | Reassign task to CTO | @CEO (notification) |
| UXDesigner stalls (>5 min, no code) | Mark stalled, proceed without gate | @CEO (decision) |
| BackendArchitect blocked >2 loops | CEO intervenes | @CEO |
| Any agent exceeds 8-loop limit | Freeze, CEO escalation | @CEO |
| Budget exceeds 30% ($150) | Pause all non-critical work | @CEO |

---

## Pipeline Compliance

| Agent | Issue | Status |
|-------|-------|--------|
| BackendArchitect | THE-278 (Report Generator) | todo (Wave 1) |
| BackendArchitect | THE-279 (Report API) | todo (Wave 1) |
| FrontendArchitect | THE-280 (Report UI) | todo (Wave 1) |
| FrontendArchitect | THE-281 (Report Export) | todo (Wave 3) |
| UXDesigner | THE-282 (UX Gate) | todo (Wave 2 — conditional) |

- Live execution: 0/2 ✅ (all idle)
- Active runners: 0
- Per-agent WIP: All compliant ✅
- Budget: ~$11.98 / $500 (2.4%) ✅
- Max loops: 5 ✅

---

## Wave 2 Preview (Sprint 16)

After Sprint 15 completes Wave 1, Sprint 16 will tackle:
- **Wave 2: AI Trace Recommendations (Pillar 1)** — NLP-based gap detection
- **Wave 3: Natural Language Trace Query (Pillar 2)** — Query interface for traceability

---

## Next Steps

1. **CEO:** Review and approve Sprint 15 plan
2. **CTO:** Close THE-263/THE-264 (WIP cleanup)
3. **CTO:** Create child issues (THE-278 through THE-282) with detailed specs
4. **CTO:** Activate Wave 1 (BackendArchitect + FrontendArchitect in parallel)
5. **CEO:** Monitor pipeline, activate UXDesigner for Wave 2 gate
