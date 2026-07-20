# "As Code" Documentation Artifacts — Evaluation & Plan

**Issue:** THE-213 (Parent: THE-211)
**Author:** CTO
**Date:** 2026-07-19
**Status:** Proposed

---

## 1. Executive Summary

| Artifact Type | Format Established? | In Use? | Status |
|---|---|---|---|
| Requirements | ✅ Yes (`.req.yaml`, JSON Schema) | ✅ Yes | **Mature** |
| Functions/Features | ❌ No | ❌ No | **Gap** |
| Software Architecture (ADRs) | ✅ Yes (Markdown ADRs) | ✅ Yes (2 ADRs) | **Adopted** |
| Configuration | ✅ Yes (files as code) | ✅ Yes | **Mature** |
| Tests | ⚠️ Partial (code, no spec format) | ⚠️ Partial | **Gap** |
| Test Execution Results | ❌ No | ❌ No | **Gap** |
| Other (OpenAPI, CI/CD, Agents) | ✅ Yes (various) | ✅ Yes | **Adopted** |

**Verdict:** 3 of 7 artifact types are fully established. 3 have clear gaps. 1 is partially adopted.

---

## 2. Per-Artifact Evaluation

### 2.1 Requirements (`.req.yaml`)

**Status:** ✅ ESTABLISHED — Mature

**Evidence:**
- **RFC-001** (`docs/RFC-001-requirements-as-code.md`) defines the format
- **ADR-001** (accepted) formalizes Requirements as Code (RAC) as Tier 1
- JSON Schema at `packages/shared/src/requirements/schema.ts` (92 lines, `req-doc/v1`)
- Sample file: `docs/requirements/auth/user-auth.req.yaml` (105 lines, 5 requirements with trace links, acceptance criteria)
- CI validation job: `scripts/validate-requirements.js` runs on every PR
- API endpoints exist: `GET /api/rac`, `GET /api/rac/:id`, `POST /api/rac/validate`, `GET /api/rac/schema`
- Templates at `docs/requirements/templates/`

**Adoption:** Format is fully defined, validated, and in active use. No gap.

### 2.2 Functions/Features

**Status:** ❌ GAP — Not established

**Evidence:**
- No YAML/Spec format, naming convention, or directory convention exists
- No schema definitions found for feature/function specifications
- No API endpoints for feature/function documents
- No CI validation for feature/function specs

**Gap:** Full gap. No format, tooling, or convention exists for capturing feature/function specifications as code.

### 2.3 Software Architecture (ADRs)

**Status:** ✅ ESTABLISHED — Adopted

**Evidence:**
- **ADR-002** (accepted) formalizes Architecture as Code (AAC) as Tier 2
- ADR template at `docs/architecture/adr/templates/adr-template.md`
- 2 accepted ADRs exist: `adr-001-requirements-as-code.md`, `adr-002-architecture-as-code.md`
- CI validation job: `scripts/validate-adrs.js`
- API endpoints: `GET /api/aac`, `GET /api/aac/:id`, `POST /api/aac/validate`, `GET /api/aac/template`
- Required structure: Context, Decision, Consequences + metadata block
- Rule: every ADR links to the triggering Paperclip issue

**Adoption:** Format is defined and validated. Current format is Markdown (deliberately human-readable per ADR-002). At 2 ADRs, adoption is early but the mechanism is solid.

### 2.4 Configuration

**Status:** ✅ ESTABLISHED — Mature

**Evidence:**
- `.env.example` — environment variable schema
- `railway.toml` — deployment infrastructure config
- `nixpacks.toml` — native build toolchain config
- `.github/workflows/*.yml` — CI/CD as code (4 workflow files)
- `pnpm-workspace.yaml` — monorepo config
- `tsconfig.json` — TypeScript compiler config
- `.npmrc` — package manager config

**Adoption:** Infrastructure as Code (IaC) is standard practice. Configuration is managed as code with conventional formats. No gap.

### 2.5 Tests

**Status:** ⚠️ PARTIAL — Gap exists

**Evidence:**
- Tests are written as code (TypeScript via Vitest, Playwright for E2E)
- CI runs: `vitest run`, `playwright test`
- **BUT:** No structured "test case as code" format (e.g., `.test.yaml` or Gherkin `.feature` files)
- No formal test specification that maps to requirements (traceability from test case to REQ-XXX)
- No schema or validation for test case definitions

**Gap:** The test *code* exists, but the test *specification* as a traceable, structured artifact format does not.

### 2.6 Test Execution Results

**Status:** ❌ GAP — Not established

