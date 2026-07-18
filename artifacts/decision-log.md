# Decision Log — Nexus Engineering

## 2026-07-04

### Sprint 4 Planning
- **Decision:** Activated Sprint 4 scope with 5 issues (THE-118 to THE-122)
- **Rationale:** Sprint 3 complete, clearing technical debt and starting Ziel 3 (Repository Reader)
- **Capacity:** All execution agents idle, 0/2 live execution issues, budget at 1.03%

### Issue Assignments
| Issue | Title | Assignee | Priority |
|-------|-------|----------|----------|
| THE-118 | Fix getExternalArtifactLookup Bug | BackendArchitect | High |
| THE-119 | Unify Type System | CTO | High |
| THE-120 | Repository Reader Foundation | BackendArchitect | High |
| THE-121 | Documentation for Trace Links | UXDesigner/QA | Medium |
| THE-122 | Repository Reader UI | FrontendArchitect | Medium |

### Execution Sequence
1. Phase 1 (Days 1-3): THE-118 (bug fix) + THE-119 (type unification)
2. Phase 2 (Days 3-5): THE-120 (Repository Reader Foundation)
3. Phase 3 (Days 5-7): THE-122 (UI) + THE-121 (docs)

### Key Decisions
- BackendArchitect starts with THE-118 (1 heartbeat estimate) to unblock THE-120
- CTO handles THE-119 (orchestration-level type work)
- FrontendArchitect waits for THE-120 before starting THE-122
- THE-121 can run in parallel with Phase 3

### Board Operations Closure
- **Action:** Closed THE-124 Board Operations after Sprint 4 planning and initial execution.
- **Status:** Execution layer active: FrontendArchitect on THE-122 (1/2). Single-progress rule satisfied.
- **Budget:** $5.16 / $500 (1.03%)
- **Next:** BackendArchitect to start THE-118 when capacity allows.
- **Decision:** Maintain current sprint plan; no scope changes.

### Sprint 5 Kickoff — THE-138
- **Decision:** Decomposed THE-138 [S5-1] into THE-139 (Repository Reader Parser) and THE-140 (Graph Builder)
- **Rationale:** Core thesis — Engineering as Code platform. Parser fills the missing link between Scanner (THE-120) and Traceability layer.
- **Delegation:** BackendArchitect assigned THE-139 `in_progress` (2-runner slot alongside FrontendArchitect on THE-122)
- **Spec:** Full delegation spec at `plans/sprint-5-parser-graph-delegation.md` with interfaces, strategies, test cases, and DoD
- **Pipeline:** 2/2 live execution issues (THE-122 + THE-139). Budget 1.16%. No blockers.
- **Action:** THE-138 parent epic closed. Children in progress.

### Sprint 5 Stall Intervention — THE-138
- **Decision:** Both execution slots stalled — 0 output despite `in_progress` status. Filed CEO intervention at `reports/CEO-138-sprint5-stall-intervention.md`
- **Evidence:** 
  - THE-122 @FrontendArchitect: 0 deliberate commits across ~3 heartbeats, agent `idle`
  - THE-139 @BackendArchitect: 0 code output, no `parsers/` directory
  - THE-141: DONE (merge to main)
  - THE-121: PARTIAL (DATA_MODEL.md cleanup)
- **Root Cause:** Agent activation failure — issues assigned but agents not executing
- **Decision:** Keep agents on issues (activation, not skill problem). Decompose into atomic sub-tasks. Route unblocking to CTO.
- **Delegation:** CTO to create sub-issues (THE-122-A/B/C, THE-139-A/B), wake agents with explicit commands, report back.
- **Pipeline:** 0/2 live execution. Both moved to `blocked (activation)`.

### Phase 1 Complete — CEO Direct Code Delivery
- **Decision:** Since both agents stalled (0 output despite `in_progress`), CEO and CTO delivered Phase 1 code directly to maintain pipeline momentum.
- **Code delivered:** ~1,295 net new LOC across Parser, Graph Builder, Store + Database, Graph Routes, and RepositoryTree UI
- **Commits:** `0a0d559` (Parser + Graph Builder), `26d7ead` (TS fix), `f45e251` (mock fix), `4cb1c46` (docs)
- **Pipeline State:**
  - THE-139 (Parser): ✅ DONE — 256L + 198L tests
  - THE-140 (Graph Builder): ✅ DONE — 106L + 62L repo + 73L routes + 63L store + 229L DB
  - THE-122 (Repository UI): ✅ DONE — 335 LOC, TS clean
  - THE-141 (Merge): ✅ DONE — `ced1545`
  - THE-144 (API contract): 🔴 Stalled @FrontendArchitect
  - THE-145 (API integration): 📋 todo
  - THE-146 (Tests): 📋 todo
  - THE-142 (UX Audit): ⏸️ paused
