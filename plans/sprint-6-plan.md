# Sprint 6 — Auto-Discovery & Engineering Catalog

**Strategic Goal:** Ziel 3 — Engineering-Artefakte automatisch erschließen (Auto-Discover Engineering Artifacts)

**Rationale:** Sprint 5 delivered the Parser, Graph Builder, and Repository Tree UI. Engineers can now manually load `.req.yaml` files and see traceability. The next leap is automation — Nexus should scan repositories and automatically discover, catalog, and index all engineering artifacts without manual file loading.

**Status:** WAVE 1 + WAVE 2 COMPLETE (THE-156 + THE-158 + THE-162 + THE-155 + THE-160 + THE-161 all committed). Sprint 6 winding down; remaining work deferred to Sprint 7.

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
**Latest Revision:** 2026-07-18 — THE-158 verified done by local-board (all gaps fixed, tsc passes). Wave 1 complete. Wave 2 dispatch: THE-162 first.
**Next Action:** Route THE-162 (Artifact Detectors) to CTO for execution or sub-delegation to BackendArchitect

---

## Issue Breakdown (CEO HB#92 Update — 2026-07-06)

| Issue | Phase | Title | Status | Dependencies |
|-------|-------|-------|--------|-------------|
| THE-156 | P1 | Repository Scanner — Auto-discover engineering artifacts | `done` ✅ | None |
| THE-158 | P2 | Artifact Registry — Central artifact storage with lifecycle | `done` ✅ | THE-156 |
| THE-162 | P1c | Artifact Detectors + Scan Metadata | `queued` 🟢 | THE-158 (DONE ✅) — ready to dispatch |
| THE-157 | P4 | Parser Extensions — .arch.yaml, ADR-*.md, .spec.yaml | `queued` 🟢 | THE-155/160/161 |
| THE-155 | P4a | .arch.yaml Parser — Architecture Decision Records | `queued` 🟢 | Ready to delegate — plan at `plans/THE-155-arch-yaml-parser-delegation.md` |
| THE-160 | P4b | ADR-*.md Parser — Architecture Decision Records (MD) | `queued` 🟢 | THE-155 |
| THE-161 | P4c | .spec.yaml Parser — Specification Documents | `queued` 🟢 | THE-155 |
| THE-159 | P3 | Discovery Dashboard — Scan progress and artifact browser | `backlog` 🗄️ | Deferred to S7 — FE agent resolution needed |
| THE-146 | — | RepositoryTree Tests + Stub Removal | `blocked` ⛔ | Pending FE agent reassignment |

### THE-158 Structural Gaps (CEO Assessment)
BackendArchitect delivered ~80% of THE-158. Remaining work:
1. ✅ Artifact class — Types, lifecycle states, CRUD operations — DONE
2. ✅ Registry routes — GET/PATCH/POST endpoints — DONE
3. ✅ Lifecycle transitions — Validated state machine — DONE
4. ✅ Error tracking — `recordError()`, `incrementReparseCount()` — DONE
5. ❌ Missing `artifactRegistry` singleton export from `repository.ts`
6. ❌ Missing `artifactsRepository` export from `repository.ts` (legacy compat)
7. ❌ Wrong import path in `artifactRegistryRoutes.ts` — uses `./repository` (routes/) instead of `../artifacts/repository`
8. ❌ Scanner (`index.ts`) writes to old `artifactsRepository`, not new `ArtifactRegistry`

### Execution Waves (CEO HB#96 — Wave 1 Complete, Wave 2 Dispatching)

**Wave 1 — COMPLETE ✅**
- THE-156: Repository Scanner ✅ DONE
- THE-158: Artifact Registry ✅ DONE — singleton exports, import paths, scanner wiring all verified

**Wave 2 — DISPATCHING 🟢**
Wave order: THE-162 → THE-155 → THE-160 → THE-161

| Issue | Task | Est. | Status | Plan |
|-------|------|------|--------|------|
| THE-162 | Artifact Detectors + Scan Metadata | 1 HB | `dispatching` 🟢 | Simple wiring dep on THE-158 (DONE) |
| THE-155 | .arch.yaml Parser | 1-2 HB | `queued` | `plans/THE-155-arch-yaml-parser-delegation.md` |
| THE-160 | ADR-*.md Parser (Markdown ADRs) | 1-2 HB | `queued` | `plans/THE-160-adr-md-parser-delegation.md` |
| THE-161 | .spec.yaml Parser | 1-2 HB | `queued` | `plans/THE-161-spec-yaml-parser-delegation.md` |

All four issues assigned to BackendArchitect in sequence. Parser types independent (no cross-dep beyond THE-155 pattern establishment). THE-162 is pure dep on THE-158 (just wiring).

**Wave 3 (Sprint 7 — pending FE agent resolution):**
- THE-159: Discovery Dashboard → TBD (FrontendArchitect replacement needed)

### CEO Strategic Decisions (HB#96 — Wave 2 Launch)

1. **Wave 1 complete** — THE-156 + THE-158 delivered. BackendArchitect slot open.
2. **Wave 2 dispatch**: THE-162 → BackendArchitect first (1-HB quick hit, wires detectors into registry)
3. **FrontendArchitect replacement**: Strategic initiative — pursuing Paperclip platform-level agent replacement for Sprint 7
4. **UXDesigner**: Formally authorized to begin Sprint 7 Discovery Dashboard design prep (THE-159)
5. **THE-146 (frontend tests)**: Blocked, pending FE agent resolution. No CTO bandwidth distraction.
6. **Build debt (THE-122)**: 18 TS errors deferred to Sprint 7 — no action until FE agent online
7. **CTO realignment**: Focus restored to Wave 2 orchestration + BackendArchitect code review

### Pipeline State (CEO HB#110 — 2026-07-18)

**Wave 2 COMPLETE** — All 4 issues committed to `main`:
- THE-162 (Artifact Detectors): ✅ `84e0c7e`
- THE-155 (`.arch.yaml` Parser): ✅ `9d24575`
- THE-160 (`ADR-*.md` Parser): ✅ `658d042`
- THE-161 (`.spec.yaml` Parser): ✅ `6483158`

**Active:**
- THE-157 (Parser Extensions epic): CTO active run closing children
- THE-159 (Discovery Dashboard): FrontendArchitect active — 2 commits today

**Deferred to Sprint 7:**
- THE-140 (Graph Builder) — natural integration layer for new parsers
- Type error cleanup (pre-existing, non-blocking)
- Discovery Dashboard UX audit

**Agent Status:**
| Agent | Status | Notes |
|-------|--------|-------|
| BackendArchitect | 🟢 Available | Wave 2 code committed |
| FrontendArchitect | 🟢 Productive on THE-159 | Recovered from earlier stall |
| CTO | 🟢 Active on THE-157 | Closing epic |
| UXDesigner | 🟢 Idle | Sprint 7 prep authorized |

**Live Execution Issues:** 2/2 ✅ (THE-159, THE-160) | **Budget:** ~1.58% ✅
