# Phase 4 — Enterprise Phase 2 Strategy

**Status:** Board-Ready (Revision 2)
**Author:** CEO
**Date:** 2026-07-24
**Parent:** `plans/post-phase-3-strategy.md` (Option A — after Sprint 20)
**Prerequisite:** Sprint 20 completion (all 5 waves)
**Go/No-Go Gate:** THE-330 in_review AND THE-338 approved by UX Gate AND THE-331 QA: PASS

---

## Strategic Thesis

Nexus Engineering is positioned as an **Engineering as Code Viewer and Traceability Platform**. Phase 1-3 delivered the core lifecycle (Requirements → Architecture → Features → Traceability → CI/CD Gates) plus Enterprise SSO (OAuth, SAML, Org RBAC, Audit Log).

Phase 4 extends the enterprise surface to meet real-world procurement requirements: **automated identity management, fine-grained access control, compliance reporting, and self-hosted deployment.** These are the features that unlock paid enterprise trials and SOC2-type evaluations.

---

## Scope (6 Epics)

| Epic | Scope | Dependencies | Estimated Complexity |
|------|-------|-------------|---------------------|
| **E1** | Audit Log Viewer & Export | Audit API exists (GET, export, retention). Needs polished UI in admin panel. | Medium |
| **E2** | SCIM Provisioning | Auto-provision/deprovision users from corporate IdP (Azure AD, Okta, Google). SCIM 2.0 protocol. | High |
| **E3** | IdP-Initiated SSO | SAML IdP-initiated flow (user starts at IdP, redirected to Nexus). Current: SP-initiated only. | Low-Medium |
| **E4** | Advanced RBAC | Custom roles, permission sets, granular resource-level access beyond org-level roles. | High |
| **E5** | Compliance Reporting | SOC2-ready audit reports, exportable compliance dashboards, retention policy UI. | Medium-High |
| **E6** | Self-Hosted Deployment | Docker Compose, Kubernetes manifests, air-gapped install guide, license key validation. | Medium |

---

## Proposed Sprint Sequencing

### Sprint 21 — Audit & SSO Foundation
- E1: Audit Log Viewer UI (FrontendArchitect + UXDesigner)
- E3: IdP-Initiated SSO (BackendArchitect)
- E2 prep: SCIM data model + API design (BackendArchitect)
- QA: Audit Log E2E + SSO regression (Senior QA)

### Sprint 22 — RBAC & SCIM
- E2: SCIM Provisioning implementation (BackendArchitect)
- E4: Custom Roles + Permission Sets (BackendArchitect + FrontendArchitect + UXDesigner)
- E5 prep: Compliance report schema + data aggregation (BackendArchitect)
- QA: SCIM + RBAC E2E (Senior QA)

### Sprint 23 — Compliance & Deployment
- E5: Compliance Reporting UI (FrontendArchitect)
- E6: Self-Hosted Deployment packaging (CTO)
- Hardening + E2E sweep (Senior QA)
- Demo prep for enterprise prospects

---

## Resource Allocation Principles

1. **BackendArchitect** — Primary engine for E2, E3, E4 (API layer), E5 (data aggregation). Highest utilization.
2. **FrontendArchitect** — E1 (Audit UI), E4 (RBAC UI), E5 (Compliance dashboards). Coordinate with UXDesigner.
3. **UXDesigner** — E1 (Audit viewer UX), E4 (role management UX), E5 (compliance dashboard UX). Mandatory gate on all frontend work.
4. **CTO** — E6 (Self-hosted deployment). Infrastructure focus. Also oversees SCIM protocol compliance.
5. **Senior QA** — E2E verification per sprint. Smoke test matrix for self-hosted deployment.

---

## Budget Estimate

| Sprint | Estimated Cost | Notes |
|--------|---------------|-------|
| Sprint 21 | $8-12 | Audit UI, IdP-init SSO, SCIM design |
| Sprint 22 | $10-15 | SCIM impl, RBAC, compliance prep |
| Sprint 23 | $8-12 | Compliance UI, self-hosted packaging |
| **Total** | **$26-39** | Well within ~$485 remaining budget |

---

## Success Criteria

1. All 6 epics delivered across 3 sprints
2. Audit log viewer functional with export, retention config, compliance-level filtering
3. SCIM 2.0 provisioning: users auto-provisioned/deprovisioned via Azure AD and Okta
4. IdP-initiated SSO flow working alongside existing SP-initiated flow
5. Custom roles with granular permission sets enforceable via API
6. Compliance reports exportable as PDF/CSV with SOC2-ready format
7. Self-hosted deployment: `docker compose up` launches fully functional Nexus instance
8. Budget under $40 total
9. All E2E tests passing per sprint

---

