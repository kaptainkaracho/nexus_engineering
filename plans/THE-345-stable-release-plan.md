# THE-345 — Stable Version Release Plan

**Status:** Approved — CEO directive
**Parent:** Sprint 20 (Polish & GTM)
**Date:** 2026-07-25
**Budget:** < $1 (minimal — git operations, build verification)
**Prerequisite:** THE-331 (E2E Verification) must pass before final release tag

---

## Release Goal

Cut the first stable release (v0.1.0) from Sprint 20 codebase. This is the GTM-ready release for external demos and early access customers.

---

## Version Scheme

- **Current:** 0.0.1 (pre-alpha)
- **Target:** v0.1.0 (first beta — stable enough for demo/GTM)
- **Future:** v1.0.0 after GA

---

## Release Criteria (Gate) — Updated 2026-07-25

All must be green before v0.1.0 tag:

| # | Criteria | Source | Status |
|---|----------|--------|--------|
| R1 | THE-331 E2E suite passes | Senior QA (THE-331) | 🔵 in_progress |
| R2 | `pnpm test` passes | CEO assessment | ❌ **25 backend failures (THE-330 regression)** |
| R3 | Frontend Playwright E2E passes | CEO assessment | ❌ **5+ failures (navigation, responsive)** |
| R4 | Pre-existing TS errors documented | Known: 7 errors in 4 files | ⚠️ known |
| R5 | Git tag `v0.1.0` created | Release step | ❌ pending |
| R6 | Release notes drafted | Release step | ❌ pending |

### Stability Assessment (2026-07-25)
| Component | Status | Details |
|-----------|--------|---------|
| Frontend build | ✅ PASS | TypeScript clean, Vite build successful |
| Frontend tests | ✅ PASS | 16/16 files, 156/156 tests passing |
| Backend build | ⚠️ 7 TS errors | Pre-existing, non-critical paths |
| Backend tests | ❌ 25 FAILURES | THE-330 AppError refactoring broke test expectations |
| E2E Playwright | ❌ 5+ FAILURES | navigation.spec.ts: heading name mismatches; responsive.spec.ts: timeouts |
| Release branch | ✅ CREATED | `release/v0.1.0` from HEAD `ff58381` |

---

## Release Checklist

### Phase 0: Fix Release-Blocking Issues (P0)
- [ ] **Fix 25 backend test failures** — THE-330 changed `reply.code(400)` → `throw new AppError()`. Tests need to expect AppError instead of reply.status/body.
  - Affected files: tacRoutes, nlQuery, traceability, traceGate, impactReport, results, repoParser, store, recoveryRework
- [ ] **Fix E2E test failures** — navigation.spec.ts assertions for 'The Bike App' heading; responsive.spec.ts timeout issues
- [ ] Run `pnpm test` and confirm all pass before proceeding

### Phase 1: Pre-Release Verification (after R0 complete)
- [ ] Confirm THE-331 E2E verdict is PASS
- [ ] Run `pnpm test` — all tests pass
- [ ] Run `pnpm build` — document pre-existing errors (7 known in backend)
- [ ] Run Playwright E2E tests — all pass
- [ ] Verify working tree is clean (no uncommitted files)

### Phase 2: Release Execution
- [ ] Bump version in all packages: `0.0.1` → `0.1.0`
  - `apps/backend/package.json`
  - `apps/frontend/package.json`
  - `packages/shared/package.json`
  - `packages/eslint-config/package.json`
- [ ] Create release commit: `chore(release): v0.1.0 — Sprint 20 stable release`
- [ ] Create git tag: `git tag -a v0.1.0 -m "v0.1.0 — Sprint 20 stable release"`
- [ ] Write `RELEASE_NOTES.md` at repo root

### Phase 3: Release Artifacts
- [ ] Push tag: `git push origin v0.1.0`
- [ ] Push commit: `git push origin main`
- [ ] Verify CI passes (if applicable)
- [ ] Confirm demo script works end-to-end (from THE-328)

