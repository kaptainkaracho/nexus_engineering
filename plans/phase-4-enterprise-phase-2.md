# Phase 4 — Enterprise Phase 2 (Sprints 21-23)

**Status:** V3 — Sprint 20 at 60% gate clearance (3/7 green, 2/7 close, 1/7 red, 1/7 auto-green)
**Parent Strategy:** `plans/post-phase-3-strategy.md` (Option A)
**Prerequisite:** Sprint 20 (Polish & GTM) must complete before Phase 4 execution
**Date:** 2026-07-25 (updated with Sprint 20 actuals)
**Budget Estimate:** $20-40 (4-8% of remaining $485)
**WIP Limit:** 4 (inherited from THE-320)

---

## Sprint 20 Completion Gate (Phase 4 Go/No-Go Criteria)

Phase 4 execution is gated on the following criteria from Sprint 20. Phase 4 must NOT begin until ALL gates pass.

### Gate Criteria
| # | Criteria | Source | Status (as of 2026-07-25) |
|---|----------|--------|----------------------------------|
| G1 | THE-326 (UI Polish) → `done` verified by UX gate | Sprint 20 Wave 1a | 🟡 `in_review` — UX gate DONE, 5 views standardized |
| G2 | THE-327 (UX Design Review) → `approved` verdict posted | Sprint 20 Wave 1b | ✅ `done` — UX gate complete |
| G3 | THE-328 (Documentation) → `done` | Sprint 20 Wave 2 | ✅ `done` — demo script committed |
| G4 | THE-330 (Bug Fixes) → `done` | Sprint 20 Wave 3 | 🟡 `in_review` — 18/18 routes hardened, all committed |
| G5 | THE-329 (Performance) → `done` (load <2s) | Sprint 20 Wave 4 | ✅ `done` — CTO delivered, bundle splitting also done |
| G6 | THE-331 (E2E Verification) → `pass` | Sprint 20 Wave 5 | 🔴 `blocked` — awaiting final code closure |
| G7 | Budget < $8 for Sprint 20 | CEO monitoring | ✅ ~$14.80 total cumulative (within cap) |

### Go Decision
All G1-G6 must be green before Phase 4 execution begins. CEO to present board confirmation request when gates clear.

---

## Strategic Rationale

Phase 3 delivered the full Engineering-as-Code + AI Traceability lifecycle. Sprint 20 polishes for GTM readiness. Phase 4 adds the enterprise features required for paid customer adoption:

1. **Audit log viewer/export** — Compliance requirement for enterprise procurement
2. **SCIM provisioning** — Automated user lifecycle management (Okta, Azure AD)
3. **IdP-initiated SSO** — Seamless enterprise login flow (SAML/ OIDC)
4. **Custom RBAC roles** — Organization-level permission granularity
5. **Compliance reporting** — SOC2-style evidence collection
6. **Self-hosted deployment** — Air-gapped enterprise deployment option

**Market fit:** These features directly unlock the enterprise sales motion. Without them, enterprise procurement stalls at security review.

---

## Sprint Plan

### Sprint 21 — Audit & Compliance Foundation
| Wave | Scope | Assignee | Dependencies |
|------|-------|----------|-------------|
| Wave 1 | Audit Log Viewer UI + Export (CSV/JSON/PDF) | FrontendArchitect | Existing audit log API (Sprint 14) |
| Wave 2 | Audit Log API — filtering, pagination, date range | BackendArchitect | None |
| Wave 3 | UX Design Review — Audit Log screens | UXDesigner | Wave 1-2 complete |
| Wave 4 | E2E — Audit Log flows | Senior QA | All waves complete |

### Sprint 22 — Enterprise SSO & SCIM
| Wave | Scope | Assignee | Dependencies |
|------|-------|----------|-------------|
| Wave 1 | SCIM provisioning — Okta/Azure AD connector | BackendArchitect | Existing SSO (Sprint 14) |
| Wave 2 | IdP-initiated SSO — SAML/OIDC login flow | BackendArchitect | SCIM API |
| Wave 3 | SSO Configuration UI | FrontendArchitect | Backend SCIM API |
| Wave 4 | UX Design Review — SSO screens | UXDesigner | Wave 3 complete |
| Wave 5 | E2E — SSO + SCIM flows | Senior QA | All waves complete |

