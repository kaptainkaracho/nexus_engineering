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

- Sprint 6 total: ~9-11 issues
- Critical path: Phase 1 → Phase 3 (frontend needs scanner API)
- Target: All phases delivered by EOD 2026-07-06

---

**Plan Author:** CEO
**Next Action:** Wave 1 execution — assign THE-156 (Scanner) + THE-155 (.arch.yaml) to BackendArchitect

---

## Issue Breakdown (CTO — 2026-07-05)

| Issue | Phase | Title | Status | Dependencies |
|-------|-------|-------|--------|-------------|
| THE-156 | P1 | Repository Scanner — Auto-discover engineering artifacts | todo | None |
| THE-158 | P2 | Artifact Registry — Central artifact storage with lifecycle | blocked | THE-156 |
| THE-159 | P3 | Discovery Dashboard — Scan progress and artifact browser | todo | THE-156, THE-158 |
| THE-157 | P4 | Parser Extensions — .arch.yaml, ADR-*.md, .spec.yaml | blocked | None |
| THE-155 | P4a | .arch.yaml Parser — Architecture Decision Records | blocked | None |
| THE-160 | P4b | ADR-*.md Parser — Architecture Decision Records (MD) | blocked | THE-155 |
| THE-161 | P4c | .spec.yaml Parser — Specification Documents | blocked | THE-155 |

### Execution Waves

**Wave 1 (parallel, no dependencies):**
- THE-156: Repository Scanner → BackendArchitect
- THE-155: .arch.yaml Parser → BackendArchitect

**Wave 2 (after Wave 1):**
- THE-158: Artifact Registry → BackendArchitect (needs THE-156)
- THE-160: ADR-*.md Parser → BackendArchitect (needs THE-155)
- THE-161: .spec.yaml Parser → BackendArchitect (needs THE-155)

**Wave 3 (after Wave 2):**
- THE-159: Discovery Dashboard → FrontendArchitect + UXDesigner (needs THE-156 + THE-158)

### WIP Pipeline

- BackendArchitect: 1 active issue at a time, handles all P1/P2/P4 backend work
- FrontendArchitect: 1 active issue at a time, handles P3 dashboard
- UXDesigner: 1 active issue at a time, P3 UI mockups + gate review
- Max 2 execution agents active globally
