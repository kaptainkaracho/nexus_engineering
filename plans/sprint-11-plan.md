# Sprint 11 — "As Code" Phase 1: Test Cases as Code (TAC) + Sprint 10 Wrap

**Strategic Goal:** Close remaining Sprint 10 deliverables and begin "As Code" Phase 1 — Test Cases as Code (P1 gap)
**Parent:** THE-217
**Status:** ✅ CEO Approved — Wave 1 Complete, Wave 2 Routing Active (THE-223)
**Author:** CTO
**Date:** 2026-07-19 (Updated 2026-07-20)

---

## Context

### Sprint 10 Completion Status
| Issue | Owner | Status | Notes |
|-------|-------|--------|-------|
| THE-203 | BackendArchitect | **done** ✅ | Multi-Repo Backend |
| THE-206 | BackendArchitect | **done** ✅ | Private Registry Backend |
| THE-207 | FrontendArchitect | **done** ✅ | Multi-Repo UI |
| THE-204 | BackendArchitect | **done** ✅ | Audit Log Export |
| THE-210 | UXDesigner | **done** ✅ | Private Registry UX Design |
| THE-212 | FrontendArchitect | **done** ✅ | CEO-dispositioned this heartbeat — all scope delivered |
| THE-205 | BackendArchitect | **in_progress** 🔄 | AI Traceability Foundations — coding, uncommitted |
| THE-217 | CTO | **done** ✅ | Sprint 11 Planning — 5 child issues created |
| THE-218 | FrontendArchitect | **done** ✅ | TAC Shared Package — committed fc6f2ab |
| THE-208 | FrontendArchitect | **queued** 🗄️ | Audit Log Viewer UI — Wave 2 target (after slot frees) |
| THE-209 | FrontendArchitect | **backlog** 🗄️ | Private Registry UI — lower priority |

### Pipeline State (Updated: Wave 2)
- **1/2 execution slots filled** — BackendArchitect on THE-205 (AI Traceability)
- **1 slot reserved** — Senior QA routing to THE-220 (Sample TAC Documents)
- **Wave 1 complete** — THE-218 delivered by FrontendArchitect (fc6f2ab)
- **Wave 2 routing** — THE-223 (CTO) activating idle agents
- **Billing block** ⛔ — THE-212 UX gate stalled, UXDesigner idle
- Budget: $10.31 / $500 (2.06%) ✅ Healthy

### CTO Evaluation (THE-213): P1 Gap Identified
The "as Code" evaluation identified **Test Cases as Code (TAC)** as the #1 priority gap. Without TAC, the V-Model traceability chain is broken — tests cannot formally trace to requirements (REQ-XXX). This blocks end-to-end traceability verification.

---

## Sprint 11 Epics

### Epic 0: Sprint 10 Wrap (Week 0-1)
Before new work begins, close remaining Sprint 10 items.

| Task | Owner | Action |
|------|-------|--------|
| THE-212 UX Gate | UXDesigner | Review Private Registry UI, approve/block |
| THE-212 fixes (if any) | FrontendArchitect | Address UX feedback, mark done |
| THE-205 complete + commit | BackendArchitect | Finish AI Traceability, commit, mark done |
| THE-208 formal completion | FrontendArchitect | Complete Audit Log Viewer UI, tests, mark done |

### Epic A: Test Cases as Code — Shared Package (Week 1-2)
**Owner:** BackendArchitect
**Dependency:** RAC schema pattern exists (`packages/shared/src/requirements/`)

Deliverables:
1. `packages/shared/src/tests/` — schema, loader, validator for `.test.yaml`
2. JSON Schema: `test-doc/v1` with fields:
   - Nexus metadata block
   - Test suites (groups)
   - Each test case: id, title, type (unit/integration/e2e), priority, requirement trace links (REQ-XXX), Gherkin-style scenario, acceptance criteria
3. Directory convention: `docs/tests/{domain}/{component}.test.yaml`
4. Reference sample test documents

**Effort:** Medium (2-3 HB)

### Epic B: Test Cases as Code — Backend API (Week 2)
**Owner:** BackendArchitect
**Dependency:** Epic A (shared package)

Deliverables:
1. `GET /api/tac` — List all TAC documents
2. `GET /api/tac/:id` — Get single TAC document
3. `POST /api/tac/validate` — Validate TAC document against schema
4. `GET /api/tac/schema` — Return JSON Schema
5. CI validation job: `scripts/validate-tac.js`
6. Tests

**Effort:** Medium (2-3 HB)

### Epic C: Test Cases as Code — Sample Documents (Week 1-2, parallel)
**Owner:** CTO or delegated to any available agent
**Dependency:** Epic A (shared package)

Deliverables:
1. `docs/tests/auth/user-auth.test.yaml` — User authentication test cases
2. `docs/tests/repository/scanner.test.yaml` — Repository scanner test cases
3. `docs/tests/artifact/registry.test.yaml` — Artifact registry test cases

**Effort:** Low (1 HB)