## Risk Register

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| SCIM protocol complexity (RFC 7642-7644) | Medium | BackendArchitect to prototype with Okta test tenant first; limit to core user/group provisioning (no schema negotiation) |
| Self-hosted deployment scope creep | Medium | Strict MVP: Docker Compose only. K8s = documented "future work" |
| RBAC permission explosion | Medium | Start with 5-8 predefined permission sets + custom role builder. No per-resource ACLs |
| Audit UI scope too broad | Medium | Phase 1: basic viewer + export. Phase 2: advanced filtering + compliance dashboard |
| Pipeline congestion (4 agents) | Low | Standard 4-runner limit applies. Safety valve: roll back to WIP=3 if coordination issues emerge |

---

## Architectural Guardrails

1. **SCIM:** Use existing `/api/auth/users` and `/api/organizations` as providers. SCIM gateway layer maps SCIM operations to existing Nexus APIs. No new DB schema for SCIM — reuse org membership model.
2. **IdP-Init SSO:** Extend existing SAML ACS handler. Detect `RelayState` for IdP-init flow. Share session creation code with SP-init path.
3. **Custom RBAC:** Add `permissions` field to role model. Predefined permission sets as TypeScript enums. Middleware checks at API handler level. Inherit current org-level isolation.
4. **Compliance Reports:** Extend existing audit log aggregation. Use templates for PDF generation. Structure reports around common SOC2 control categories.
5. **Self-Hosted:** Single `docker-compose.yml` with Nexus API + Frontend + Postgres. Configuration via environment variables. License key check at startup (stub initially).

---

## Go / No-Go Decision

### Activation Checklist

Before Phase 4 execution begins, ALL of the following must pass:

| # | Criterion | Status | Notes |
|---|-----------|--------|-------|
| 1 | THE-330 (Bug Fixes) = done | ☐ | BackendArchitect must complete all route hardening |
| 2 | THE-338 (Frontend Perf) = UX Gate approved | ☐ | FrontendArchitect implementation + UXDesigner review |
| 3 | THE-331 (E2E Verification) = QA: PASS | ☐ | All Sprint 20 regressions resolved |
| 4 | Budget check: >$40 remaining | ☐ | Current: ~$485 remaining ✅ (will pass) |
| 5 | CEO board approval of Phase 4 plan | ☐ | This document + confirmation interaction |

### Go Decision

When all 5 criteria above are met, Phase 4 launches with Sprint 21.

### No-Go Actions

If any criterion fails:
- **THE-330 incomplete** → Extend Sprint 20 by 1 cycle, re-check
- **THE-338 fails UX Gate** → FrontendArchitect rework loop (max 2 iterations), then escalate to CEO
- **THE-331 fails QA** → Blocking regressions must be resolved before Phase 4
- **Budget <$40** → Reduce Sprint 21 scope (drop E2 SCIM design, start with E1+E3 only)

---

## Sprint-Level Execution Plans

### Sprint 21 — Audit & SSO Foundation

**Goal:** Deliver Audit Log Viewer (E1) + IdP-Initiated SSO (E3) + SCIM data model design (E2 prep)

#### Issue Breakdown

| Issue | Title | Assignee | DoD |
|-------|-------|----------|-----|
| THE-xxx | E1: Audit Log Viewer UI | FrontendArchitect | Audit log table with pagination, date filtering, export (CSV/JSON), retention config UI. UX Gate required. |
| THE-xxx | E1: Audit Log UX Review | UXDesigner | Gate review: verify filter UX, export flow, retention setting clarity. Initial status: `blocked` (on Audit UI in_review). |
| THE-xxx | E3: IdP-Initiated SAML SSO | BackendArchitect | Extend existing SAML ACS handler. Detect `RelayState` for IdP-init flow. Share session code with SP-init path. Existing SSO tests must still pass. |
| THE-xxx | E2 prep: SCIM Data Model + API Design | BackendArchitect | Document SCIM 2.0 mapping (RFC 7643). Define `/api/scim/v2/{Users,Groups}` endpoints. No implementation — design doc + OpenAPI spec only. |
| THE-xxx | Sprint 21 E2E Verification | Senior QA | E2E tests for Audit Log viewer flow, IdP-init SSO. Regression suite on existing SSO paths. |

#### Sprint 21 Resource Allocation

| Agent | Issue(s) | Estimated Load |
|-------|----------|---------------|
| BackendArchitect | E3 (IdP SSO) + E2 prep (SCIM design) | HIGH — 2 issues, sequential |
| FrontendArchitect | E1 (Audit UI) | MEDIUM — 1 issue with UX gate |
| UXDesigner | E1 UX gate | LOW — 1 gate review |
| Senior QA | E2E verification | MEDIUM — 1 verification pass |
| CTO | Oversight: SCIM protocol compliance review | LOW — advisory |

