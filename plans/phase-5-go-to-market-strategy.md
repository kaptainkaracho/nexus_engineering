# Phase 5: Go-to-Market & Platform Maturity

**Status:** ✅ BOARD APPROVED — 2026-07-28 15:31 UTC. All 3 `request_confirmation` interactions accepted by local-board.
**Prerequisite:** ✅ Sprint 24 (Enterprise Phase 2) — ALL CLOSED. Sprint 25 (Integration Ecosystem) — ALL CLOSED. Pipeline idle.
**THE-402:** Phase 5 board decision — DONE. THE-401 cancelled (superseded).
**Sprint 26 Active:** THE-403 (parent) — **W1 DONE** (commit 584bf10), **W2 IN REVIEW** (commit 740e09d), **W3 IN PROGRESS** (commit 492bc3f), **W2g IN PROGRESS** (UXD gate review), W4 blocked on completion.
**Sprint 27 (THE-409):** PRE PLAN — `plans/sprint-27-docs-and-dx.md`. Awaiting Sprint 26.
**Sprint 28 (THE-410):** PRE PLAN — `plans/sprint-28-performance-and-hardening.md`. Awaiting Sprint 27.

## Strategic Rationale

Sprints 21-24 delivered Enterprise Phase 2: SCIM provisioning, advanced RBAC, compliance reporting, self-hosted deployment. Sprint 25 extends the platform with ecosystem integrations (Jira/Linear/GitHub). 

The platform is now **feature-complete for enterprise evaluation**. Phase 5 shifts from feature delivery to **market readiness**.

## Three Pillars

### Pillar 1: Go-to-Market Content (Sprint 26)
**Est. Cost:** $5-8

- **Demo mode:** One-click sandbox with pre-loaded traceability data (ADR samples, requirement trees, trace graphs)
- **Screencast / video demo:** Record a 3-min walkthrough of the core value prop — requirement→code→test traceability
- **Landing page refresh:** Polish the marketing-facing content (value prop, screenshots, use cases)
- **Customer onboarding checklist:** Structured doc for first-week customer setup
- **Deployment guide:** Update DEPLOYMENT.md with Railway one-click deploy flow

**Owner:** CMO (if hired) or CEO/CTO combo. FrontendArchitect for landing page. BackendArchitect for demo seed data.

### Pillar 2: Docs & Developer Experience (Sprint 27)
**Est. Cost:** $4-7

- **API reference docs:** Auto-generate OpenAPI docs from route schemas
- **User guide:** Walkthrough for requirements-as-code, architecture-as-code, test-as-code workflows
- **CLI reference:** Document `nexus scan`, `nexus trace`, `nexus gate` commands
- **Example repos:** Publish 2-3 example repos showing the full traceability workflow
- **Quickstart:** Reduce to <5 commands from git clone to trace graph

**Owner:** BackendArchitect (API docs, CLI), Technical Writer (if hired).

### Pillar 3: Performance & Hardening (Sprint 28)
**Est. Cost:** $6-10

- **Performance audit:** Profile backend for large repos (10K+ files). Profile frontend bundle load.
- **Rate limiting:** Verify rate limiter covers all public endpoints
- **Error handling audit:** Ensure all API routes return consistent error shapes
- **Caching layer:** Add response caching for trace graph queries (most expensive operation)
- **Security audit:** Verify RBAC enforcement, SAML token validation, self-hosted secrets management

**Owner:** BackendArchitect (performance, caching), CTO (security audit), FrontendArchitect (bundle perf).

## Sequencing

```
Sprint 26 (W1-W2): GTM Content — parallel demo mode + landing page
Sprint 27 (W3-W4): Docs & DX — parallel API docs + user guide
Sprint 28 (W5-W6): Performance — serial audit → fix → verify
```

Sprints 26 and 27 can partially overlap if capacity allows (FA on landing page while BA on demo seed data).

### Sprint Plans
- **Sprint 26 (GTM Content):** `plans/../THE-403` — IN EXECUTION. 2/4 live runners.
- **Sprint 27 (Docs & DX):** `plans/sprint-27-docs-and-dx.md` — PRE PLAN. Awaiting Sprint 26 close.
- **Sprint 28 (Perf & Hardening):** `plans/sprint-28-performance-and-hardening.md` — PRE PLAN. Awaiting Sprint 27 close.

## Budget Estimate

| Sprint | Pillar | Min | Max |
|--------|--------|-----|-----|
| 26 | GTM Content | $5 | $8 |
| 27 | Docs & DX | $4 | $7 |
| 28 | Performance | $6 | $10 |
| **Buffer** | Contingency | $3 | $5 |
| **Total** | | **$18** | **$30** |

Current runway: ~$483 (96.6% remaining). Phase 5 at ~$18-30 = ~4-6% of runway — **within 10% gate**.

## Confirmation Gate

This document is a **DRAFT concept**. Before creating execution issues:
1. CEO presents to board via `request_confirmation` on the Phase 5 planning issue
2. Board approves scope, budget, sequencing
3. Sprint 24 close + Sprint 25 W1-W3 delivery confirmed as prerequisite
4. Only then → child issues created with strict WIP limits

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Demo mode scope creep | Medium | Strict MVP: pre-loaded data + read-only sandbox. No user accounts |
| Docs effort underestimated | Medium | Auto-generate what we can; manual polish limited to 1 sprint |
| Performance issues block release | Low | Address in Sprint 28; release can proceed with known perf limits |
| Customer feedback drives re-prioritization | High | Keep Phase 5 lean; plan for Phase 6 after first customer discovery calls |
