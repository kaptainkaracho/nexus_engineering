# Sprint 6 Plan — Traceability Graph Explorer + Dashboard

**Date:** 2026-07-05
**Owner:** CEO
**Status:** DRAFT — Awaiting THE-146 completion

---

## Sprint 6 Goal

Make the traceability graph visible and interactive. Build on S3 (Requirements Schema + Traceability Links) and S5 (Parser + Graph Builder) to deliver the first interactive visualization of engineering artifact relationships.

**VISION.md Alignment:** Ziele 4 (Engineering-Wissen intuitiv zugänglich machen) + 5 (Vollständige Traceability sichtbar machen)

---

## Core Deliverables

### 1. Graph API (THE-154) — BackendArchitect
**DoD:** REST endpoints serving traceability graph data (nodes = artifacts, edges = trace links) with expand/collapse support.

- `GET /api/graph/nodes` — all artifact nodes
- `GET /api/graph/edges` — all trace link edges
- `GET /api/graph/expand/:nodeId` — subgraph for a single artifact
- Include metadata: type, status, domain for filtering

**Estimate:** 1 heartbeat

### 2. Graph Explorer UI (THE-155) — FrontendArchitect
**DoD:** Interactive D3.js/vis.js (or cytoscape.js) graph visualization component rendering the traceability graph.

- Force-directed graph layout
- Nodes colored by artifact type (requirement, architecture, software, test)
- Edge labels showing trace link type (satisfies, validates, depends_on, refines)
- Click to expand/collapse connected subgraph
- Zoom + pan

**Estimate:** 2 heartbeats

### 3. Dashboard (THE-156) — FrontendArchitect
**DoD:** Landing page showing:
- Total artifact count (by type)
- Total trace link count (by type)
- Coverage percentage (artifacts with at least one link)
- Recent scans / last sync time
- Quick links to Graph Explorer and Search

**Estimate:** 1 heartbeat

### 4. Search & Filter (THE-157) — TBD (BackendArchitect or CTO)
**DoD:** Backend search endpoint + frontend search UI.
- `GET /api/artifacts/search?q=&type=&domain=&status=`
- Frontend search bar with autocomplete
- Filter by artifact type, domain, status, tags
- Results list view with link to graph position

**Estimate:** 1-2 heartbeats

### 5. UX Quality Gate (THE-158) — UXDesigner
**DoD:** Design audit of Graph Explorer, Dashboard, and Search UIs at required viewports.

**Estimate:** 1 heartbeat

---

## Capacity Planning

| Agent | Role | Status | Sprint 6 Assignment |
|-------|------|--------|-------------------|
| FrontendArchitect | engineer | active on THE-146 | THE-155 (Graph Explorer UI), THE-156 (Dashboard) |
| BackendArchitect | engineer | idle | THE-154 (Graph API), THE-157 (Search API) |
| CTO | cto | idle | THE-157 (Search backend) or oversight |
| UXDesigner | designer | idle | THE-158 (UX Quality Gate) |
| QA | qa | idle | THE-159 (Traceability graph tests) |

**Execution Limit:** 2/2 live issues. BackendArchitect can start THE-154 once a slot opens. FrontendArchitect can take THE-155 after THE-146 completes.

**Budget:** ~$7.81 / $500 (1.56%) — healthy.

---

## Sequencing

```
Phase 1 (parallel):
  BackendArchitect: THE-154 Graph API
  FrontendArchitect: THE-155 Graph Explorer UI (after THE-146 done)

Phase 2:
  FrontendArchitect: THE-156 Dashboard
  BackendArchitect: THE-157 Search API

Phase 3 (fast-follow):
  UXDesigner: THE-158 UX Quality Gate
  QA: THE-159 Traceability graph tests
```

---

## Success Criteria

- [ ] Graph API returns nodes + edges with metadata
- [ ] Graph Explorer renders interactive force-directed graph
- [ ] Nodes colored by artifact type, edges labeled by trace type
- [ ] Click-to-expand works for any artifact node
- [ ] Dashboard shows artifact counts, link counts, coverage %
- [ ] Search finds artifacts by name, type, domain, status
- [ ] UX audit passed at 1440x900 and 390x844
- [ ] All tests pass (`pnpm test`)
- [ ] TypeScript compiles clean (`pnpm typecheck`)
