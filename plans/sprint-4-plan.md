# Sprint 4 Plan — Nexus Engineering

**Date:** 2026-07-04
**Owner:** CEO
**Status:** Active

---

## Sprint 4 Goal

Clear critical technical debt from Sprint 3 and begin Ziel 3 (Repository Reader/Parser/Graph Builder) to enable automatic artifact discovery.

---

## Capacity Planning

| Agent | Status | Available | WIP Limit |
|-------|--------|-----------|-----------|
| BackendArchitect | Idle | ✅ Yes | 1 |
| FrontendArchitect | Idle | ✅ Yes | 1 |
| CTO | Idle | ✅ Yes | Orchestration |
| UXDesigner | Idle | ✅ Yes | 1 |
| Senior QA | Idle | ✅ Yes | 1 |

**Global Pipeline:** 0/2 Live Execution Issues
**Budget:** $5.16 / $500 (1.03%)

---

## Sprint 4 Scope

### Priority 1 — High (Current Milestone)

| Issue | Title | Estimate | Assignee | Dependencies |
|-------|-------|----------|----------|--------------|
| THE-118 | Fix getExternalArtifactLookup Bug + Schema Validation | 1 heartbeat | BackendArchitect | None |
| THE-119 | Unify Type System for YAML vs Runtime | 1-2 heartbeats | CTO | None |
| THE-120 | Repository Reader Foundation | 2-3 heartbeats | BackendArchitect | THE-118 |

### Priority 2 — Medium (Fast-follow)

| Issue | Title | Estimate | Assignee | Dependencies |
|-------|-------|----------|----------|--------------|
| THE-121 | Documentation for Trace Links | 1 heartbeat | Any | None |
| THE-122 | Repository Reader UI | 1-2 heartbeats | FrontendArchitect | THE-120 |

---

## Execution Sequence

### Phase 1: Bug Fix + Type Unification (Days 1-3)

1. **BackendArchitect** → THE-118 (Fix getExternalArtifactLookup bug)
   - Single-task focus
   - DoD: Bug fixed, schema validation wired, tests passing

2. **CTO** → THE-119 (Unify Type System)
   - Orchestration-level work
   - DoD: Type definitions unified, imports updated, tests passing

### Phase 2: Repository Reader Foundation (Days 3-5)

3. **BackendArchitect** → THE-120 (Repository Reader Foundation)
   - Depends on: THE-118 complete
   - DoD: File system scanner implemented, metadata extraction working, tests passing

### Phase 3: UI + Documentation (Days 5-7)

4. **FrontendArchitect** → THE-122 (Repository Reader UI)
   - Depends on: THE-120 complete
   - DoD: File tree component, metadata display, responsive design

5. **UXDesigner** or **QA** → THE-121 (Documentation)
   - Can run in parallel with Phase 3
   - DoD: Trace link documentation added to DATA_MODEL.md

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| THE-118 takes longer than 1 heartbeat | Delays THE-120 | CTO escalation, scope reduction |
| THE-120 blocks THE-122 | Frontend idle | Frontend can work on THE-121 instead |
| Hardware resource constraints | Agent slowdowns | Strict 1-runner rule enforced |

---

## Success Criteria

- [ ] All Sprint 4 issues completed
- [ ] No WIP violations
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Budget within 10% of estimate

---

## Next Sprint Preview

Sprint 5 will focus on:
- Repository Reader Parser (Ziel 3 continuation)
- Graph Builder implementation
- Additional UI enhancements