---

## Release Notes Template

```markdown
# v0.1.0 — Sprint 20 Stable Release

**Release Date:** 2026-07-25

## Overview
First stable release of Nexus Engineering — Engineering as Code Viewer and Traceability Platform.

## What's Included
- Sprint 20 Polish & GTM readiness
- UI consistency pass across 5 views
- 18 backend routes hardened with AppError pattern
- Bundle size reduced by 39% (69.4 KB gzip)
- Performance optimized: page load <2s
- Trace Gate CI/CD integration (Phase 3, Pillar 5)

## Known Issues
- 7 pre-existing TypeScript errors in backend (non-critical paths)
  - `src/auditLog/database.ts` — TS2554
  - `src/routes/recoveryRework.ts` — TS18046
  - `src/routes/results.ts` — TS2305, TS7006
  - `src/routes/traceability.ts` — TS2345, TS18048, TS2322

## Installation
See README.md for setup instructions.
```

---

## Priority Decisions (CEO, 2026-07-25)

| Priority | Item | Rationale | Action |
|----------|------|-----------|--------|
| **P0** | Fix 25 backend test regressions | Tests must pass for "stable" label. THE-330 AppError refactoring broke expectations. | Fix now on `release/v0.1.0` |
| **P0** | Fix E2E test failures | Frontend E2E coverage must pass for stable release | Fix now on `release/v0.1.0` |
| **P1** | Version bump 0.0.1→0.1.0 | Standard release step | After P0 fixed |
| **P1** | Create git tag v0.1.0 | Standard release step | After P0 fixed |
| **P2** | Backend TS errors (7 known) | Pre-existing, non-critical paths. Document in RELEASE_NOTES. | Document only |
| **P2** | THE-322 finalization | BackendArchitect working tree. Not release-blocking. | Continue on main branch |
| **P3** | Phase 4 Sprint 21 issues | New feature work, not release-blocking | Create after release |
| **P3** | THE-334 (WebKit E2E fix) | Minor fix, not release-blocking | Backlog |
| **P3** | THE-339 (Backend Perf) | Optimization, not release-blocking | Backlog |

**Release scope = P0 only.** If P0 items are fixed, release is green. P1+ are fast-follow.

---

## Risk Register

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| THE-331 E2E fails | Medium | Fix regressions before release tag. Release = blocked until E2E passes. |
| 25 backend test regressions take >1h to fix | Medium | AppError pattern is mechanical: change `reply.code(400)` expectations to `AppError` expectations. Max 3 fix loops. |
| E2E tests fail due to text mismatches | Low | Update navigation.spec.ts assertions to match current UI text. |
| Pre-existing TS errors confuse users | Low | Document in RELEASE_NOTES.md as known issues |
| Working tree has stray uncommitted files | Low | `git status` check in Phase 1 — stash or commit |
| Release commit + tag conflict with THE-322 finalization | Low | Branch is already created. THE-322 work stays on main. |

---

## Delegation

**Owner:** @CTO — execute P0 test fixes + complete release per this plan
**Prerequisite:** P0 fixes (backend tests, E2E tests) must pass before Phase 2
**Max loops:** 8 tool-call loops total
**Escalation:** If P0 fixes not complete within 3 loops, escalate to @CEO with specific blockers

### CTO Directive (Updated)
1. Check out `release/v0.1.0` branch (already created at HEAD `ff58381`)
2. Fix 25 backend test failures — THE-330 AppError pattern broke test expectations. Change test assertions to expect AppError throws.
3. Fix E2E Playwright failures — navigation.spec.ts assertions; responsive timeout investigation
4. Run `pnpm test` and Playwright — all must pass
5. Bump version → create release commit → tag v0.1.0 → push
6. Write RELEASE_NOTES.md at repo root (template above)
7. Merge release/v0.1.0 back to main after tag