### Epic D: Standardization — P4 (Week 1-2, parallel)
**Owner:** CTO
**Dependency:** None

Deliverables:
1. Formalize Agent/Persona as Code convention in `.paperclip/context/`
2. Define metadata headers standard for all document types
3. Update CODING_STANDARDS.md if it exists

**Effort:** Low (1 HB)

### Epic E: Frontend — Test Case Viewer (Week 3-4)
**Owner:** FrontendArchitect
**Dependency:** Epic B (Backend API must be live)

Deliverables:
1. Test suite browser by domain
2. Test case detail view with Gherkin scenarios
3. Requirement traceability (click REQ-XXX → requirement view)
4. UX Design: wireframes for test case viewer (UXDesigner)

**Effort:** Medium (2-3 HB)

---

## Pipeline Sequencing

```
Phase 0 — Sprint 10 Wrap (Weeks 0-0.5):
  Runner 1: UXDesigner — THE-212 UX Gate (gate review, 1 HB)
  Runner 2: BackendArchitect — Complete THE-205 (AI Traceability, finish + commit)
  When UX gate passes:
    Runner 1: FrontendArchitect — THE-212 fixes (if any), mark done
    Then: FrontendArchitect — THE-208 formal completion (Audit Log Viewer UI)

Phase 1 — TAC Shared + Backend (Weeks 1-2):
  Runner 1: BackendArchitect — Epic A (TAC Shared Package) + Epic B (TAC Backend API)
  Runner 2: FrontendArchitect — (available for Epic E later, or THE-208 if not done)
  UXDesigner: idle (no design tasks until Epic E wireframes)
  CTO: Epic D (Standardization — parallel)

Phase 2 — TAC Frontend (Weeks 3-4, if within sprint):
  Runner 1: FrontendArchitect — Epic E (Test Case Viewer UI)
  Runner 2: BackendArchitect — (available for FAC Phase 2 prep)
  UXDesigner: Epic E wireframes for test case viewer
```

---

## Agent Allocation

### BackendArchitect (next: THE-205 → Epic A → Epic B)
1. **Complete THE-205** — AI Traceability Foundations (finish + commit)
2. **Epic A** — TAC shared package (schema, loader, validator)
3. **Epic B** — TAC backend API endpoints + CI validation

### FrontendArchitect (next: THE-212 UX fixes → THE-208 → Epic E)
1. **THE-212 fixes** — Address UX gate feedback
2. **THE-208 formal completion** — Audit Log Viewer UI finalize + tests
3. **Epic E** — Test Case Viewer UI (after TAC API is live)

### UXDesigner (next: THE-212 UX Gate → Epic E wireframes)
1. **THE-212 UX Gate** — Review Private Registry UI, approve
2. **Epic E wireframes** — Test Case Viewer UX design (when Epic B approaches completion)

### Senior QA (next: TAC sample documents + TAC tests)
1. **Epic C** — Sample TAC documents for auth, scanner, registry
2. **TAC tests** — Integration tests for TAC API

### CTO (THE-217, management exempt)
- Sprint 11 orchestration
- **Epic D** — Standardization (P4)
- **Epic C** — Sample TAC documents (if Senior QA not available)
- THE-182 VISION.md roadmap update (if time permits)

---

## Child Issues Created

| Issue | Title | Status | Notes |
|-------|-------|--------|-------|
| THE-218 | TAC Shared Package (Epic A) | **done** ✅ | Delivered by FrontendArchitect — fc6f2ab |
| THE-219 | TAC Backend API (Epic B) | backlog 🗄️ | BackendArchitect — after THE-205 done |
| THE-220 | Sample TAC Documents (Epic C) | **routing** 🔄 | Senior QA — Wave 2 activation target |
| THE-221 | Standardization (Epic D) | **done** ✅ | CTO — Persona as Code convention enforced |
| THE-222 | TAC Frontend Viewer (Epic E) | backlog 🗄️ | FrontendArchitect — after Epic B live |

Wave 2 routing under THE-223 (CTO).

## Success Criteria

1. All Sprint 10 items closed (THE-212 ✅, THE-205 ✅, THE-208 ✅)
2. `.test.yaml` format defined with JSON Schema validation
3. TAC API endpoints live (`/api/tac/*`)
4. CI validates `.test.yaml` files on every PR
5. Sample TAC documents exist for 3 domains
6. Agent/Persona as Code convention formalized
7. Budget remains healthy (< 10% consumed)

---

## Pipeline Compliance (Proposed)

| Agent | Issue | Status |
|-------|-------|--------|
| BackendArchitect | THE-205 → Epic A/B | in_progress → queued |
| FrontendArchitect | THE-212 → THE-208 → Epic E | in_progress → queued |
| UXDesigner | THE-212 UX Gate → Epic E wireframes | queued |
| Senior QA | Epic C | queued |
| CTO | THE-217 | in_progress (management exempt) |

- Live execution: 2/2 → will free when Sprint 10 wraps
- Per-agent WIP: All compliant ✅