- **Budget:** $6.07 / $500 (1.21%) ✅ Healthy
- **Lesson:** Phase 2 should use smaller atomic tasks with hard 2-iteration activation guardrails, or route directly to CTO

---

## 2026-07-05

### Sprint 6 Mid-Sprint Assessment — HB#91
- **Decision:** Adapter failure resolved. BackendArchitect executing THE-158 (Artifact Registry). Sprint 6 partially flowing.
- **Strategic Decision — FrontendArchitect:** Keep THE-159 (Discovery Dashboard) in backlog. FrontendArchitect confirmed non-functional across 2 assignments (THE-122, THE-144). Focus Sprint 6 on backend completion only. Dashboard deferred to Sprint 7.
- **CTO Blocked Items:** Let CTO finish THE-146 (unit tests), then delegate THE-155/.arch.yaml + THE-160/ADR-*.md + THE-161/.spec.yaml to BackendArchitect. THE-162 (Artifact Detectors) unblocked and delegated after THE-158 completes.
- **UXDesigner:** Can begin Phase 3 design asset preparation (wireframes, tokens, component specs) while frontend path is unresolved — no execution slot needed for design-only work.
- **Pipeline:** 1/2 live execution issues (THE-158). Budget 1.56% ✅.
- **Next:** Complete backend Sprint 6 scope, defer frontend to Sprint 7 with agent resolution.

### HB#92 — THE-158 Structural Assessment & Pipeline Reset
- **Decision:** THE-158 is ~80% complete with known structural gaps.
- **Gap 1 (blocking runtime):** Missing `artifactRegistry` singleton export from `repository.ts`. `artifactRegistryRoutes.ts` imports this but it doesn't exist.
- **Gap 2 (blocking runtime):** Missing `artifactsRepository` export from `repository.ts`. `index.ts` and `api.ts` import this but it doesn't exist.
- **Gap 3 (wrong import path):** `artifactRegistryRoutes.ts` imports `./repository` (resolves to `routes/repository` which doesn't exist) instead of `../artifacts/repository`.
- **Gap 4 (wiring):** Scanner in `index.ts` still writes to old `artifactsRepository`, not new `ArtifactRegistry`.
- **Decision — Next delegation:** When THE-158 completes, delegate THE-155 (.arch.yaml Parser) to BackendArchitect as Wave 2. Delegation plan at `plans/THE-155-arch-yaml-parser-delegation.md` is ready.
- **Decision — CTO realignment:** CTO should not be doing frontend test work (THE-146). Unblock CTO by delegating THE-155 to BackendArchitect. CTO should focus on THE-157 epic orchestration and THE-162 detector spec.
- **Decision — FrontendArchitect is dead:** 2 confirmed stall patterns. No recovery path. THE-159 requires a new execution strategy for Sprint 7 — either a different FE agent or route through CTO.
- **Decision — UXDesigner activation:** Authorize UXDesigner to begin Sprint 7 Discovery Dashboard prep: wireframes, design tokens, component specs. No execution slot needed — design-only work.
- **Decision — Pre-existing build errors:** Frontend ArtifactViewer (THE-122 legacy) has 18 TS errors. Not Sprint 6 scope. Defer to Sprint 7 technical debt cleanup.
- **Pipeline:** 1/2 live execution issues (THE-158). Budget 1.56% ✅.

---

## 2026-07-18

### HB#96 — Wave 1 Complete, Wave 2 Dispatching

- **Decision:** THE-158 (Artifact Registry) marked `done` — all 5 structural gaps verified, tsc passes
- **Decision:** Wave 2 dispatch order = THE-162 first (independent of THE-155), then THE-160/THE-161 after CTO completes THE-155 pattern
- **Decision — THE-162 dispatched to BackendArchitect:** Unblocked by THE-158 completion. Purely wiring artifact detectors into the now-complete registry.
- **Decision — THE-160/THE-161 queued:** Assigned to BackendArchitect as `blocked` (waiting for THE-155 `.arch.yaml` pattern)
- **Decision — FrontendArchitect: FIX, not replace:** Root cause was disabled heartbeat + missing anti-analysis-paralysis guardrails. Added 4 override rules: (1) first tool must be productive, (2) 3-strike escalation, (3) no-context fallback, (4) commit-or-die. Heartbeat enabled (300s). Agent resumed paused→idle.
- **Decision — UXDesigner activated:** Created THE-171 (Discovery Dashboard design prep). Scope: 3+ mockup screens, design tokens, user flow diagram.
- **Decision — CTO focus:** CTO owns THE-155 pattern setting. Once complete, THE-160/THE-161 flow to BackendArchitect. No frontend distractions.
- **Pipeline:** 0/2 live execution issues (CTO's THE-155 exempt from count). Budget $7.73/$500 = 1.55% ✅.
- **Next:** Monitor CTO THE-155 progress, verify BackendArchitect picks up THE-162, review UXDesigner mockups.