**Evidence:**
- No structured format for test execution results/reports
- No schema or API for storing/retrieving test results as code
- CI generates JUnit-style XML reports but they are not treated as engineering artifacts
- No version-controlled test execution history

**Gap:** Full gap. No format, tooling, or API exists for test execution results as code.

### 2.7 Other Engineering Data

**Status:** ✅ ESTABLISHED — Partial coverage

**Evidence:**
- **OpenAPI Spec:** `docs/api/repository-reader-api.yaml` — API contract as code
- **Agent/Persona as Code:** `SOUL.md` (CEO), `.paperclip/context/CTO.md`, `.paperclip/context/FrontendArchitect.md`
- **Decision Log:** `artifacts/decision-log.md`
- **Data Model:** `docs/DATA_MODEL.md` — structured as TypeScript interfaces
- **C4 Diagrams:** `docs/architecture/diagrams/` — diagrams as code (Mermaid)

**Adoption:** Various "as code" formats exist organically. No unified convention or schema for these. Each emerged as needed.

---

## 3. Gap Analysis (Prioritized)

| Priority | Artifact Type | Gap Severity | Rationale |
|---|---|---|---|
| **P1** | Test Cases (2.5) | High | Breaking V-Model linkage: tests cannot trace to requirements. Blocks end-to-end traceability. |
| **P2** | Functions/Features (2.2) | High | No spec format means "what we're building" has no structured definition. Core to V-Model. |
| **P3** | Test Execution Results (2.6) | Medium | Needed for V-Model verification phase. Lower priority than test case definitions. |
| **P4** | Other Engineering Data (2.7) | Low | Existing formats work. Could benefit from standardization but not blocking. |

---

## 4. Implementation Plan

### 4.1 P1: Test Cases as Code (TAC)

**Format Specification:**
- File extension: `.test.yaml`
- Schema: `test-doc/v1`
- Location: `docs/tests/{domain}/{component}.test.yaml`
- Structure:
  - Nexus metadata block (schema, domain, version, source)
  - Test suites: groups of related test cases
  - Each test case: id, title, type (unit/integration/e2e), priority, requirement trace links (REQ-XXX), Gherkin-style scenario, acceptance criteria
- Validation: JSON Schema validation on CI

**Repository Convention:**
- `docs/tests/` — root directory
- Subdirectories by domain (e.g., `auth/`, `repository/`, `artifact/`)
- Mirror the `docs/requirements/` directory structure for easy traceability

**Loader/Parser:**
- Reuse existing RAC parsing pattern (`packages/shared/src/requirements/`)
- Create `packages/shared/src/tests/` with schema, loader, validator
- Backend: extend Fastify with `GET /api/tac`, `GET /api/tac/:id`, `POST /api/tac/validate`

**API Exposure:**
- `GET /api/tac` — List all TAC documents
- `GET /api/tac/:id` — Get single TAC document
- `POST /api/tac/validate` — Validate TAC document against schema
- `GET /api/tac/schema` — Return JSON schema

**Priority:** P1 — **Effort:** Medium (3-5 days)

### 4.2 P2: Functions/Features as Code (FAC)

**Format Specification:**
- File extension: `.feature.yaml`
- Schema: `feature-doc/v1`
- Location: `docs/features/{domain}/{feature-name}.feature.yaml`
- Structure:
  - Nexus metadata block
  - Feature description, owner, status
  - User stories or functional specifications
  - Acceptance criteria
  - Requirement trace links (REQ-XXX)
  - Dependencies on other features
- Validation: JSON Schema validation on CI

**Repository Convention:**
- `docs/features/` — root directory
- Subdirectories by domain
- One file per feature/epic

**Loader/Parser:**
- Create `packages/shared/src/features/` with schema, loader, validator
- Backend: `GET /api/fac`, `GET /api/fac/:id`, `POST /api/fac/validate`

**Priority:** P2 — **Effort:** Medium (3-5 days)

### 4.3 P3: Test Execution Results as Code (TER)

**Format Specification:**
- File extension: `.results.yaml`
- Schema: `results-doc/v1`
- Location: `docs/results/{domain}/{run-timestamp}.results.yaml`
- Structure:
  - Run metadata (timestamp, trigger, environment, commit SHA)
  - Summary (total, passed, failed, skipped, duration)
  - Per-test results: test id reference, status, duration, error details
  - Coverage data (line, branch, function coverage)
- Auto-generated by CI, not manually authored

**Repository Convention:**
- `docs/results/` — root directory
- One file per CI run
- May also be stored as CI artifacts rather than committed

