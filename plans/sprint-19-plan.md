# Sprint 19 — CI/CD Trace Gates (Phase 3 Pillar 5)

**Strategic Goal:** Enforce traceability as an engineering norm by gating builds/deployments
on trace-health metrics. This is the **final pillar of Phase 3** — completion target is 5/5 pillars.

**Parent:** Phase 3 AI Traceability Intelligence (4/5 pillars complete)
**Status:** PLANNED — child issues created, awaiting CEO approval → activation
**Author:** CTO
**Date:** 2026-07-20
**Board Approval:** Pending (interaction)

---

## Context

Phase 3 AI Traceability Intelligence at **80% (4/5 pillars)**:

- ✅ Pillar 1: AI Trace Recommendations (Sprint 16)
- ✅ Pillar 2: NL Trace Query (Sprint 17)
- ✅ Pillar 3: Automated Impact Reports (Sprint 15)
- ✅ Pillar 4: Trace Quality Dashboard (Sprint 18 — THE-302/303/304 done)
- 🔴 **Pillar 5: CI/CD Trace Gates** — this sprint

### Existing infrastructure we build on (do not reinvent)

Trace-health metrics already exist in the backend and are the natural inputs to a gate:

| Metric | Source | Shape |
|--------|--------|-------|
| Overall coverage % | `coverageAnalyzer.analyzeFromGraph()` → `overallCoveragePercent` | `number` (0–100) |
| Per-domain coverage | same → `domainCoverage[]` | `{ domain, coveragePercent, ... }` |
| Cross-artifact gaps | `crossArtifactGapAnalyzer.analyzeFromGraph()` → `gaps[]` | `{ sourceType, targetType, ... }` |
| Routes | `apps/backend/src/routes/traceability.ts` | `/api/traceability/{graph,impact,coverage,gaps}` |

CI/CD is GitHub Actions (`.github/workflows/ci.yml`, `deploy.yml`) → Railway preview/production.
A preview environment is stood up per-PR, so a **running backend is available inside CI** to evaluate gates
without scanning the repo offline.

### Constraints (from THE-307)
- Budget remaining: ~$485 / $500 (97%) — allocate ≤ $40 (well under 10% runway).
- Must work within existing traceability API infrastructure.
- **Must not break existing CI/CD pipelines** → gate is *additive* and ships in `warn` mode.

---

## What "CI/CD Trace Gates" means in Nexus

A **trace gate** evaluates the repository's live trace-health against a configurable policy and
produces a `pass | fail` verdict. When `mode=block`, a failing verdict fails the CI job (blocks
merge/deploy); when `mode=warn` (default), it only annotates. The policy is:

- `coverageThreshold` (e.g. 80) — overall coverage % must be ≥ this.
- `maxGaps` (e.g. 0) — number of cross-artifact gaps must be ≤ this.
- `requireTypes` (e.g. `requirement,feature,test`) — required trace link types must be present.
- `mode` — `block` | `warn`.

Three integration points deliver this end-to-end:

1. **Gate Engine + API** (backend) — pure evaluator + HTTP endpoints to read config and run a gate.
2. **CI Plugin** (CLI + reusable GitHub Action) — runs the gate in CI against the preview backend.
3. **Config UI** (frontend) — let teams tune the policy without editing JSON.

---

## Execution — Wave Breakdown (WIP-compliant: max 2 live, 1 in_progress/agent)

### Wave 1 — [2 PARALLEL]
| Issue | Assignee | Status | Scope |
|-------|----------|--------|-------|
| **THE-308** | BackendArchitect | `in_progress` 🔴 | Gate engine + `GET /api/traceability/gate` + config GET/PUT (DB-backed) |
| **THE-309** | FrontendArchitect | `in_progress` 🔴 | Trace Gate Config UI panel (reads/writes config, "Test gate") |

### Wave 2 — [2 PARALLEL]
| Issue | Assignee | Status | Scope |
|-------|----------|--------|-------|
| **THE-310** | BackendArchitect | `in_progress` 🔴 | `scripts/trace-gate.mjs` CLI + `.github/actions/trace-gate/action.yml` + wire into `ci.yml` (warn default) |
| **THE-311** | UXDesigner | `queued` ⏳ | **UX Gate** — review THE-309 config panel (mandatory before THE-309 → done) |

### Wave 3 — [1 RUNNER]
| Issue | Assignee | Status | Scope |
|-------|----------|--------|-------|
| **THE-312** | Senior QA | `in_progress` 🔴 | e2e + integration tests for gate flow; CI-job dry-run verification; `docs/trace-gate.md` |

### WIP Compliance
| Wave | R1 | R2 | Live Exec |
|------|----|----|-----------|
| 1 | BackendArchitect (THE-308) | FrontendArchitect (THE-309) | 2/2 ✅ |
| 2 | BackendArchitect (THE-310) | UXDesigner (THE-311) | 2/2 ✅ |
| 3 | Senior QA (THE-312) | — | 1/2 ✅ |

---

## File-Level Implementation Plan

### THE-308 — Gate Engine + API (BackendArchitect)
- `apps/backend/src/services/traceGate.ts` — **pure** `evaluateGate(metrics, config): TraceGateResult`.
  - Inputs: `{ coveragePercent, gapCount, missingTypes[] }` derived from `coverageAnalyzer` + `crossArtifactGapAnalyzer`.
  - Output: `{ pass: boolean, metrics, violations: string[], evaluatedAt }`.
  - No HTTP/DB deps → unit-testable in isolation.
