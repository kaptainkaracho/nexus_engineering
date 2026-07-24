# Sprint 20 — Polish & GTM Sprint

**Status:** Approved (Board accepted Option A via interaction 996f4bd5 on THE-319)
**Parent Strategy:** `plans/post-phase-3-strategy.md`
**Date:** 2026-07-24
**Budget Estimate:** $5-8 (well within $486.50 remaining)
**WIP Limit:** 4 (CEO approved THE-320 Option A — increase 2→4)

---

## Sprint Goal

Polish the platform for external demo readiness and GTM positioning. Fix remaining edge cases, harden documentation, optimize performance.

---

## Wave Plan

| Wave | Scope | Assignee | Type | Dependencies |
|------|-------|----------|------|-------------|
| **Wave 1** | UI Polish + Consistency Pass | FrontendArchitect + UXDesigner | Frontend/UX | None |
| **Wave 2** | Documentation + Demo Refresh | BackendArchitect | Backend | None |
| **Wave 3** | Bug Fixes + Edge Case Hardening | BackendArchitect + FrontendArchitect | Fullstack | Waves 1-2 complete |
| **Wave 4** | Performance Optimization | CTO | Infrastructure | None (can run alongside Waves 1-2) |
| **Wave 5** | E2E Verification | Senior QA | QA | All Waves complete (1-4) |

### Parallelism Strategy (4-Runner Limit)

**Phase 1 (Parallel — up to 4 runners):**
- Wave 1a: UI Polish (FrontendArchitect)
- Wave 1b: UX Review (UXDesigner)
- Wave 2: Docs Refresh (BackendArchitect)
- Wave 4: Performance (CTO — exempt from count)

**Phase 2 (After Phase 1 issues complete):**
- Wave 3: Bug fixes (BackendArchitect + FrontendArchitect)

**Phase 3 (After all code complete):**
- Wave 5: E2E verification (Senior QA)

---

## Issue Breakdown

### Wave 1a: UI Polish + Consistency Pass (FrontendArchitect)
- Audit all UI pages for visual consistency (spacing, colors, typography)
- Fix alignment, padding, and responsive layout issues
- Standardize component usage across views
- Check dark mode consistency

### Wave 1b: UX Design Review (UXDesigner)
- Review all user-facing screens for UX consistency
- Provide design token guidance to FrontendArchitect
- Verify accessibility basics (contrast, focus states)

### Wave 2: Documentation + Demo Refresh (BackendArchitect)
- Update README with current architecture and setup instructions
- Add API documentation for public endpoints
- Create demo script/scenario for external showing
- Verify onboarding flow works end-to-end

### Wave 3: Bug Fixes + Edge Case Hardening (BackendArchitect + FrontendArchitect)
- Address known edge cases in trace graph rendering
- Fix error handling gaps in API responses
- Harden input validation across forms
- Address any UI bugs found in Wave 1

### Wave 4: Performance Optimization (CTO)
- Profile page load times and identify bottlenecks
- Optimize database queries in trace retrieval
- Add caching where appropriate
- Reduce bundle size (code splitting, lazy loading)

### Wave 5: E2E Verification (Senior QA)
- Run full E2E test suite
- Verify all previous Waves meet acceptance criteria
- Report any regressions

---

## Success Criteria

1. All 5 waves delivered with passing E2E tests
2. Demo-ready state: clean UI, working onboarding, accurate docs
3. Performance: page load <2s for standard views
4. E2E: all existing tests pass + new tests for hardened areas
5. Budget: under $8 total

---

## Risk Register

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Scope creep on "polish" | High | Strict per-wave DoD; WIP=4 prevents overload |
| Coordination overhead with 4 parallel agents | Medium | Safety valve: roll back to WIP=3 if issues emerge |
| Performance optimization scope too broad | Medium | CTO to limit to top-3 bottlenecks only |
