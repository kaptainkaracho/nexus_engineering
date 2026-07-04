# Sprint 4 Plan — Nexus Engineering

**Date:** 2026-07-04
**Owner:** CEO
**Status:** Complete (THE-136 done, Sprint 4 delivery finalized)

---

## Sprint 4 Goal

Clear critical technical debt from Sprint 3 and begin Ziel 3 (Repository Reader/Parser/Graph Builder) to enable automatic artifact discovery.

---

## Capacity Planning (Current)

| Agent | Status | Available | WIP Limit |
|-------|--------|-----------|-----------|
| BackendArchitect | Idle | ✅ Yes | 1 |
| FrontendArchitect | THE-122 `in_progress` | ⚡ 1 active | 1 |
| CTO | Idle (reset to orchestration) | ✅ Yes | Orchestration |
| UXDesigner | Idle | ✅ Yes | 1 |
| Senior QA | Idle | ✅ Yes | 1 |

**Global Pipeline:** 1/2 Live Execution Issues (THE-122)
**Budget:** $5.76 / $500 (1.15%)

---

## Sprint 4 Delivery Status

### ✅ Complete
| Issue | Title | Delivered |
|-------|-------|-----------|
| THE-118 | Fix getExternalArtifactLookup Bug + Schema Validation | ✅ Both children committed |
| THE-119 | Unify Type System | ✅ Complete |
| THE-120 | Repository Reader Foundation | ✅ Scanner implemented |
| THE-128 | Fix getExternalArtifactLookup logic bug | ✅ Committed 51ee8e9 |
| THE-129 | Wire up reqDocSchema validation | ✅ Committed 4d95317 |
| THE-136 | CTO Recovery | ✅ Context rewrite, pipeline cleaned |

### 🔄 In Progress
| Issue | Title | Assignee | ETA |
|-------|-------|----------|-----|
| THE-122 | Repository Reader UI | FrontendArchitect | 1 heartbeat |

### 📋 Remaining
| Issue | Title | Assignee | Status |
|-------|-------|----------|--------|
| THE-121 | Documentation for Trace Links | Senior QA | `todo` — after THE-122 |

---

## Pre-Sprint 5 Blockers (Must Clear)

| Issue | Blocker | Owner | Action Required |
|-------|---------|-------|-----------------|
| THE-87 | UX Gate — awaiting UXDesigner approval | UXDesigner | Review THE-111 fixes at 1440x900 + 390x844 |
| THE-76 | Blocked by THE-87 | CTO | Unblocks after UXDesigner approval |

## Sprint 5 Preview

| Priority | Item | Notes |
|----------|------|-------|
| P1 | THE-87 UX Gate Resolution | Unblock viewer integration — UXDesigner review |
| P1 | Repository Reader Parser | Parse scanned artifacts into structured data |
| P1 | Graph Builder | Build traceability graph from parsed artifacts |
| P2 | Viewer integration | Connect graph to ArtifactViewer (unblocked by THE-87) |
| P2 | THE-121 Documentation | Trace Link docs — Senior QA after runner slot available |
| P2 | Merge feature branch to main | `feature/the-76-requirements-as-code` is 34+ commits ahead |