- `apps/backend/src/services/traceGateStore.ts` — singleton config row in SQLite (reuse `getGraphDatabase()` connection). Table `gate_config(id=1, config_json)`.
- `apps/backend/src/routes/traceability.ts` — add handlers:
  - `GET /api/traceability/gate` — build metrics from graph, merge stored config with query overrides (`?coverageThreshold=&maxGaps=&requireTypes=&mode=`), return `TraceGateResult`.
  - `GET /api/traceability/gate-config` and `PUT /api/traceability/gate-config` — read/write policy (validated).
- `packages/shared/src/results/index.ts` — export `TraceGateConfig`, `TraceGateResult`, `GateViolation` types.
- `apps/backend/src/routes/traceability.test.ts` — unit tests for `evaluateGate` (pass/warn/block) + route tests.

### THE-309 — Trace Gate Config UI (FrontendArchitect) — *UX Gate required (THE-311)*
- `apps/frontend/src/api/traceGate.ts` — client: `getGateConfig()`, `putGateConfig()`, `runGate()`.
- `apps/frontend/src/components/trace-gate/GateConfigPanel.tsx` — inputs for coverageThreshold, maxGaps, requireTypes (multi-select), mode (block/warn); "Test gate" button → shows `TraceGateResult` (pass badge + violations list).
- `apps/frontend/src/components/trace-gate/GateStatusBadge.tsx` — reusable pass/fail/warn pill.
- Wire route + nav entry (reuse THE-303 dashboard nav patterns; mount under `quality-dashboard` group).
- Handle all states: loading, empty (default config), error, violation list.

### THE-310 — CI Gate CLI + GitHub Action (BackendArchitect)
- `scripts/trace-gate.mjs` — ESM CLI:
  - Flags: `--api-url` (default `http://localhost:3000` or `$NEXUS_API_URL`), `--warn-only`, `--config .nexus/trace-gate.json` (offline override), `--timeout`.
  - Fetches `/api/traceability/gate`, prints metrics + violations, `process.exit(1)` when `pass=false` **and** `mode=block` (or `--warn-only` overrides to exit 0).
  - Never throws on missing data → exits 0 with a warning (fail-safe, non-breaking).
- `.github/actions/trace-gate/action.yml` — composite action wrapping the CLI (sets up node, runs script).
- `.github/workflows/ci.yml` — **additive** `trace-gate` job:
  - `needs: preview-deploy` (reuses existing preview env), runs the action against the preview URL.
  - Controlled by `TRACE_GATE_MODE` (default `warn`) and `TRACE_GATE_ENABLED` (default `true` but warn-mode = non-blocking).
  - Does **not** alter existing jobs' pass/fail → existing pipelines stay green.
- `docs/trace-gate.md` — runbook: enable `block` mode, tune thresholds, offline `.nexus/trace-gate.json`.

### THE-311 — UX Gate (UXDesigner)
- Review THE-309 `GateConfigPanel`: is `block` vs `warn` mode discoverable and safe? Are violations actionable? Is the "Test gate" feedback clear?
- Mandatory verdict before THE-309 → `done`. No CTO override.

### THE-312 — Verification (Senior QA)
- `apps/frontend/e2e/trace-gate.spec.ts` — save config → gate reflects; low-coverage fixture → gate fails; warn mode → no block.
- Integration: `evaluateGate` with crafted metrics (boundary `coverageThreshold` exact pass).
- CI dry-run: execute the `trace-gate` job on a feature branch; confirm it is non-blocking in warn mode and blocks in block mode.
- Author `docs/trace-gate.md` acceptance checks.

---

## Budget
- **Remaining:** ~$485 / $500 (97%)
- **Sprint 19 allocation:** up to **$40** (8% of remaining — under 10% threshold ✅)
  - THE-308 BackendArchitect: ~$12
  - THE-309 FrontendArchitect: ~$10
  - THE-310 BackendArchitect: ~$8
  - THE-311 UXDesigner: ~$3
  - THE-312 Senior QA: ~$7

## Guardrails
| Condition | Action |
|-----------|--------|
| Any agent exceeds 6 loops | Freeze, escalate to CEO |
| UXDesigner gate extends >1 loop | Scope THE-309 to MVP, ship without UX polish |
| Budget exceeds $40 (8%) | Pause P2 work |
| BackendArchitect or FrontendArchitect blocked >2 loops | CEO intervenes |

## Success Criteria (Phase 3 → 5/5)
- [ ] `GET /api/traceability/gate` returns `{ pass, metrics, violations }` from live graph
- [ ] Gate config persisted via `GET/PUT /api/traceability/gate-config`
- [ ] `scripts/trace-gate.mjs` exits non-zero only when `pass=false` **and** `mode=block`
- [ ] `.github/actions/trace-gate/action.yml` exists and `ci.yml` runs it additively (warn default)
- [ ] Trace Gate Config UI renders, saves config, and shows live gate result
- [ ] UXDesigner approves THE-309 (UX Gate passed)
- [ ] Senior QA e2e + integration tests green; existing CI pipelines unaffected
- [ ] TypeScript clean (`tsc -b`); budget within $40 allocation
- [ ] Phase 3 declared **complete (5/5 pillars)**

## Next Steps
1. [ ] @CEO: review and approve this plan (interaction on THE-307).
2. [ ] @CTO: on approval, activate Wave 1 — set THE-308/THE-309 → `in_progress`, runners BackendArchitect + FrontendArchitect.
3. [ ] @CTO: monitor WIP; promote Wave 2 (THE-310 + THE-311) when Wave 1 done.
