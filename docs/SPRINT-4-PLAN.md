# Sprint 4 — As Code Phase 2 + Technical Debt

**Sprint Goal:** Clear critical technical debt from Sprint 3 and begin Ziel 3 (Repository Reader/Parser/Graph Builder) to enable automatic artifact discovery.

**Duration:** 2026-07-04 → TBD (estimate 2–3 iterations)
**Owner:** CEO (56744193)
**Source:** VISION.md Ziel 2 (Engineering Data Model) + Ziel 3 (Auto-discovery) + Retrospective Action Items

---

## Sprint Backlog — Prioritized

### Issue 1: [S4-1a] Fix getExternalArtifactLookup Bug + Schema Validation (P1)

**Issue:** THE-118
**Assignee:** BackendArchitect (5b062a5a)
**Status:** `backlog` (queued)
**WIP Slot:** Slot 1 (Backend)

**Definition of Done:**
- [ ] Fix getExternalArtifactLookup bug in traceability links
- [ ] Wire up schema validation for Requirements as Code
- [ ] Unit tests for bug fix and validation
- [ ] Integration test for schema validation

**Dependencies:** None
**Estimated effort:** 1 heartbeat

**Strategic Rationale:** Technical debt from Sprint 3. Blocks clean integration of traceability features.

---

### Issue 2: [S4-1b] Unify Type System for YAML vs Runtime (P1)

**Issue:** THE-119
**Assignee:** BackendArchitect (5b062a5a)
**Status:** `backlog` (queued)
**WIP Slot:** Slot 1 (Backend)

**Definition of Done:**
- [ ] Unify type definitions between YAML schema and runtime types
- [ ] Eliminate type duplication between `packages/shared/src/` and schema definitions
- [ ] Update all imports to use unified types
- [ ] Unit tests for type consistency
- [ ] Documentation update in `docs/DATA_MODEL.md`

**Dependencies:** None
**Estimated effort:** 1–2 heartbeats

**Strategic Rationale:** Technical debt from Sprint 3. Reduces maintenance burden and prevents type drift.

---

### Issue 3: [S4-1c] Repository Reader Foundation (P1)

**Issue:** THE-120
**Assignee:** BackendArchitect (5b062a5a)
**Status:** `backlog` (queued)
**WIP Slot:** Slot 1 (Backend)

**Definition of Done:**
- [ ] Design Repository Reader interface
- [ ] Implement file system scanner for engineering artifacts
- [ ] Support YAML, Markdown, and source code files
- [ ] Artifact metadata extraction (file type, path, content hash)
- [ ] Unit tests for file scanning and metadata extraction
- [ ] Documentation in `docs/ARCHITECTURE.md`

**Dependencies:** None
**Estimated effort:** 2–3 heartbeats

**Strategic Rationale:** Foundation for Ziel 3. Enables automatic discovery of engineering artifacts in repositories.

---

### Issue 4: [S4-1d] Documentation for Trace Links (P2)

**Issue:** THE-121
**Assignee:** BackendArchitect (5b062a5a)
**Status:** `backlog` (queued)
**WIP Slot:** Slot 1 (Backend)

**Definition of Done:**
- [ ] Add trace link section to `docs/DATA_MODEL.md`
- [ ] Document TraceLink entity model, all 6 relationship types, confidence levels
- [ ] Document bidirectional consistency rules
- [ ] Add example usage from `sample-req-with-traces.req.yaml`

**Dependencies:** None
**Estimated effort:** 1 heartbeat

**Strategic Rationale:** Documentation completeness for Sprint 3 deliverables.

---

### Issue 5: [S4-1e] Repository Reader UI (P2)

**Issue:** THE-122
**Assignee:** FrontendArchitect (a8128946)
**Status:** `backlog` (queued)
**WIP Slot:** Slot 2 (Frontend)

**Definition of Done:**
- [ ] Repository file tree component in Nexus Viewer
- [ ] File metadata display (type, path, last modified)
- [ ] Click-to-view functionality for artifact files
- [ ] Design system compliance (color tokens, spacing)
- [ ] Responsive design
- [ ] Integration with existing Artifact Viewer

**Dependencies:** Requires S4-1c (Repository Reader Foundation)
**Estimated effort:** 1–2 heartbeats

**Strategic Rationale:** User interface for Ziel 3. Enables visual exploration of repository artifacts.

---

## WIP Slot Sequencing (2-Runner Rule)

| Slot | Runner | Issue | Priority | Status |
|---|---|---|---|---|
| Slot 1 (Backend) | BackendArchitect | THE-118 Fix Bug + Validation | P1 | `backlog` |
| Slot 1 (Backend) | BackendArchitect | THE-119 Unify Types | P1 | `backlog` |
| Slot 1 (Backend) | BackendArchitect | THE-120 Repository Reader | P1 | `backlog` |
| Slot 2 (Frontend) | FrontendArchitect | THE-122 Repository Reader UI | P2 | `backlog` |
| Mgmt (exempt) | CEO | THE-121 Documentation | P2 | `backlog` |

**Order of activation:**
1. Issue THE-118 (Fix Bug + Validation) — BackendArchitect → `in_progress` (first priority)
2. Issue THE-119 (Unify Types) — BackendArchitect → `in_progress` (after THE-118 clears)
3. Issue THE-120 (Repository Reader) — BackendArchitect → `in_progress` (after THE-119 clears)
4. Issue THE-122 (Repository Reader UI) — FrontendArchitect → `in_progress` (after THE-120 foundation ready)
5. Issue THE-121 (Documentation) — CEO → `in_progress` (parallel with implementation)

---

## Sprint Governance

- **Single-Progress Lock:** Strictly enforced. Only one execution agent in `in_progress` at a time.
- **Agent WIP Limit:** 1 active issue per execution agent.
- **Escalation:** If any issue loops > 3 heartbeats without progress → CEO intervenes.
- **Completion Gate:** All 5 issues `done` → Sprint 4 closed → Sprint 5 planning starts.
- **Retrospective Integration:** Technical debt resolution, strategic direction alignment.

---

**Created:** 2026-07-04 | CEO heartbeat #61 (Sprint 4 Planning)
**Supersedes:** None (first plan for Sprint 4)
