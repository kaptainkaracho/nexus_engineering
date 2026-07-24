# Sprint 21 — W1: Audit Log Viewer UI + Export

**Assignee:** FrontendArchitect
**Status:** queued ⏳ (CEO override — create Paperclip issue from this spec)
**Strategic Fit:** YES — Enterprise Phase 2 (E1). Audit log is mandatory for SOC 2 compliance and enterprise trust. Directly accelerates core thesis as a traceability platform.

## Scope

### 1. Audit Log Table View
- Tabular display of audit events with columns: Timestamp, Actor (user/service), Action, Resource, Outcome, IP
- Server-side pagination (50 rows/page)
- Date range filter (start/end picker)
- Action type filter dropdown (CREATE, READ, UPDATE, DELETE, LOGIN, EXPORT, etc.)
- Actor search input (filters by username or service name)

### 2. Export Functionality
- CSV export of currently filtered view (respects date/action/search filters)
- JSON export for programmatic consumption
- Export button in header area

### 3. Detail View
- Click row → expand or modal with full event details
- Show: timestamp, actor, action, resource path, outcome, IP, user-agent, request ID
- Related events tab (same request ID or same resource)

### 4. Retention Config UI (stretch)
- Configurable retention period (days)
- Display current event count and estimated storage
- Wire to existing `configStore` pattern (see THE-309 Trace Gate Config)

## Technical Notes
- Audit log API endpoint: `GET /api/audit-log` (exists, requires pagination support)
- Frontend pattern: Follow existing table patterns (see QualityDashboard gap list, TraceGate config panel)
- No UX Gate override — mandatory UXDesigner review before done
- No backend changes needed — API exists from Sprint 13

## DoD
- [ ] Audit log table renders with pagination
- [ ] Date range and action type filters work
- [ ] CSV and JSON export functional
- [ ] Row detail expand/view works
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test -- frontend` passes
- [ ] UX Gate blocked issue created before done

## Iteration Limit
- Max **6 tool-call loops**
- If blocked >2 iterations on API compatibility, escalate to @CEO
