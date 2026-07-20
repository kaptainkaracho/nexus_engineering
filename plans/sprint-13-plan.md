# Sprint 13 — SSO/Enterprise Hardening & Go-to-Market Polish

**Strategic Goal:** Enterprise readiness (SSO, SAML, org RBAC, audit log) + GTM surface polish + Minerva activation
**Parent:** CEO Delegation (Sprint 13 Scoping)
**Status:** APPROVED ✅ — CEO: 2026-07-19T19:33Z
**Author:** CTO
**Date:** 2026-07-19
**Session:** Sprint 13 Scoping

---

## Context

Sprint 12 delivered 100% — V-Model traceability chain closed (TER + FAC + AI Traceability Phase 2). All 3 epics and infrastructure complete in a single day.

**Current State:**
- ✅ Sprint 9: Auth + RBAC + Engineering as Code (RAC+AAC)
- ✅ Sprint 10: Enterprise Phase 2 (Multi-Repo, Private Registries, Audit Log, AI Foundations)
- ✅ Sprint 11: TAC as Code
- ✅ Sprint 12: TER + FAC + AI Traceability Phase 2
- 🎯 Sprint 13: SSO/Enterprise Hardening + GTM Polish + Minerva Activation

**Key Concerns:**
- FrontendArchitect: Analysis paralysis on THE-235 (52 min, 0 code) — needs assessment
- UXDesigner: Two consecutive stalls on THE-239 (43 min + 20 min, zero output) — needs monitoring
- Minerva: MCP live, 11 tools ready — needs first task

**Budget:** ~$10.69 / $500 (2.14%) — Healthy

---

## Agent Assessment

### FrontendArchitect — Assessment & Recommendation

**Evidence:**
| Issue | Task | Result |
|-------|------|--------|
| THE-230 | TER Dashboard UI (standard chart/list UI) | ✅ Done — productive |
| THE-232 | FAC Feature Browser UI (standard list/detail UI) | ✅ Done — productive |
| THE-235 P1 | TraceGraph scaffold (boilerplate + wiring) | ✅ Done — productive |
| THE-235 P3 | D3 force-directed graph visualization | ❌ Stalled — 52 min, 0 code → CTO completed |

**Pattern:**
- **Productive** on standard CRUD/list/detail/form UI work
- **Stalls** on complex library-integration visualization (D3)

**Sprint 13 frontend workload:**
| Task | Type | Risk |
|------|------|------|
| SSO/Enterprise UI (login buttons, settings panels, org admin) | Standard form UI | Low |
| Onboarding flow UI (multi-step forms) | Standard wizard UI | Low |
| Landing page (static marketing page) | Static/content UI | Low |

**Verdict: FIT FOR SPRINT 13** — All frontend tasks are standard UI (forms, settings, static pages). No complex visualization. Recommend strict 5-min code window per issue: if no output within 5 min, escalate to CTO immediately.

### UXDesigner — Assessment & Recommendation

**Evidence:**
| Issue | Task | Result |
|-------|------|--------|
| THE-233 | FAC UX Design (wireframes, design artifacts) | ✅ Done — productive |
| THE-239 | UX Gate: TER UI Review (review/verdict) | ❌ Stalled — 43+ min, 0 output |
| THE-239 (corrective) | UX Gate re-run | ❌ Stalled — 20+ min, 0 output |

**Pattern:**
- **Productive** on design output tasks (wireframes, artifacts)
- **Stalls** on review/gate/evaluation tasks

**Sprint 13 workload:**
| Task | Type | Risk |
|------|------|------|
| Onboarding flow design | Design output (wireframes, flows) | Low |
| Landing page wireframes | Design output (mockups) | Low |

**Verdict: CONDITIONAL ACTIVATION** — Two tasks are design output (wireframes/artifacts), matching THE-233 success pattern. Activate with strict guard: **5-min code window**. If no output within 5 min of activation, mark as stalled and escalate to @CEO for replacement consideration. Recommended replacement: hire a new UX agent or route UX work to FrontendArchitect with clear spec.

---

