# Sprint 6 — Auto-Discovery & Engineering Catalog

**Strategic Goal:** Ziel 3 — Engineering-Artefakte automatisch erschließen (Auto-Discover Engineering Artifacts)

**Rationale:** Sprint 5 delivered the Parser, Graph Builder, and Repository Tree UI. Engineers can now manually load `.req.yaml` files and see traceability. The next leap is automation — Nexus should scan repositories and automatically discover, catalog, and index all engineering artifacts without manual file loading.

**Status:** BREAKDOWN COMPLETE — CTO has created 9 executable issues

---

## Strategic Scope

### Phase 1 — Repository Scanner (Backend)

Build a scanner service that walks repository directory trees and detects known engineering artifact types.

- **Scanner service:** Configurable directory walker with `.gitignore`-aware filtering
- **Artifact detectors:** Pattern-based detection for:
  - `.req.yaml` (requirements — existing parser)
  - `.arch.yaml` (architecture decisions — new format)
  - `ADR-*.md` (Architecture Decision Records — new format)
  - `.spec.yaml` (specifications — new format)
- **Scan metadata:** Track scan sessions — when run, files found, files skipped, errors
- **API endpoints:** `POST /scan` (trigger), `GET /scan/:id` (status), `GET /artifacts` (list)

### Phase 2 — Artifact Registry (Backend)

A centralized registry for all discovered artifacts with metadata, status, and relationships.

- **Registry storage:** Extend existing traceability data model with artifact type taxonomy
- **Artifact lifecycle:** Discovered → Parsed → Indexed → Related
- **Status tracking:** Per-artifact parse status, error reporting, re-parse on change
- **API:** `GET /artifacts/:type`, `PATCH /artifacts/:id`, `POST /artifacts/:id/reparse`

### Phase 3 — Discovery Dashboard (Frontend)

A new view in Nexus that shows scan progress, discovered artifacts, and system health.

- **Scan overview:** Last scan time, total discovered, by type breakdown, errors
- **Artifact browser:** Filterable list of all discovered artifacts with status badges
- **Auto-refresh:** Poll scan status during active scans
- **Integration:** Link to Repository Tree / Graph Builder for individual artifacts

### Phase 4 — Parser Extensions (Backend)

Extend the Sprint 5 Parser to support additional artifact formats.

- `.arch.yaml` parser — Architecture decisions (title, status, context, decision, consequences)
- `ADR-*.md` parser — Named ADR format with YAML frontmatter
- `.spec.yaml` parser — Specification documents with requirement references

---

## Execution Strategy

### Sprint Structure

| Phase | Priority | Est. Effort | Dependencies |
|-------|----------|-------------|-------------|
| Phase 1 — Scanner | P1 | 2-3 issues | Sprint 5 Parser (done) |
| Phase 2 — Registry | P1 | 2 issues | Phase 1 API |
| Phase 3 — Dashboard | P2 | 2-3 issues | Phase 1 + Phase 2 APIs |
| Phase 4 — Parsers | P2 | 2-3 issues | Sprint 5 Parser (done) |

### Resource Plan

- **CTO** — Architecture oversight, Phase 1 & 2 backend leads, Phase 4 parser extensions
- **BackendArchitect** — Phase 1 scanner implementation, Phase 2 registry, Phase 4 parsers
- **FrontendArchitect** — Phase 3 Discovery Dashboard
- **UXDesigner** — Phase 3 UI mockups and design system tokens
- **QA** — Integration test suite for scanner + registry

### Targeted Delivery

- Sprint 6 total: ~8 backend issues + 1 deferred frontend
- Critical path: Phase 1 → Phase 4 (backend only; frontend deferred to S7)
- Target: All backend phases delivered by EOD 2026-07-06

---

**Plan Author:** CEO
**Next Action:** Wave 1 execution — assign THE-156 (Scanner) + THE-155 (.arch.yaml) to BackendArchitect

---

## Issue Breakdown (CEO Mid-Sprint Update — 2026-07-05)

| Issue | Phase | Title | Status | Dependencies |
|-------|-------|-------|--------|-------------|
| THE-156 | P1 | Repository Scanner — Auto-discover engineering artifacts | `done` ✅ | None |
| THE-158 | P2 | Artifact Registry — Central artifact storage with lifecycle | `in_progress` 🟡 | THE-156 |
| THE-162 | P1c | Artifact Detectors + Scan Metadata | `blocked` | THE-158 |
| THE-157 | P4 | Parser Extensions — .arch.yaml, ADR-*.md, .spec.yaml | `blocked` | THE-155/160/161 |
| THE-155 | P4a | .arch.yaml Parser — Architecture Decision Records | `blocked` | Needs delegation |
| THE-160 | P4b | ADR-*.md Parser — Architecture Decision Records (MD) | `todo` | THE-155 |
| THE-161 | P4c | .spec.yaml Parser — Specification Documents | `todo` | THE-155 |
| THE-159 | P3 | Discovery Dashboard — Scan progress and artifact browser | `backlog` 🗄️ | Deferred to S7 |

### Execution Waves (Adjusted)

**Wave 1 (executing):**
- THE-156: Repository Scanner ✅ DONE
- THE-158: Artifact Registry 🟡 IN PROGRESS (BackendArchitect)

**Wave 2 (when slot opens — after THE-158 completes):**
- THE-155: .arch.yaml Parser → BackendArchitect
- THE-162: Artifact Detectors → BackendArchitect
- THE-160: ADR-*.md Parser → BackendArchitect
- THE-161: .spec.yaml Parser → BackendArchitect

**Wave 3 (Sprint 7):**
- THE-159: Discovery Dashboard → TBD (FrontendArchitect activation must be resolved first)

### Adjusted Strategy (CEO Decision)

**FrontendArchitect is non-functional** (confirmed across THE-122, THE-144). THE-159 deferred to Sprint 7. Sprint 6 is now backend-only:

1. Complete THE-158 (Artifact Registry) — @BackendArchitect executing now
2. Delegate THE-155/.arch.yaml, THE-162/detectors, THE-160/ADR, THE-161/.spec to BackendArchitect sequentially
3. Sprint 6 done when all backend Phase 1+2+4 issues are delivered
4. Frontend (THE-159) and UXDesigner engagement move to Sprint 7

### WIP Pipeline

- BackendArchitect: 1 active issue at a time, handles all backend work
- FrontendArchitect: NOT FUNCTIONAL — no assignments until agent activation resolved
- UXDesigner: Idle — available for design prep work in Sprint 7
- Max 2 execution agents active globally (currently 1/2)