---

### Sprint 22 — RBAC & SCIM

**Goal:** Implement SCIM Provisioning (E2) + Custom RBAC (E4) + Compliance data prep (E5 prep)

#### Issue Breakdown

| Issue | Title | Assignee | DoD |
|-------|-------|----------|-----|
| THE-xxx | E2: SCIM Provisioning — Users + Groups API | BackendArchitect | SCIM `/Users`, `/Groups` CRUD endpoints. Okta/Azure AD test tenant verified. Mapping to existing org membership model. |
| THE-xxx | E4: Custom Roles API | BackendArchitect | Role CRUD endpoints. Predefined permission sets as TS enums. Resource-level permission middleware. Inherit org isolation. |
| THE-xxx | E4: Role Management UI | FrontendArchitect | Role list, create/edit role with permission checkboxes, user-role assignment UI. UX Gate required. |
| THE-xxx | E4: RBAC UX Review | UXDesigner | Gate review: verify role creation flow, permission clarity, assignment UX. Initial status: `blocked`. |
| THE-xxx | E5 prep: Compliance Report Schema | BackendArchitect | Define report data aggregation queries. PDF/CSV template structure. SOC2 control category mapping. |
| THE-xxx | Sprint 22 E2E Verification | Senior QA | E2E for SCIM provisioning flow, RBAC enforcement, role CRUD. Regression: SSO + Auth paths. |

---

### Sprint 23 — Compliance & Deployment

**Goal:** Compliance Reporting UI (E5) + Self-Hosted Deployment (E6) + Hardening

#### Issue Breakdown

| Issue | Title | Assignee | DoD |
|-------|-------|----------|-----|
| THE-xxx | E5: Compliance Dashboard UI | FrontendArchitect | Report list, generate on-demand, download PDF/CSV. SOC2 control category view. UX Gate required. |
| THE-xxx | E5: Compliance UX Review | UXDesigner | Gate review: verify report clarity, export flow, category navigation. Initial status: `blocked`. |
| THE-xxx | E6: Self-Hosted Docker Compose | CTO | Single `docker-compose.yml` with API + Frontend + Postgres. Environment variable config. Health check endpoints. License key stub. |
| THE-xxx | E6: Deployment Documentation | CTO | Deployment guide: prerequisites, env vars, docker compose usage, troubleshooting. Air-gapped install notes. |
| THE-xxx | Sprint 23 E2E Verification | Senior QA | Full regression suite. Smoke test for self-hosted deploy. All compliance report flows. |
| THE-xxx | Enterprise Demo Prep | CTO + FrontendArchitect | Demo script for enterprise prospects. End-to-end walkthrough of all Phase 4 features. |

---

## Issue Ticket Template

When creating Phase 4 issues, use this template:

```markdown
**Title:** [Epic]: [Specific Task]
**Assignee:** [Agent]
**Priority:** P1 (Phase 4)
**Status:** todo / queued

### DoD
- [ ] DoD item 1
- [ ] DoD item 2
- [ ] UX Gate: [Gate issue code] (if frontend)
- [ ] QA: [QA issue code] (if applicable)

### Dependencies
- Depends on: [issue code]
- Blocks: [issue code]

### Scope Limit
- Max [N] tool-call loops
- If blocked >2 iterations, escalate to @CEO
```

---

## Budget Breakdown

| Sprint | Items | Estimated Cost | Cumulative |
|--------|-------|---------------|------------|
| Sprint 21 | E1, E3, E2 prep | $8-12 | $8-12 |
| Sprint 22 | E2 impl, E4, E5 prep | $10-15 | $18-27 |
| Sprint 23 | E5 UI, E6, hardening | $8-12 | $26-39 |
| **Buffer** | Contingency (20%) | $5-8 | $31-47 |
| **Total** | | **$31-47** | **Well within ~$485 remaining** |

---

## Resource Allocation Summary

| Agent | Sprint 21 | Sprint 22 | Sprint 23 |
|-------|-----------|-----------|-----------|
| **BackendArchitect** | E3 (IdP SSO) + E2 design | E2 (SCIM) + E4 API + E5 prep | — (available for hardening) |
| **FrontendArchitect** | E1 (Audit UI) | E4 (RBAC UI) | E5 (Compliance UI) + demo prep |
| **UXDesigner** | E1 gate | E4 gate | E5 gate |
| **CTO** | Advisory (SCIM) | — | E6 (Self-hosted deploy) + demo prep |
| **Senior QA** | E2E Sprint 21 | E2E Sprint 22 | E2E Sprint 23 + smoke test |

---

**Status:** ✅ Board-Ready — awaiting Sprint 20 completion for activation.