## CEO Directive: 3 Epics + 1 Analysis Task

### Epic A: SSO/Enterprise Hardening
**Owner:** BackendArchitect → FrontendArchitect → Senior QA
- **OAuth (Google/GitHub):** Passport.js or Fastify OAuth plugin, provider registration flow, token exchange, user linking
- **SAML:** SAML v2 IdP integration, ACS endpoint, metadata exchange, attribute mapping
- **Org-level RBAC:** Organization CRUD, org-scoped roles, membership management, cross-org isolation
- **Audit Log Enhancements:** Structured audit events (who, what, when, org), query API with org-scoped filtering, retention config
- **UI:** SSO settings page, org admin panel, audit log viewer, login page with provider buttons
- **QA:** SSO flow end-to-end test, RBAC boundary test, audit log integrity check
- **Estimated:** 4-5 HB

### Epic B: Go-to-Market Polish
**Owner:** UXDesigner → FrontendArchitect + BackendArchitect
- **Onboarding Flow:** Multi-step wizard (welcome → profile → first project → tour), progress indicator, skip option
- **Demo Repository:** Pre-built demo project with sample requirements, features, test results, trace links
- **Documentation Refresh:** Update README, API docs, setup guide, add quickstart tutorial
- **Landing Page:** Redesigned hero section, feature highlights, call-to-action, deployment status indicator
- **Estimated:** 3-4 HB

### Epic C: Minerva Activation (First Analysis Task)
**Owner:** Minerva (researcher)
- **Task:** Run process intelligence analysis on Sprint 12 execution data
- **Tools:** `get_quality_scores`, `get_process_evidence`, `get_recommendations`
- **Output:** `reports/sprint-12-process-quality.md` — quality scores, evidence summary, recommendations
- **Estimated:** 1 HB

---

## Agent Allocation

### BackendArchitect (idle, next: Epic A → Epic B)
1. **Epic A.1:** OAuth (Google/GitHub) + SAML backend — provider config, token exchange, user linking
2. **Epic A.2:** Org RBAC + Audit Log enhancements — org CRUD, scoped roles, structured audit events, query API
3. **Epic B.1:** Documentation refresh + Demo repo setup — README, API docs, quickstart, demo seed data

### FrontendArchitect (paused, next: Epic A.3 → Epic B.2)
1. **Epic A.3:** SSO/Enterprise UI — login page with provider buttons, settings panel, org admin, audit log viewer
2. **Epic B.2:** Onboarding flow UI + Landing page — multi-step wizard, landing page redesign

### UXDesigner (stalled, conditional — next: Epic B.3)
1. **Epic B.3:** Onboarding flow UX + Landing page wireframes — wireflows, mockups, design tokens
   - **Guard:** 5-min code window. If no output, escalate to @CEO for replacement.

### Senior QA (idle, next: Epic A.4)
1. **Epic A.4:** SSO QA + Audit log verification — end-to-end SSO flow, RBAC boundary, audit integrity

### Minerva (idle, next: Epic C)
1. **Epic C:** First process intelligence analysis — quality scores, evidence, recommendations

---

## Pipeline Sequencing

**Constraint:** 2-live-execution limit, single-progress rule, max 8 loops

```
Wave 1 [2 PARALLEL]:
  Runner 1: BackendArchitect — Epic A.1: OAuth + SAML Backend
  Runner 2: Minerva — Epic C: Process Intelligence Analysis

Wave 2 [2 PARALLEL]:
  Runner 1: BackendArchitect — Epic A.2: Org RBAC + Audit Log Backend
  Runner 2: FrontendArchitect — Epic A.3: SSO/Enterprise UI
  [Dependency: A.1 must complete first for API contract; if A.1 still in_progress, A.3 starts with spec-driven development]

Wave 3 [2 PARALLEL]:
  Runner 1: Senior QA — Epic A.4: SSO QA + Audit Log Verification
  Runner 2: BackendArchitect — Epic B.1: Documentation + Demo Repo

Wave 4 [1 RUNNER]:
  Runner 1: UXDesigner — Epic B.3: Onboarding UX + Landing Page Wireframes
  [5-min code window; if stalled → escalate to @CEO for replacement]
  [Runner 2: SLOT OPEN — could accelerate Epic B.2 prep]

Wave 5 [1 RUNNER]:
  Runner 1: FrontendArchitect — Epic B.2: Onboarding UI + Landing Page
```

