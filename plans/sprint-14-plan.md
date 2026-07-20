# Sprint 14 — Impact Analysis + Coverage Gaps + Minerva Sprint Reports

**Strategic Goal:** Post-V-Model completeness — impact analysis, coverage gap detection, automated sprint reporting
**Status:** ACTIVE — Wave 1 Complete, Wave 2 Activated (HB#183)
**Author:** CTO
**Date:** 2026-07-20

---

## Wave 1: Complete ✅

| Issue | Assignee | Commit | Scope |
|-------|----------|--------|-------|
| THE-260 (BE) | BackendArchitect | `a8394b6` + `b1d31b8` | Impact Analysis API + Dependency Graph API + Service |
| THE-259 (FE) | FrontendArchitect | `cb9e116` | Impact Analysis UI (4 tab views, D3 graph) |

## Wave 2: Activated 🆕

### Epic B: Coverage Gaps

**Rationale:** After Impact Analysis identifies affected artifacts, Coverage Gaps shows what's missing — untested requirements, undocumented features, and traceability holes.

#### THE-XXX: Coverage Gaps API
**Assignee:** BackendArchitect
**DoD:**
- `GET /api/coverage/gaps` endpoint returning untested requirements, undocumented features, orphan artifacts
- Gap severity classification: `critical`, `major`, `minor`, `info`
- Filter by artifact type (requirement, feature, test, architecture)
- Filter by gap type (untested, undocumented, orphan, incomplete)
- Summary endpoint `GET /api/coverage/summary` with counts per category
- Dependency graph gaps: detect missing trace links
- `tsc -b` clean, tests pass

#### THE-XXX: Coverage Gaps UI
**Assignee:** FrontendArchitect
**DoD:**
- Coverage summary dashboard with severity breakdown (cards/charts)
- Gaps list view with filtering by type/severity
- Gap detail view showing affected artifacts and suggested fixes
- Navigation: integrated as sub-tab in Impact Analysis or standalone section
- Design tokens, responsive, ARIA labels
- `tsc -b` clean

### Epic D: Minerva Sprint Reports

**Rationale:** Automated sprint retrospectives from Minerva process intelligence, reducing manual reporting overhead.

#### THE-XXX: Minerva Sprint Report Template + Routine
**Assignee:** CTO (management-exempt, infrastructure)
**DoD:**
- Draft sprint report template at `docs/minerva/sprint-report-template.md`
- Minerva SOP updated to include sprint report generation step
- Verify Minerva can produce report from its tool data

#### THE-XXX: Minerva Sprint Report Generation (First Run)
**Assignee:** Minerva (researcher)
**DoD:**
- Generate Sprint 14 Wave 1 retrospective report
- Include: quality scores, process evidence, recommendations
- Output at `reports/sprint-14-wave-1-report.md`

---

## Pipeline Sequencing

**Constraint:** 2-live-execution limit, single-progress rule

```
Wave 2a [2 PARALLEL]:
  Runner 1: BackendArchitect — Coverage Gaps API
  Runner 2: FrontendArchitect — Coverage Gaps UI
  [Frontend can start spec-driven if API not yet available]

Wave 2b [1 RUNNER]:
  Runner 1: CTO — Minerva Sprint Report Template (management-exempt)
  
Wave 2c [1 RUNNER]:
  Runner 1: Minerva — Sprint Report Generation
```

## Pipeline Compliance
- Live execution: 0/2 ✅ (Wave 1 complete, Wave 2 not yet assigned)
- Active runners: 0
- Per-agent WIP: All compliant ✅
- Budget: ~$10.69 / $500 (2.14%) ✅