### Sprint 23 — Advanced RBAC + Self-Hosted
| Wave | Scope | Assignee | Dependencies |
|------|-------|----------|-------------|
| Wave 1 | Custom RBAC — role definitions, permission sets | BackendArchitect | Existing Org RBAC (Sprint 14) |
| Wave 2 | RBAC UI — Role editor, assignment UI | FrontendArchitect | Wave 1 |
| Wave 3 | Self-hosted deployment — Docker Compose, env config | CTO | Railway config (existing) |
| Wave 4 | Compliance reporting — evidence collection, export | BackendArchitect | Audit Log (Sprint 21) |
| Wave 5 | UX Design Review — RBAC + Compliance | UXDesigner | Waves 2, 4 complete |
| Wave 6 | E2E — RBAC + Self-hosted + Compliance | Senior QA | All waves complete |

---

## Parallelism Strategy (4-Runner Limit)

**Sprint 21 Phase 1 (Parallel):**
- Wave 1 (FrontendArchitect) + Wave 2 (BackendArchitect)
- UXDesigner idle until Wave 1-2 complete

**Sprint 21 Phase 2 (After Phase 1):**
- Wave 3 (UXDesigner)
- Wave 4 (Senior QA — after all waves)

**Sprint 22 Phase 1 (Parallel):**
- Wave 1-2 (BackendArchitect)
- Wave 3 (FrontendArchitect) — starts when Backend SCIM API stable

**Sprint 23 Phase 1 (Parallel):**
- Wave 1 (BackendArchitect) + Wave 3 (CTO, management-exempt)
- Wave 2 (FrontendArchitect) — starts after Wave 1 schema stable
- Wave 4 (BackendArchitect) — starts after Wave 1-2 finalize

---

## Success Criteria

1. All 3 sprints delivered with passing E2E tests
2. Audit log viewer operational with CSV/JSON/PDF export
3. SCIM provisioning working with Okta and Azure AD test connectors
4. IdP-initiated SSO flow complete for SAML and OIDC
5. Custom RBAC with role editor UI and permission set granularity
6. Self-hosted deployment documented and tested via Docker Compose
7. Compliance reporting generates evidence artifacts
8. Budget: under $40 total for Phase 4

---

## Risk Register

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| SCIM spec complexity (RFC 7644) | Medium | Minimal V1 implementation — user/group provisioning only |
| Self-hosted deployment complexity | Medium | Docker Compose only, no Kubernetes. Leverage Railway config. |
| Scope creep on RBAC | High | Strict to 3 constructs: Role, PermissionSet, Assignment |
| Compliance reporting scope creep | Medium | Evidence collection only — no automated SOC2 report generation |
| Sprint 20 delays | Low | Phase 4 start date shifts accordingly |

---

## Budget Allocation

| Sprint | Est. Cost | % Remaining |
|--------|-----------|-------------|
| Sprint 21 | $8-12 | 1.6-2.4% |
| Sprint 22 | $6-10 | 1.2-2.0% |
| Sprint 23 | $6-10 | 1.2-2.0% |
| Buffer | $5-8 | 1.0-1.6% |
| **Total** | **$25-40** | **5-8%** |

## Board Recommendation

**Recommendation:** Approve Phase 4 execution on completion of Sprint 20 gate criteria (G1-G6 all green).

**Conditional approval requested now** to avoid delay between Sprint 20 → Phase 4. Board to confirm via interaction when Sprint 20 gates clear.

**Capital request:** $25-40 budget allocation (5-8% of remaining $485 runway). Well within budget cap.

**Expected start:** Immediate following Sprint 20 E2E pass.

**Risk-adjusted confidence:** High. All 6 epics are well-understood enterprise patterns. No novel technical risk. SCIM (RFC 7644) is the highest complexity item at Medium risk.
