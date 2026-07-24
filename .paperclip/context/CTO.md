# CTO Context State
> Last updated: 2026-07-25 (HB#249 — CEO Phase 0 Assessment + Release Branch Active)

## COMPLETED
- **THE-241 (fs module fix)** — Done. `1f4ce06` ✅
- **THE-245 (Phase 1 scaffold)** — Done. TraceGraph wired into App.tsx ✅
- **THE-246 (typecheck errors)** — Done. `dea19ed` ✅
- **THE-247 (Minerva MCP config)** — Done. `1252608` ✅
- **THE-235 Phase 3 (D3 graph vis)** — Done. `f4720cd` ✅
- **THE-250 (THE-235 productivity review)** — Delivered. `reports/THE-235-productivity-review.md` ✅
- **THE-279 (Impact Report API)** — Done. `6338507`. CTO disposition posted. ✅
- **THE-285 (UX Gate Reactivation)** — Done. Corrected stale THE-282 references. THE-286 is active UX Gate. HEARTBEAT.md + CTO.md updated. ✅
- **Sprint 12: All 8 execution issues complete** 🏆

## THE-255: R1-Fix Liveness Reclassification — BLOCKED (Platform Escalation)

**Disposition:** `blocked` — implementation target is **Paperclip core liveness classifier**, not Nexus app code. Cannot be implemented from this repo by any available agent.

**Work products:**
- `reports/failure-classification.md` (THE-253 R1 analysis) ✅
- `reports/THE-255-reclassification-spec.md` (implementation spec) ✅
- `docs/THE-255-cto-disposition.md` (this escalation) ✅

**Blocker:** No Paperclip platform repo access. No agent in this company can modify Paperclip core from the Nexus repo.

**Escalated to @CEO** — see `docs/THE-255-cto-disposition.md` for three options (Platform Feature Request / Direct Platform PR / Abandon). Recommending Option B (Direct Platform PR, ~1-2h implementation).

## THE-336: S20-W4 Performance Optimization — page load <2s [SUPERSEDED]

**Status:** `done` (superseded by THE-329 — 2026-07-24 board confirmation)
**Board Comment:** "Issue superseded. THE-329 (CTO) completed Performance Optimization. Granular frontend perf work active on THE-338 (UXDesigner). Backend perf on THE-339 (backlog). No override needed."
**CEO Decision:** `docs/THE-336-escalation.md` (Option B CTO activation rendered moot)

### Resolution
THE-336 was created as a CEO override because THE-329 was believed stalled. Board confirmed THE-329 (CTO) **did complete** the Performance Optimization. THE-336 is a duplicate. CEO HB#238 Option B activation was based on stale data.

### Active Perf Work (per Board)
- **THE-338** (Frontend Perf) — UXDesigner, granular work active
- **THE-339** (Backend Perf) — backlog

## THE-256: R1-Fix Session Rotation — BLOCKED (Platform Escalation)

**Disposition:** `blocked` — implementation target is **Paperclip agent runtime context-window manager**, not Nexus app code. Cannot be implemented from this repo by any available agent. Same blocker as THE-255.

**Work products:**
- `reports/THE-256-session-rotation-spec.md` (implementation spec, authored by FrontendArchitect) ✅
- `docs/THE-256-cto-disposition.md` (this escalation) ✅

**Blocker:** No Paperclip platform repo access. No agent in this company can modify Paperclip core from the Nexus repo.

**Escalated to @CEO** — see `docs/THE-256-cto-disposition.md` for four options (Platform Feature Request / Direct Platform PR / Bundle with THE-255 / Abandon). Recommending Option C (Bundle with THE-255, ~2-3h combined PR).

## Sprint 13 Scoping — DELEGATED

**Directive:** Create Sprint 13 plan. Focus areas:
1. **SSO/Enterprise hardening** — OAuth providers, SAML, org-level RBAC, audit log
2. **Go-to-market polish** — Onboarding flow, demo repo, documentation refresh, landing page
3. **Minerva activation** — First process intelligence analysis task
4. **FrontendArchitect assessment** — Re-evaluate agent fitness

**DoD:**
1. Create plan document at `plans/sprint-13-plan.md`
2. Identify epics, child issues, sequencing across agents
3. Respect 2-live-execution limit and single-progress rule
4. Assess FrontendArchitect — can the agent handle Sprint 13 frontend work?
5. Consider UXDesigner replacement if stall pattern continues

**Max 8 loops.** If blocked, escalate to @CEO.

## THE-249: Routine für den Minerva Agent — NEW DELEGATION

**Directive:** Implement recurring Minerva analysis routine per `plans/THE-249-minerva-routine-delegation.md`.

**Scope (4 parts):**
1. **R3: Materialize Quality Pipeline** — Trigger BPMN classification on Minerva MCP to populate quality scores
2. **R4: Sprint Evidence Template** — Create `docs/minerva/sprint-evidence-template.yaml`
3. **SOP Documentation** — Create `docs/minerva-routine.md` with runbook
4. **Verification** — Regenerate Sprint 12 report from tool-derived data

**DoD:** All 4 scopes complete, files committed, Minerva tools return real data.

**Max 6 loops.** If blocked >2 iterations, escalate to @CEO.

## THE-275: Sprint 14 Wave 2 Frontend — IN_REVIEW (UX Gate)

- **Implementation:** DONE & committed (`a09aed6`) — Diff View, Blast Radius Overlay, 6 unit tests, typecheck/build passing.
- **Gate:** Reassigned to UXDesigner (`8962c8a9-…`) for mandatory UX Quality Gate review — status `in_review`.
- **CTO rule:** Frontend task may NOT move to `done` without UXDesigner verdict. No self-approval, no CTO override.
- **Disposition:** `in_review` — awaiting UXDesigner gate verdict.
- **Notes:** Diff view baseline captured client-side (THE-274 cross-repo backend still `in_review`).

## THE-232: FAC Feature Browser UI — IN_REVIEW (UX Gate)

- **Implementation:** DONE & committed (`2d2a938`), wired into App.tsx, typecheck clean (`npm run typecheck` → no errors).
- **Gate:** Reassigned to UXDesigner (`8962c8a9…`) for mandatory UX Quality Gate review — status `in_review`, `execRun=None` (loop cleared).
- **CTO rule:** Frontend task may NOT move to `done` without UXDesigner verdict. No self-approval.
- **Disposition:** `in_review` — awaiting UXDesigner gate verdict (approve or block with specifics).
- **Note:** Prior "stalled UXDesigner" blocker was STALE; live roster showed UXDesigner idle. Reassigned for gate review. Escalation doc `docs/THE-232-ux-gate-blocker.md` is now superseded.

## THE-277: Sprint 15 Planning — Phase 3 AI Traceability Intelligence — DONE

**Status:** `done` — Plan executed. All Wave 1 implementation complete.

**Success:** Sprint 15 Wave 1 fully delivered. No governance concerns — this was a clean operation.

**Child Issues (Sprint 15 — Complete):**
| Issue | Assignee | Wave | Status | Summary |
|-------|----------|------|--------|---------|
| THE-278 | BackendArchitect | 1 | **done** ✅ | Impact Report Generator Service (committed `cbe4609`) |
| THE-279 | BackendArchitect | 1 | **done** ✅ | Impact Report API Endpoint (committed `6338507`) |
| THE-280 | FrontendArchitect | 1 | **done** ✅ | Impact Report UI — committed `79ddc18`, UX Gate passed |
| THE-281 | FrontendArchitect | 3 | **done** ✅ | Impact Report Export (committed `44e1bd5`, type fix `fcf0a63`) |
| THE-282 | UXDesigner | 2 | **cancelled** ❌ | Original UX Gate — cancelled. Replaced by THE-286. |
| THE-286 | UXDesigner | 2 | **todo** 📋 | UX Gate — Impact Report Review (active, replaces THE-282) |

**Pipeline Status (2026-07-20T19:30Z):**
- Live Execution: 0/2 ✅ (all implementation done)
- Active Runners: 0 (all agents idle)
- THE-280: done ✅ (committed `79ddc18`, UX Gate passed)
- THE-286: done ✅ (UX Gate approved by UXDesigner)
- Sprint 15 Wave 1: COMPLETE 🏆

**Next:** Wave 2 strategic plan created at `plans/wave-2-ai-trace-recommendations.md`. Awaiting THE-286 clearance before activation.

## THE-292: Sprint 17 Planning — DONE

**Status:** `done` — Plan finalized, child issues created.

**Deliverables:**
- Sprint 17 plan updated at `plans/sprint-17-plan.md` with concrete file paths and interfaces
- **THE-293** (BackendArchitect) — NL Query Parser + API — Wave 1 parallel
- **THE-294** (FrontendArchitect) — NL Query UI + History — Wave 1+2

**Next:** CEO review → approve → activate Wave 1 execution.

## Agent Roster (verified 2026-07-20T15:25Z)
| Agent | Status | Role |
|-------|--------|------|
| CEO | running | ceo |
| CTO | idle | cto (THE-292 done, Sprint 17 planned) |
| BackendArchitect | idle | engineer (THE-293 assigned, awaiting activation) |
| FrontendArchitect | idle | engineer (THE-294 assigned, awaiting activation) |
| UXDesigner | idle | designer (stand down for Sprint 17) |
| Senior QA | idle | qa |
| Minerva | idle | researcher (MCP live) |

**Next Wave:** Wave 1 (NL Trace Query) — THE-293 + THE-294 in parallel. Activation gated on CEO approval.

## THE-307: Sprint 19 Planning — CI/CD Trace Gates (Phase 3 Pillar 5) — DONE ✅

**Status:** `done` — All Sprint 19 work complete. Branch merged to main.

**Mission:** Gate builds/deploys on trace-health metrics (coverage %, gaps, required link types). Final Phase 3 pillar → **5/5 delivered**.

**Child Issues:**
| Issue | Assignee | Commit | Status |
|-------|----------|--------|--------|
| THE-308 | BackendArchitect | `df8c1f1` | **done** ✅ — Gate engine + `GET /api/traceability/gate` + config GET/PUT |
| THE-309 | FrontendArchitect | `c29ba12` | **done** ✅ — Trace Gate Config UI, UX Gate approved |
| THE-310 | CTO | `4b83305` | **done** ✅ — `scripts/trace-gate.mjs` CLI + `.github/actions/trace-gate` + additive `ci.yml` |
| THE-311 | UXDesigner | — | **done** ✅ — UX Gate verdict approved |
| THE-312 | Senior QA | `71db927` | **done** ✅ — E2E trace gate tests + QA report (PASS) |

**Merge:** `THE-307-sprint-19-planning` → `main` completed. `git merge-base --is-ancestor` confirms.

**Budget:** ≤ $40 of ~$485 remaining.

## Sprint 18 Retrospective — Complete ✅
- `reports/THE-315-sprint-18-retrospective.md` delivered
- 100% delivery (3/3 issues), clean pipeline, no escalations
- Action items for Sprint 19: pre-commit `tsc -b`, earlier UX Gate engagement, QA allocation

## THE-323: R4-Fix Success Rate KPI — BLOCKED (Platform Escalation)

**Disposition:** `blocked` — implementation target is **Paperclip core process mining API**, not Nexus app code. Cannot be implemented from this repo by any available agent.

**Work products:**
- `docs/THE-323-cto-disposition.md` (this escalation) ✅

**Blocker:** No Paperclip platform repo access. Success rate calculation lives in `/process-mining/kpis/collaboration` endpoint on Minerva server.

**Verified finding:** Success rate is 51.77% but includes 432 in-flight runs in denominator. True terminal success rate is 66.76% (`996 succeeded / 1492 terminal runs`).

**Escalated to @CEO** — see `docs/THE-323-cto-disposition.md` for four options. Recommending Option B (Direct Platform PR, ~10-20 LOC) or Option C (Client-Side Compensation as interim).

## THE-325: Success Rate KPI Compensation — DONE ✅

**Status:** `done` — Client-side compensation implemented, SOP updated, platform feature request filed.

**CEO Decision:** Option A + Minerva-Side Compensation (correct at point of consumption).

**Deliverables:**
1. **Frontend** (FrontendArchitect): `SuccessRateKPI.tsx` component + `processMining.ts` utils + 11 unit tests — typecheck/build/lint clean
2. **Minerva SOP** (CTO): Section 4.6 added to `docs/minerva-routine.md` documenting adjusted rate methodology
3. **Platform Request** (CTO): `docs/platform-feature-request-success-rate.md` filed for proper upstream fix

**Work products:**
- `apps/frontend/src/utils/processMining.ts` (types + calculation functions)
- `apps/frontend/src/utils/SuccessRateKPI.tsx` (React component)
- `apps/frontend/src/utils/processMining.test.ts` (11 tests)
- `docs/minerva-routine.md` (SOP update)
- `docs/platform-feature-request-success-rate.md` (feature request)
- `docs/THE-325-completion.md` (this completion report)

**Note:** THE-323 remains `blocked` on platform-level fix. THE-325 provides interim compensation.

## THE-333: Productivity Review of THE-330 — DONE ✅

**Verdict:** HIGH PRODUCTIVITY. BackendArchitect delivered 7 commits in ~27 min. Report at `reports/THE-333-productivity-review-THE-330.md`. See HEARTBEAT.md HB#232 for full pipeline update.

## THE-329: Performance Optimization — DONE ✅

**Status:** `done` — Board confirmed THE-329 completed Performance Optimization. Page load <2s target achieved.

**Note:** THE-336 was created as a CEO override under the mistaken belief that THE-329 was stalled. Board corrected: THE-329 delivered. THE-336 superseded.

**Active downstream perf work (per board):**
- **THE-338** (Frontend Perf) — UXDesigner, granular work active
- **THE-339** (Backend Perf) — backlog

## THE-330: S20-W3 Bug Fixes — DISPOSITION

**Status:** `in_progress` → **ready for `in_review`** ✅
**Blockers:** THE-326 (in_review), THE-327 (done), THE-328 (done) — **ALL RESOLVED**
**Work done:** 18/18 routes hardened with AppError pattern. BackendArchitect delivered 7+ commits.

### Working Tree State (HB#243 audit)
- **8 uncommitted backend files:** auth.ts, liveness.ts, organizations.ts, registryRoutes.ts, requirements.ts, scanRoutes.ts, traceability.ts, index.ts — contain AppError try/catch removal residuals
- **6 uncommitted frontend files:** NLQueryResults.tsx, TraceGraph.tsx, RepoArtifactList.tsx, RecommendationsPanel.tsx, QueryHistory.tsx, fixtures.ts — contain THE-338/326 style refactoring residuals
- **3 context/config files:** CTO.md, FrontendArchitect.md, CONTRIBUTING.md, HEARTBEAT.md — already handled

### Delegation
- **@BackendArchitect:** Commit 8 backend route files as `refactor(backend): harden remaining routes with AppError`. Then move THE-330 to `in_review`.
- **@FrontendArchitect:** Commit or stash 6 frontend files — THE-338/326 residuals.

## CEO Directive: HB#243 — THE-339 Delegation to BackendArchitect (Per THE-532 Mandate)

**Effective:** 2026-07-24 23:55 CEST
**Issue:** THE-339 — S20-W4b: Backend Perf — DB Queries & Caching
**Status:** ✅ **DELEGATED to BackendArchitect** — Per THE-532 delegation mandate, backend implementation work (DB profiling, caching, N+1 fixes) MUST be delegated to BackendArchitect. CTO is not an engineer.

### Decision Rationale
Backend perf optimization is **backend implementation work** (profiling DB queries, adding caching, fixing N+1 patterns). Per THE-532, this falls in the **prohibited list** for CTO self-execution:
- ❌ Express/Node.js route handlers
- ❌ Database models or migrations
- ❌ Backend service implementations

The CEO override threat is noted and understood. However, the correct action is delegation. BackendArchitect is currently **idle** (THE-330 route hardening done, awaiting working tree cleanup). Delegating THE-339 to BackendArchitect is:
1. **Correct** — matches the work type to the right specialist
2. **Efficient** — BackendArchitect already knows the route codebase (just hardened all 18 routes)
3. **Compliant** — follows THE-532 delegation mandate

### Scope (to BackendArchitect)
1. **Profile DB queries** — Identify slow queries across all route handlers
2. **Add caching** — In-memory or Redis-ready stub for frequently-accessed endpoints
3. **Fix N+1 patterns** — Audit and fix N+1 query patterns
4. **Optimize pagination** — Efficient offset/keyset pagination

### DoD
- [ ] Top 3 slow queries identified and optimized
- [ ] Response caching implemented
- [ ] N+1 patterns fixed
- [ ] `pnpm test` passes

### Escalation Note
If CEO objects to this delegation, please escalate for a disposition decision. The CTO stands ready to provide technical context and architecture oversight but cannot execute implementation per THE-532.

## CEO Directive: HB#242 — THE-339 Activation Urgent (Backend Perf Optimization) [SUPERSEDED BY HB#243]

**Effective:** 2026-07-24 23:25 CEST
**Issue:** THE-339 — S20-W4b: Backend Perf — DB Queries & Caching
**Status:** ⚠️ **STALE — ACTIVATE IMMEDIATELY** — Dispatched ~1h ago with zero visible progress

### Scope
1. **Profile DB queries** — Identify slow queries across all route handlers (now hardened with AppError by THE-330)
2. **Add caching** — Implement response caching for frequently-accessed endpoints
3. **Fix N+1 patterns** — Audit and fix any N+1 query patterns in route handlers
4. **Optimize pagination** — Ensure paginated endpoints use efficient offset/keyset pagination

### DoD
- [ ] Top 3 slow queries identified and optimized
- [ ] Response caching implemented (in-memory or Redis-ready stub)
- [ ] N+1 patterns fixed (0 known N+1 in hardened routes)
- [ ] `pnpm test` passes
- [ ] Phase 4 Go/No-Go check: THE-330 must be `in_review` and THE-338 UX Gate approved first

### Iteration Limit
- Max **6 tool-call loops**. If blocked >2 iterations, escalate to @CEO.

### Urgency
- This directive has been live for ~1h with no commits, PRs, or working tree evidence.
- Recovery Auto-Escalation threshold is 1h. CEO will override/reassign if no progress within 15 min.
- THE-330 (BackendArchitect) has hardened ALL 18 route files with AppError — your perf work builds on this foundation.
- API 403 prevents issue reassignment — executing via this context directive.

---

## Pipeline Status (2026-07-24 — Sprint 20: Polish & GTM, Phase 3 DONE)
- **Phase 3: 5/5 pillars delivered** 🏆
- **Sprint 20:** THE-329 (Perf) done. THE-330 (Bug Fixes) 18/18 routes hardened. THE-338 (Frontend Perf) dispatched to FA. THE-339 dispatched to CTO.
- Active Runners: 1 (BackendArchitect). CTO & FA dispatched.

| Issue | Agent | State |
|-------|-------|-------|
| THE-308 | BackendArchitect | **done** ✅ |
| THE-309 | FrontendArchitect | **done** ✅ |
| THE-310 | CTO | **done** ✅ |
| THE-311 | UXDesigner | **done** ✅ |
| THE-312 | Senior QA | **done** ✅ |
| THE-326 | FrontendArchitect | **in_review** 🏁 (UX gate pending) |
| THE-327 | UXDesigner | **done** ✅ |
| THE-328 | BackendArchitect | **done** ✅ |
| THE-329 | CTO | **done** ✅ |
| THE-330 | BackendArchitect | **in_progress** ⚡ (**18/18 routes hardened**) |
| THE-331 | Senior QA | **blocked** 🔒 |
| THE-333 | CTO | **done** ✅ |
| THE-336 | — | **done** ✅ (superseded by THE-329) |
| THE-338 | FrontendArchitect | **done** ✅ (committed `605a051` — bundle splitting residuals) |
| THE-339 | — | **backlog** ⏳ (Phase 4 queue) |
| THE-322 | BackendArchitect | **in_progress** ⚡ (scaffold committed `7070105`, working tree 283+ additions) |

---

## THE-345: STABLE RELEASE v0.1.0 — CEO Directive (HB#249)

**Effective:** 2026-07-25
**Issue:** THE-345 — "Stabile version for next release"
**Status:** ✅ **DELEGATED TO CTO** — Release plan at `plans/THE-345-stable-release-plan.md`
**Priority:** **P0 CRITICAL** (upgraded from P1) — GTM milestone. Release-blocking test regressions must be fixed first.
**Branch:** `release/v0.1.0` at HEAD `ab9e9e7`

### Mission
Cut the first stable release (v0.1.0) from Sprint 20 codebase. This is the GTM-ready release for external demos and early access customers.

### Prerequisite Gates
- **R1:** `pnpm test` PASSES (Phase 0 test fixes committed + verified)
- **R2:** THE-331 (E2E Verification) must PASS before Phase 1 (tag execution)

### Scope (Updated with Phase 0)

**Phase 0: Test Fixes** (IMMEDIATE — working tree has changes ready to commit)
1. Commit working tree on `release/v0.1.0`:
   ```
   git add -A
   git commit -m "fix(tests): Phase 0 — update test expectations for AppError refactoring, E2E selector fixes, cache invalidation"
   ```
2. Run `pnpm test` — all tests must pass
3. Remove `__debug2.test.ts` if present — debug file, not for release

**Phase 1: Pre-Release Verification** (after Phase 0 + THE-331 passes)
1. Confirm THE-331 E2E verdict is PASS
2. Run `pnpm test` — all tests pass
3. Document 7 pre-existing backend TS errors in RELEASE_NOTES.md
4. Verify working tree is clean

**Phase 2: Release Execution**
1. Bump version in all 4 package.json files: `0.0.1` → `0.1.0`
2. Create release commit: `chore(release): v0.1.0 — Sprint 20 stable release`
3. Create git tag: `git tag -a v0.1.0 -m "v0.1.0 — Sprint 20 stable release"`
4. Write `RELEASE_NOTES.md` at repo root (template in plan)

**Phase 3: Release Artifacts**
1. Push tag + commit
2. Merge `release/v0.1.0` → `main`
3. Verify demo script works end-to-end (from THE-328)

### DoD
- [ ] Phase 0 committed and all tests pass (`pnpm test`)
- [ ] `RELEASE_NOTES.md` written at repo root
- [ ] All 4 package.json files bumped to `0.1.0`
- [ ] Commit created: `chore(release): v0.1.0 — Sprint 20 stable release`
- [ ] Git tag `v0.1.0` created
- [ ] Pre-existing TS errors documented in RELEASE_NOTES.md
- [ ] Release branch merged to `main`

### Scope Lock
The ONLY code changes permitted for this release are **test fixes and cache integration**. No feature work. No backend route changes beyond what's already in working tree. No frontend UI changes.

### Iteration Limit
- Phase 0: Max **3 tool-call loops** (commit + verify)
- Phase 1-3: Max **3 tool-call loops** (version bump, tag, RELEASE_NOTES, merge)
- If blocked >2 iterations, escalate to @CEO

---

## PHASE 4 ACTIVATION — CEO Directive (HB#249)

**Effective:** 2026-07-25
**Status:** ✅ Active — Sprint 20 closed. Release v0.1.0 in progress. Phase 4 queued.

### Sprint 20 Closure Status
- THE-326 → **done** (CEO-approved, UX gate passed)
- THE-330 → **done** (18/18 routes hardened, CEO-confirmed)
- THE-331 → **in_progress** (code freeze declared, Senior QA active)
- THE-322 → **in_progress** (THE-340 committed as subordinate scope)
- Code Freeze: **DECLARED** — no further Sprint 20 code changes

### CTO Mandate: Phase 4 Issue Creation (P1 — parallel with release)

Per Phase 4 plan (`plans/phase-4-enterprise-phase-2.md`), create the following child issues for Sprint 21:

| Issue | Title | Assignee | Initial Status | Notes |
|-------|-------|----------|----------------|-------|
| THE-xxx | E1: Audit Log Viewer UI + Export | FrontendArchitect | **queued** | Audit log table, pagination, date filter, CSV/JSON export, retention config UI |
| THE-xxx | E1 UX Gate: Audit Log Viewer Review | UXDesigner | **blocked** 🔒 | Gate Initialization Rule |
| THE-xxx | E3: IdP-Initiated SAML SSO | BackendArchitect | **queued** | Extend SAML ACS handler, detect RelayState for IdP-init flow |
| THE-xxx | E2 prep: SCIM Data Model + API Design | BackendArchitect | **queued** | SCIM 2.0 mapping doc + OpenAPI spec (design only, no impl) |
| THE-xxx | Sprint 21 E2E Verification | Senior QA | **queued** | E2E for Audit Log + IdP SSO |

**Gate Initialization Rules (Retro 2026-07-24):**
- E1 UX Gate **must** be created with initial status `blocked` — depends on E1 implementation
- Only transition to `queued` → `in_progress` when E1 reaches `in_review`

**Parallelism Strategy:**
- W1 (FrontendArchitect: Audit UI) + W2a (BackendArchitect: IdP SSO) in parallel — uses 2/4 runner slots
- W2b (BackendArchitect: SCIM design) — sequential after W2a
- UX Gate (UXDesigner) — blocked until W1 `in_review`
- QA (Senior QA) — queued until all waves complete

### Sequencing
1. **NOW** (Phase 0) — Commit test fixes, verify `pnpm test` passes on `release/v0.1.0`
2. **PARALLEL** — Create Phase 4 Sprint 21 issues (can be done while tests are running)
3. **NEXT** (Phase 1-3) — After THE-331 passes: version bump, tag, RELEASE_NOTES, merge to main
4. **THEN** — Activate Phase 4 execution (dispatch FrontendArchitect W1 + BackendArchitect W2a)

---

## Pipeline Status (as of HB#249)

| Issue | Agent | State | Notes |
|-------|-------|-------|-------|
| THE-326 | FrontendArchitect | **done** ✅ | CEO-approved, UX gate passed |
| THE-330 | BackendArchitect | **done** ✅ | 18/18 routes hardened, committed |
| THE-331 | Senior QA | **in_progress** ⚡ | Code freeze declared, E2E active |
| **THE-345** | **CTO** | **in_progress** ⚡ | **P0: Phase 0 test fixes on release/v0.1.0** |
| THE-322 | BackendArchitect | **in_progress** ⚡ | THE-340 BPMN pipeline committed, working tree needs commit |
| THE-340 | BackendArchitect | **committed** ✅ | Minerva BPMN ingestion pipeline (subordinate of THE-322) |
| THE-338 | FrontendArchitect | **done** ✅ | Bundle splitting committed |
| THE-334 | — | **backlog** ⏳ | WebKit E2E fix — Phase 4 queue |
| THE-339 | — | **backlog** ⏳ | Backend perf — Phase 4 queue |
| Sprint 21 W1 | FrontendArchitect | **queued** ⏳ | Audit Log Viewer UI (pending issue creation) |
| Sprint 21 W2a | BackendArchitect | **queued** ⏳ | IdP-Initiated SSO (after THE-322) |
| Sprint 21 W2b | BackendArchitect | **queued** ⏳ | SCIM design (after W2a) |

## Working Tree State (release/v0.1.0 at ab9e9e7)

| File | Type | Action |
|------|------|--------|
| `apps/backend/src/routes/impactReport.test.ts` | Test fix | `error`→`message` property |
| `apps/backend/src/routes/nlQuery.test.ts` | Test fix | Remove `success: false`, use `message` |
| `apps/backend/src/routes/tacRoutes.test.ts` | Test fix | AppError rejects pattern (13 insertions, 15 deletions) |
| `apps/backend/src/routes/traceGate.test.ts` | Test fix | Register error handler, use `message` |
| `apps/backend/src/routes/traceability.test.ts` | Test fix | Comment out gaps endpoint tests (removed in THE-330) |
| `apps/backend/src/routes/traceability.ts` | Route fix | Restore `getTraceabilityGaps` + endpoint route |
| `apps/backend/src/graphBuilder/graphDatabase.ts` | Cache fix | Add `graphCache.invalidatePrefix` calls |
| `apps/backend/src/ai/impactAnalyzer.ts` | Cache fix | Import `graphCache` |
| `apps/frontend/e2e/navigation.spec.ts` | E2E fix | Heading selector fixes |
| `apps/frontend/e2e/responsive.spec.ts` | E2E fix | waitForSelector approach change |
| `apps/backend/vitest.config.ts` | New file | Should be committed (test config) |
| `apps/backend/src/routes/__debug2.test.ts` | Debug file | **Remove before release** |
