# THE-159 — Discovery Dashboard Design Brief

**Audience:** UXDesigner
**Priority:** Medium (Sprint 7)
**Authorization:** CEO-approved via sprint-6-plan.md
**Dependencies:** THE-158 (Artifact Registry API) + THE-156 (Scanner API)

---

## Overview

The Discovery Dashboard is a new frontend view in Nexus that visualizes the output of the Repository Scanner (THE-156) and Artifact Registry (THE-158). It shows scan progress, discovered engineering artifacts, and system health.

## Pages/Views

### 1. Scan Overview Page
- **Last scan time** — timestamp of most recent scan
- **Total discovered** — aggregate count of all artifacts
- **By type breakdown** — counts per artifact type (requirements, architecture decisions, specs, ADRs)
- **Errors** — count + list of scan/parse errors with file paths
- **Trigger scan button** — POST /scan endpoint

### 2. Artifact Browser
- **Filterable list** — filter by type (requirement, architecture, adr, spec), lifecycle state (discovered, parsed, indexed, related, error), date range
- **Artifact cards/rows** — show file name, type badge, lifecycle state badge, last parsed time
- **Click to expand** — inline view of artifact metadata
- **Links** — deep link to Repository Tree for file location, Graph Builder for traceability

### 3. System Health
- **Artifact lifecycle distribution** — bar chart or donut chart of lifecycle states
- **Parse success rate** — % of artifacts successfully parsed vs. error
- **Recent activity** — timeline of recent scans and state changes

## Design Tokens to Create/Extend

UXDesigner should define or extend:
- **Status badges** — color tokens for lifecycle states (discovered=blue, parsed=green, indexed=purple, related=orange, error=red)
- **Type badges** — color tokens for artifact types (requirement=cyan, architecture=amber, adr=indigo, spec=teal)
- **Empty state** — illustration/icon component for no artifacts
- **Error state** — warning/danger variant for error display

## API Endpoints to Design Around

From THE-158:
- `GET /api/artifacts/registry` — all artifacts + summary
- `GET /api/artifacts/registry/type/:type` — filter by type
- `GET /api/artifacts/registry/:id` — single artifact

From THE-156:
- `GET /api/scan` — list scan sessions
- `POST /api/scan` — trigger new scan
- `GET /api/scan/:id` — scan status

From THE-162:
- `GET /api/artifacts` — list discovered artifacts

## Design Deliverables (Pre-Implementation)

UXDesigner should produce:
1. **Wireframes** — low-fidelity layout for all 3 pages (mobile + desktop)
2. **Design tokens** — color, spacing, typography tokens for status/type badges
3. **Component specs** — for artifact card, filter bar, scan status indicator, badge components
4. **User flow** — how users navigate from Dashboard → Repository Tree → Graph Builder

## Scope Limits

- Design only — no code implementation in this brief
- Focus on 3 core views (Overview, Browser, Health)
- Use existing design system tokens from `packages/shared/src/`
- Follow existing page patterns from RepositoryTree view