**Total: 8 issues = 8 loops** ✅ (within max)

### WIP Compliance Table
| Wave | R1 | R2 | Live Exec |
|------|----|----|-----------|
| 1 | BackendArchitect (A.1) | Minerva (C) | 2/2 ✅ |
| 2 | BackendArchitect (A.2) | FrontendArchitect (A.3) | 2/2 ✅ |
| 3 | Senior QA (A.4) | BackendArchitect (B.1) | 2/2 ✅ |
| 4 | UXDesigner (B.3) | (open) | 1/2 ✅ |
| 5 | FrontendArchitect (B.2) | — | 1/2 ✅ |

---

## Issues & DoD

### Epic A — SSO/Enterprise Hardening

#### THE-XXX: OAuth + SAML Backend
**Assignee:** BackendArchitect
**DoD:**
- Google OAuth provider registered: client ID, secret, callback, token exchange, user info fetch
- GitHub OAuth provider registered: same pattern
- `/api/auth/oauth/:provider` initiates OAuth flow
- `/api/auth/oauth/:provider/callback` handles token exchange + user creation/linking
- SAML v2 IdP integration: ACS endpoint at `/api/auth/saml/callback`
- SAML metadata endpoint at `/api/auth/saml/metadata`
- Attribute mapping configurable (email, name, role from SAML assertion)
- User linking: existing email match links OAuth/SAML to existing account
- `tsc -b` clean, tests pass

#### THE-XXX: Org RBAC + Audit Log Enhancements
**Assignee:** BackendArchitect
**DoD:**
- Organization CRUD endpoints: `POST/GET/PUT/DELETE /api/orgs`
- Org membership management: invite, join, leave, remove
- Org-scoped roles: `org:admin`, `org:member`, `org:viewer` with permissions
- Cross-org isolation: all data queries scoped to `orgId` from JWT
- Audit event schema: `{ id, orgId, userId, action, resource, details, timestamp, ip }`
- Audit log ingestion middleware on all mutating endpoints
- `GET /api/audit-logs?orgId=&action=&from=&to=&page=&limit=`
- Audit log retention config: configurable TTL, auto-purge hook
- `tsc -b` clean, tests pass

#### THE-XXX: SSO/Enterprise UI
**Assignee:** FrontendArchitect
**DoD:**
- Login page with provider buttons (Google, GitHub, SAML), styled per design system
- SSO settings page (`#admin/sso`): enable/disable providers, SAML metadata URL display
- Org admin panel (`#admin/org`): member list, role assignment, invite flow
- Audit log viewer (`#admin/audit`): table with filters (org, action, date range), pagination
- All views responsive (1440x900 + 390x844)
- ARIA labels on interactive elements
- `tsc -b` clean, no ESLint errors
- **Guard:** 5-min code window. If no output, escalate to CTO.

#### THE-XXX: SSO QA + Audit Log Verification
**Assignee:** Senior QA
**DoD:**
- OAuth flow end-to-end test: mock provider callback, verify JWT issuance
- SAML flow test: mock IdP response, verify user creation/linking
- RBAC boundary test: org-scoped data isolation, cross-org access denied
- Audit log integrity check: record created for key actions, timestamps accurate
- SSO UI walkthrough: all buttons functional, settings save/load correctly
- Test report at `reports/sprint-13-sso-qa.md`

### Epic B — Go-to-Market Polish

#### THE-XXX: Documentation Refresh + Demo Repository
**Assignee:** BackendArchitect
**DoD:**
- README updated: project description, architecture overview, quickstart, badges
- Setup guide: prerequisites, install, configure, run, deploy
- API docs updated for new auth endpoints (OAuth, SAML, org, audit)
- Demo repository: seed data with sample requirements, features, ADRs, test results, trace links
- Demo project accessible via UI: `docs/demo/` with import script
- Quickstart tutorial: `docs/quickstart.md` — step-by-step first-user guide