**Loader/Parser:**
- Create `packages/shared/src/results/` with schema and loader
- Backend: `GET /api/results`, `GET /api/results/:id`, `GET /api/results/latest`

**Priority:** P3 — **Effort:** Medium (2-4 days)

### 4.4 P4: Other Engineering Data Standardization

**Actions:**
- Formalize Agent/Persona as Code convention (`.agent.md` files in `.paperclip/context/`)
- Define metadata headers standard for all document types (matching the `nexus` block pattern)
- Add this to CODING_STANDARDS.md

**Priority:** P4 — **Effort:** Low (1 day)

---

## 5. V-Model Alignment

| V-Model Phase | Artifact Type | "As Code" Format | Status |
|---|---|---|---|
| **Requirements Analysis** | Requirements | `.req.yaml` (RAC) | ✅ Established |
| | Functions/Features | `.feature.yaml` (FAC) | ❌ Gap — P2 |
| **System Design** | Software Architecture | `adr-*.md` (AAC) | ✅ Established |
| | C4 Diagrams | `.mmd` (Mermaid) | ✅ Established |
| **Component Design** | API Contracts | `openapi.yaml` | ✅ Established |
| | Data Model | TypeScript interfaces (`DATA_MODEL.md`) | ✅ Established |
| **Implementation** | Application Code | `.ts`, `.tsx` | ✅ Established |
| | Configuration | `.toml`, `.yaml`, `.json` | ✅ Established |
| **Test (Component)** | Test Cases | `.test.yaml` (TAC) | ❌ Gap — P1 |
| **Test (Integration)** | Test Execution Results | `.results.yaml` (TER) | ❌ Gap — P3 |
| **Acceptance** | Requirements Verification | Trace links from tests to REQ | ❌ Gap — P1 blocks this |

The V-Model reveals that the **test-to-requirements traceability chain is broken** — this is the most critical gap. Without test cases as code (TAC) with requirement trace links, we cannot verify that requirements are met.

---

## 6. Frontend Visualization Requirements

For each artifact type, the frontend requires:

### 6.1 Requirements Viewer
- ✅ Partially implemented (RAC API exists)
- Needs: Requirement detail view with trace link navigation
- Needs: Visual status indicators (proposed → approved → implemented → verified)
- Needs: Filter by domain, priority, status

### 6.2 Feature/Function Viewer
- **New:** Feature list with status, owner, priority
- **New:** Feature detail with user stories, acceptance criteria
- **New:** Trace link navigation to requirements

### 6.3 Architecture Viewer
- ✅ Partially implemented (AAC API exists)
- Needs: ADR timeline/history view
- Needs: ADR relationship graph (which ADRs reference each other)

### 6.4 Test Case Viewer
- **New:** Test suite browser by domain
- **New:** Test case detail with Gherkin scenarios
- **New:** Requirement traceability (click REQ-XXX → requirement)

### 6.5 Test Results Dashboard
- **New:** CI run history with pass/fail trends
- **New:** Per-test result detail with logs
- **New:** Coverage over time chart

### 6.6 Global Traceability Graph
- **New:** Unified graph view showing links between all artifact types
- Requirements ↔ Features ↔ ADRs ↔ Test Cases ↔ Test Results
- Filter by domain, status, type
- Click-to-navigate between linked artifacts

### 6.7 Unified Design Language
All artifact viewers should share:
- Consistent `nexus` metadata header display
- Common trace link visualization component
- Consistent status badge component (proposed/approved/rejected/implemented/verified)
- Breadcrumb navigation: Domain → Artifact Type → Document → Item

---

## 7. Implementation Priority & Sequencing

| Phase | Artifacts | Dependencies | Estimated Sprint |
|---|---|---|---|
| **Phase 1** | TAC (Test Cases as Code) | RAC schema pattern already exists | Sprint 11 |
| **Phase 2** | TER (Test Results as Code) | TAC format (test IDs must exist) | Sprint 12 |
| **Phase 3** | FAC (Features as Code) | None | Sprint 12 |
| **Phase 4** | Viewers & Traceability UI | All "as code" APIs must exist | Sprint 13-14 |
| **Phase 5** | Standardization (P4) | None (can parallelize) | Sprint 11 |

---

## 8. DoD Checklist

- [x] Evaluation report per artifact type with evidence
- [x] Gap analysis with priority ordering
- [x] Implementation plan with format specs, repo conventions, loader requirements, API exposure, priority, effort
- [x] V-Model alignment documented
- [x] Frontend visualization requirements included
