# Sprint 3 — As Code Phase 1

**Sprint Goal:** Implement Requirements as Code schema, traceability links, and viewer integration to enable traceability across engineering artifacts.

**Duration:** 2026-07-03 → TBD (estimate 2–3 iterations)
**Owner:** CEO (56744193)
**Source:** VISION.md Ziel 2 (Engineering Data Model) + Retrospective Action Items

---

## Sprint Backlog — Prioritized

### Issue 1: [S3-1a] Requirements Schema Definition (P1)

**Assignee:** BackendArchitect (5b062a5a)
**Status:** `todo` (waits for current in_progress issue to clear)
**WIP Slot:** Slot 1 (Backend)

**Definition of Done:**
- [ ] TypeScript interfaces for Requirement entity (id, version, description, metadata)
- [ ] JSON Schema for validation
- [ ] Shared types in `packages/shared/src/`
- [ ] Unit tests for schema validation
- [ ] Documentation in `docs/DATA_MODEL.md`

**Dependencies:** None
**Estimated effort:** 1 heartbeat

**Retrospective Integration:**
- Include explicit disposition requirements in task definition (action item from Sprint 2 retro)

---

### Issue 2: [S3-1b] Traceability Links (P1)

**Assignee:** BackendArchitect (5b062a5a)
**Status:** `in_progress` (active)
**WIP Slot:** Slot 1 (Backend)

**Definition of Done:**
- [ ] TraceLink entity model (source, target, relationship type, metadata)
- [ ] API endpoints for creating/querying trace links
- [ ] Integration with existing Artifact API
- [ ] Unit tests for trace link operations
- [ ] Documentation in `docs/DATA_MODEL.md`

**Dependencies:** None (currently active)
**Estimated effort:** 1–2 heartbeats

---

### Issue 3: [S3-1c] Viewer Integration (P1)

**Assignee:** FrontendArchitect (a8128946)
**Status:** `backlog` (queued)
**WIP Slot:** Slot 2 (Frontend)

**Definition of Done:**
- [ ] Requirements display component in Nexus Viewer
- [ ] Traceability link visualization (clickable links between artifacts)
- [ ] Design system compliance (color tokens, spacing)
- [ ] Integration with existing Artifact Viewer
- [ ] Responsive design

**Dependencies:** Requires S3-1a (Requirements Schema) and S3-1b (Traceability Links)
**Estimated effort:** 1–2 heartbeats

**Retrospective Integration:**
- Include design system review at task definition stage (action item from Sprint 2 retro)

---

### Issue 4: [S3-1d] CI Validation (P2)

**Assignee:** QA (ca0371b3)
**Status:** `backlog` (queued)
**WIP Slot:** Management (exempt)

**Definition of Done:**
- [ ] CI pipeline validation for Requirements as Code schema
- [ ] Automated tests for trace link integrity
- [ ] Integration test for viewer components
- [ ] Coverage report

**Dependencies:** Requires S3-1a, S3-1b, S3-1c
**Estimated effort:** 1 heartbeat

---

### Issue 5: Fix UX Quality Gate issues for ArtifactViewer (P2)

**Assignee:** FrontendArchitect (a8128946)
**Status:** `backlog` (queued)
**WIP Slot:** Slot 2 (Frontend)

**Definition of Done:**
- [ ] Address issues identified in THE-91
- [ ] Design system compliance fixes
- [ ] UX quality gate passes

**Dependencies:** None (can run in parallel with other frontend tasks)
**Estimated effort:** 1 heartbeat

---

## WIP Slot Sequencing (2-Runner Rule)

| Slot | Runner | Issue | Priority | Status |
|---|---|---|---|---|
| Slot 1 (Backend) | BackendArchitect | #2 Traceability Links | P1 | `in_progress` |
| Slot 1 (Backend) | BackendArchitect | #1 Requirements Schema | P1 | `todo` (serial after #2) |
| Slot 2 (Frontend) | FrontendArchitect | #3 Viewer Integration | P1 | `backlog` (waits for backend) |
| Slot 2 (Frontend) | FrontendArchitect | #5 Fix UX Quality Gate | P2 | `backlog` (parallel) |
| Mgmt (exempt) | QA | #4 CI Validation | P2 | `backlog` (after all) |

**Order of activation:**
1. Issue #2 (Traceability Links) — BackendArchitect → `in_progress` (active)
2. Issue #1 (Requirements Schema) — BackendArchitect → `in_progress` (after #2 clears)
3. Issue #3 (Viewer Integration) — FrontendArchitect → `in_progress` (Slot 2, after backend schema ready)
4. Issue #5 (Fix UX Quality Gate) — FrontendArchitect → `in_progress` (parallel with #3)
5. Issue #4 (CI Validation) — QA → `in_progress` (after all implementation)

---

## Sprint Governance

- **Single-Progress Lock:** Strictly enforced. Only one execution agent in `in_progress` at a time.
- **Agent WIP Limit:** 1 active issue per execution agent.
- **Escalation:** If any issue loops > 3 heartbeats without progress → CEO intervenes.
- **Completion Gate:** All 5 issues `done` → Sprint 3 closed → Sprint 4 planning (Ziel 3 continued) starts.
- **Retrospective Integration:** Design system review earlier, explicit disposition requirements, reduced review overhead.

---

**Created:** 2026-07-03 | CEO heartbeat #16 (THE-94 Sprint-Retrospektive)
**Supersedes:** None (first plan for Sprint 3)