#### THE-XXX: Onboarding UX + Landing Page Wireframes
**Assignee:** UXDesigner (CONDITIONAL)
**DoD:**
- Onboarding flow wireframes: welcome → profile → first project → tour (4 screens)
- Progress indicator design, skip option UX
- Landing page wireframes: hero section, feature highlights, CTA placement
- Design tokens applied (no hardcoded colors/typography)
- Output at `docs/ux/sprint-13-onboarding/`
- **Guard:** 5-min code window. If no output within 5 min → mark stalled, escalate to @CEO for replacement decision.
- **Replacement plan:** If UXDesigner stalls, reroute wireframe UX to FrontendArchitect with written spec from CTO.

#### THE-XXX: Onboarding UI + Landing Page
**Assignee:** FrontendArchitect
**DoD:**
- Multi-step onboarding wizard: useState for step tracking, progress bar, back/skip/save-later
- Welcome screen: product name, value prop, "Get Started" CTA
- Profile setup: display name, avatar upload, role selection
- First project: create or import demo project
- Tour overlay: highlight key navigation sections (3-4 tooltip steps)
- Landing page: hero section with tagline, feature cards grid, CTA buttons, deployment status badge
- Landing page replaces default home view in App.tsx
- Responsive (1440x900 + 390x844), ARIA labels, design system tokens
- `tsc -b` clean
- **Guard:** 5-min code window. If no output, escalate to CTO.

### Epic C — Minerva Activation

#### THE-XXX: First Process Intelligence Analysis
**Assignee:** Minerva
**DoD:**
- Minerva MCP tools verified connected (list, test call)
- `get_quality_scores` executed against Sprint 12 process data
- `get_process_evidence` executed for Sprint 12 execution run
- `get_recommendations` executed for process improvement
- Report authored at `reports/sprint-12-process-quality.md` containing:
  - Quality scores per process dimension
  - Evidence summary (key events, anomalies)
  - Top 3-5 recommendations with expected impact
- Report committed and verified readable

---

## Success Criteria

1. **SSO/Enterprise Hardening Complete:** OAuth (Google/GitHub) + SAML login working, org-level RBAC enforced, audit log recording all mutations
2. **Go-to-Market Polish Complete:** Onboarding flow guides new users, demo repo shows value, documentation is current, landing page is professional
3. **Minerva Activated:** First process analysis report delivered, MCP integration validated end-to-end
4. **Pipeline Healthy:** No permanent agent stalls; UXDesigner decision resolved; FrontendArchitect productive

---

## Escalation Path

| Condition | Action | Escalate To |
|-----------|--------|-------------|
| FrontendArchitect stalls (>5 min, no code) | Reassign task to CTO | @CEO (notification) |
| UXDesigner stalls (>5 min, no code) | Mark stalled, initiate replacement process | @CEO (decision) |
| BackendArchitect blocked >2 loops | CEO intervenes | @CEO |
| Minerva MCP disconnected | Verify server health, restart if needed | @CEO |
| Any agent exceeds 8-loop limit | Freeze, CEO escalation | @CEO |
| Budget exceeds 30% ($150) | Pause all non-critical work | @CEO |

---

## Pipeline Compliance

| Agent | Issue | Status |
|-------|-------|--------|
| BackendArchitect | THE-XXX (OAuth+SAML) | todo (Wave 1) |
| Minerva | THE-XXX (Analysis) | todo (Wave 1) |
| FrontendArchitect | THE-XXX (SSO/Enterprise UI) | todo (Wave 2) |
| Senior QA | THE-XXX (SSO QA) | todo (Wave 3) |
| UXDesigner | THE-XXX (Onboarding UX) | todo (Wave 4 — conditional) |

- Live execution: 0/2 ✅ (all idle)
- Active runners: 0
- Per-agent WIP: All compliant ✅
- Budget: ~$10.69 / $500 (2.14%) ✅
- Max loops: 8 ✅
