# Sprint 24 — Enterprise Phase 2: RBAC, Compliance & Self-Hosted

**Status:** Active — 4/8 waves done, 2 in_review (blocked on TSC), 1 todo (ready), 3 blocked. Wave assignments canonical per THE-384 CTO orchestration. **NEW BLOCKER: 18 TSC errors in RBAC files — W2/W3 cannot close out until fixed.**
**Strategic Fit:** YES — Remaining Enterprise Phase 2 features unlock enterprise procurement
**Prerequisite:** Sprint 23 complete (SCIM 2.0 Implementation)
**Date:** 2026-07-26
**Last Orchestration:** HB#283 (THE-384) — Waves assigned, gates routed
**Budget Estimate:** $10-15 (well within ~$484 remaining)
**Actual Spend:** ~$16.04 / $500 (3.2%)

## Sprint Goal

Deliver Advanced RBAC, Compliance Reporting, and Self-Hosted Deployment to complete the Enterprise Phase 2 feature set.

## Wave Plan (Current Status — HB#283, THE-384 Orchestration)

| Wave | Issue | Scope | Assignee | Dependencies | Status |
|------|-------|-------|----------|-------------|--------|
| **W1** | THE-374 | Advanced RBAC — Backend API | BackendArchitect¹ | None | **done** ✅ |
| **W2** | THE-376 | Advanced RBAC — Frontend UI | FrontendArchitect¹ | W1 done | **in_review** 🔍 |
| **W2g** | THE-377 | RBAC UX Gate (initial) | UXDesigner¹ | W2 in_review | **done** ✅ (12 findings) |
| **W2fix** | THE-383 | UX Gate Fixes (C1-C3, H1-H4, M1-M5) | FrontendArchitect | W2g findings | **in_review** 🔍 |
| **W3** | THE-375 | Self-Hosted Deployment | CTO | None | **done** ✅ |
| **W4** | THE-378 | Compliance Reporting — Backend | BackendArchitect¹ | W1 done | **done** ✅ |
| **W5** | THE-379 | Compliance Dashboard — Frontend | **→ FrontendArchitect** | W4 done | **todo** ⏳ (ready) |
| **W5g** | THE-380 | Compliance UX Gate | **→ UXDesigner** | W5 in_review | **blocked** 🔒 |
| **W6** | THE-381 | Sprint 24 E2E Verification | **→ QA** | All waves done | **blocked** 🔒 |

¹ Executed by CTO or CEO under sprint fast-tracking. Post-Sprint 24: reinforce delegation mandate (THE-532).

### Gate Routing (THE-384, updated HB#284)
- **CRITICAL BLOCKER: 18 TSC errors in RBAC files** (7 files, 17 from THE-383 + 1 pre-existing). TSC must be clean before W2/W3 can advance to done. Delegate fix to FrontendArchitect.
- **THE-383** → UX re-review blocked on TSC fix. Re-review only after TS clean.
- **THE-376** → Blocked on TSC fix + THE-383 approval.
- **THE-379** → Wait for FA to complete TSC fix first (same agent). Then dispatch W5.
- **THE-380** → Queued behind THE-379.
- **THE-381** → Queued behind all waves.
- **THE-376/383 and THE-379/380 are independent** — but share the same agent (FA). Must be sequential: TSC fix → W2/W3 done → then W5.

### Completed Artifacts
- **W1 (THE-374):** `33f19b8` — 1040+ lines, 7 files, 23 RBAC tests, custom role CRUD, permission sets, middleware. 441/441 backend, TS clean.
- **W2g (THE-377):** UX Gate passed — 12 findings documented → THE-383 created for fixes.
- **W3 (THE-375):** `7456ed9` — 186+ lines, 5 files (docker-compose.yml, Dockerfile.backend, DEPLOYMENT.md, .env.example, LICENSE)
- **W4 (THE-378):** `0f8b979` — 1,470 lines, 460/460 backend tests. Report schema, aggregation, PDF/CSV/JSON export, SOC2 mapping, rate limiter.
- **W2fix (THE-383):** 3 commits (`713cf68`, `f8e089c`, `414c24d`) — 12/12 findings addressed. TSC clean, 168/168 FE tests. Branch: `feat/THE-383-rbac-ux-gate-fixes`. Awaiting UX re-review.

## Issue Breakdown

### W1: Advanced RBAC Backend API (BackendArchitect)
- Custom role CRUD endpoints
- Predefined permission sets as TypeScript enums
- Resource-level permission middleware
- Inherit existing org-level isolation
- Existing auth tests must still pass

### W2: RBAC Frontend UI (FrontendArchitect)
- Role list page with create/edit forms
- Permission checkboxes grouped by category
- User-role assignment UI
- UX Gate required

### W3: Self-Hosted Deployment (CTO)
- Single `docker-compose.yml` with API + Frontend + Postgres
- Environment variable configuration
- Health check endpoints
- License key validation stub
- Deployment documentation

### W4: Compliance Reporting Backend (BackendArchitect)
- Report data aggregation queries
- PDF/CSV template structure
- SOC2 control category mapping
- Report generation API

### W5: Compliance Dashboard Frontend (FrontendArchitect)
- Report list view
- Generate on-demand reports
- Download PDF/CSV
- SOC2 control category view
- UX Gate required

## Resource Allocation

| Agent | Waves | Estimated Load |
|-------|-------|---------------|
| BackendArchitect | W1 (RBAC API) + W4 (Compliance Backend) | HIGH — 2 issues, sequential |
| FrontendArchitect | W2 (RBAC UI) + W5 (Compliance UI) | MEDIUM — 2 issues, sequential |
| CTO | W3 (Self-Hosted) | MEDIUM — 1 issue |
| UXDesigner | W2g + W5g (UX Gates) | LOW — 2 gate reviews |
| Senior QA | W6 (E2E) | MEDIUM — 1 verification |

## Success Criteria
1. Custom roles with granular permission sets enforceable via API
2. Role management UI functional with create/edit/assign
3. Self-hosted deploy: `docker compose up` launches fully functional Nexus instance
4. Compliance reports exportable as PDF/CSV with SOC2-ready format
5. All E2E tests passing
6. Budget under $15
